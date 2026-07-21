package daeco.demo_service.Service;

import daeco.demo_service.DTO.LlmRouteDTO.LlmRoute;
import daeco.demo_service.DTO.LlmRouteDTO.LlmRoute.LlmStop;
import daeco.demo_service.DTO.ResponseDTO.Stopover;
import daeco.demo_service.DTO.ResponseDTO.Stopover.StopoverDetail;
import daeco.demo_service.Client.KakaoMapClient;
import daeco.demo_service.Client.KakaoMapClient.Coord;
import daeco.demo_service.Client.KakaoMapClient.LegResult;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

/**
 * LLM이 낸 장소 코스를 받아, 카카오 API로 실제 이동시간을 구하고
 * 도착시각을 코드에서 누적 계산한다.
 * 마감 초과 시: (1) 체류시간 압축 -> (2) 경유지 축소 순으로 조정.
 * 조정으로도 불가능하면 실패 사유(String)를 담아 반환(=재요청 트리거).
 */
@Component
public class RouteBuilder {

    // 체류시간 압축 시 보장할 최소 체류시간(분)
    private static final int MIN_STAY_MINUTES = 30;

    private final KakaoMapClient kakao;

    public RouteBuilder(KakaoMapClient kakao) {
        this.kakao = kakao;
    }

    /** 빌드 결과: 성공 시 stopover, 실패 시 failureReason(수치 포함) */
    public record BuildResult(Stopover stopover, String failureReason) {
        public boolean isSuccess() { return stopover != null; }
    }

    public BuildResult build(LlmRoute route,
                             String startLocationName,
                             String arriveLocationName,
                             LocalTime startTime,
                             LocalTime deadline,
                             List<String> preferModes,
                             int budgetLimit) {

        // 선호 이동수단 리스트 중 첫 번째를 대표 수단으로 사용.
        // (리스트가 비어 있으면 버스를 기본값으로)
        String mode = (preferModes == null || preferModes.isEmpty())
                ? "버스" : preferModes.get(0);

        // 1) 출발지 + 복귀지 + 각 경유지 좌표 확보. 하나라도 못 찾으면 실패.
        Coord startCoord = kakao.searchPlace(startLocationName);
        if (startCoord == null) {
            return new BuildResult(null, "출발지 '" + startLocationName + "' 좌표를 찾을 수 없음");
        }
        Coord arriveCoord = kakao.searchPlace(arriveLocationName);
        if (arriveCoord == null) {
            return new BuildResult(null, "복귀지 '" + arriveLocationName + "' 좌표를 찾을 수 없음");
        }

        List<LlmStop> rawStops = new ArrayList<>(route.stops());

        // 출발지 또는 복귀지와 이름이 겹치는 경유지 제거
        List<LlmStop> stops = new ArrayList<>();
        for (LlmStop s : rawStops) {
            if (isSamePlace(s.locationName(), startLocationName)
                    || isSamePlace(s.locationName(), arriveLocationName)) {
                continue; // 출발지/복귀지와 동일 -> 건너뜀
            }
            stops.add(s);
        }
        if (stops.isEmpty()) {
            return new BuildResult(null, "출발지를 제외하니 방문할 경유지가 없음");
        }

        List<Coord> coords = new ArrayList<>();
        for (LlmStop s : stops) {
            Coord c = kakao.searchPlace(s.locationName());
            if (c == null) {
                return new BuildResult(null,
                        "장소 '" + s.locationName() + "' 는 대전에서 찾을 수 없음(실존하지 않거나 명칭 오류)");
            }
            coords.add(c);
        }

        // 2) 조정 루프: 체류 압축 -> 경유지 축소
        //    최대 (경유지 수) 번까지 축소 시도
        for (int attempt = 0; ; attempt++) {
            Attempt a = tryAssemble(startCoord, startTime, coords, stops, mode,
                    startLocationName, arriveCoord, arriveLocationName);
            if (a.error != null) {
                return new BuildResult(null, a.error); // 카카오 호출 실패 등
            }

            LocalTime finish = a.details.isEmpty()
                    ? startTime
                    : a.details.get(a.details.size() - 1).arriveAsTime();

            int totalBudget = a.stayBudget + a.transportBudget;

            boolean timeOk = !finish.isAfter(deadline);
            boolean budgetOk = totalBudget <= budgetLimit;

            if (timeOk && budgetOk) {
                return new BuildResult(toStopover(a, stops.size()), null);
            }

            // --- 조정 시도 ---
            long overMin = timeOk ? 0 : ChronoUnit.MINUTES.between(deadline, finish);

            // (1) 체류시간 압축: 마감 초과분을 각 체류시간에서 비례 차감 (최소 10분 보장)
            if (!timeOk && attempt == 0 && canCompress(stops, overMin)) {
                stops = compressStay(stops, overMin);
                continue; // 다시 조립
            }

            // (2) 경유지 축소: 마지막 경유지 하나 제거 (2곳 미만이면 중단)
            if (stops.size() > 1 && (!timeOk || !budgetOk)) {
                stops = new ArrayList<>(stops.subList(0, stops.size() - 1));
                coords = new ArrayList<>(coords.subList(0, coords.size() - 1));
                continue;
            }

            // 더 줄일 수 없음 -> 실패 사유를 수치와 함께 반환 (LLM 재요청용)
            String reason;
            if (!timeOk) {
                reason = String.format(
                        "마감 %s 을 %d분 초과. 출발지에서 더 가깝거나 체류가 짧은 장소로 재구성 필요.",
                        deadline, overMin);
            } else {
                reason = String.format(
                        "총 예산 %d원이 한도 %d원 초과. 입장료 없는 장소 위주로 재구성 필요.",
                        totalBudget, budgetLimit);
            }
            return new BuildResult(null, reason);
        }
    }

    // ---- 내부 조립 ----

    private static class Attempt {
        List<Detail> details = new ArrayList<>();
        int stayBudget = 0;
        int transportBudget = 0;
        double totalKm = 0;
        int totalMoveMin = 0;
        int totalStayMin = 0;
        String error = null;
    }

    private record Detail(int sequence, LocalTime arrive, String name, int stayMin,
                          boolean fee, String reason, int budget,
                          String mode, int moveMin, double km, String imageUrl) {
        LocalTime arriveAsTime() { return arrive; }
    }

    private Attempt tryAssemble(Coord startCoord, LocalTime startTime,
                                List<Coord> coords, List<LlmStop> stops, String mode,
                                String startName, Coord arriveCoord, String arriveName) {
        Attempt a = new Attempt();

        // sequence 0: 출발지 (이동시간/거리 0, 체류 0)
        a.details.add(new Detail(
                0, startTime, startName, 0,
                false, "여행이 시작되는 출발지입니다.", 0,
                mode, 0, 0.0, null
        ));

        Coord prev = startCoord;
        LocalTime cursor = startTime;

        for (int i = 0; i < stops.size(); i++) {
            LlmStop s = stops.get(i);
            Coord cur = coords.get(i);

            LegResult leg = kakao.route(prev, cur, mode);

            LocalTime arrive = cursor.plusMinutes(leg.minutes());
            int stay = s.recommendStayMinutes();

            a.details.add(new Detail(
                    i + 1, arrive, s.locationName(), stay,
                    s.entranceFee(), s.recommendReason(),
                    s.estimatedBudget() + leg.fare(), // 이 구간 지출 = 장소지출 + 교통비
                    mode, leg.minutes(), leg.km(), null
            ));

            a.stayBudget += s.estimatedBudget();
            a.transportBudget += leg.fare();
            a.totalKm += leg.km();
            a.totalMoveMin += leg.minutes();
            a.totalStayMin += stay;

            cursor = arrive.plusMinutes(stay); // 다음 출발 = 도착 + 체류
            prev = cur;
        }

        // 마지막 경유지 -> 복귀지 구간 추가 (체류 0)
        LegResult back = kakao.route(prev, arriveCoord, mode);
        LocalTime backArrive = cursor.plusMinutes(back.minutes());
        a.details.add(new Detail(
                stops.size() + 1, backArrive, arriveName, 0,
                false, "여행을 마치고 복귀하는 지점입니다.", back.fare(),
                mode, back.minutes(), back.km(), null
        ));
        a.transportBudget += back.fare();
        a.totalKm += back.km();
        a.totalMoveMin += back.minutes();

        return a;
    }

    /** 두 장소 이름이 사실상 같은지 (공백 제거 후 포함관계면 동일 취급) */
    private boolean isSamePlace(String a, String b) {
        if (a == null || b == null) return false;
        String x = a.replaceAll("\\s+", "");
        String y = b.replaceAll("\\s+", "");
        return x.contains(y) || y.contains(x);
    }

    private boolean canCompress(List<LlmStop> stops, long overMin) {
        int flexible = 0;
        for (LlmStop s : stops) flexible += Math.max(0, s.recommendStayMinutes() - MIN_STAY_MINUTES);
        return flexible >= overMin;
    }

    private List<LlmStop> compressStay(List<LlmStop> stops, long overMin) {
        int totalFlexible = 0;
        for (LlmStop s : stops) totalFlexible += Math.max(0, s.recommendStayMinutes() - MIN_STAY_MINUTES);
        List<LlmStop> out = new ArrayList<>();
        long remaining = overMin;
        for (LlmStop s : stops) {
            int flex = Math.max(0, s.recommendStayMinutes() - MIN_STAY_MINUTES);
            int cut = totalFlexible == 0 ? 0 : (int) Math.round((double) flex / totalFlexible * overMin);
            cut = (int) Math.min(cut, remaining);
            remaining -= cut;
            out.add(new LlmStop(s.sequence(), s.locationName(),
                    s.recommendStayMinutes() - cut, s.entranceFee(),
                    s.recommendReason(), s.estimatedBudget()));
        }
        return out;
    }

    private Stopover toStopover(Attempt a, int originalCount) {
        List<StopoverDetail> list = new ArrayList<>();
        int lastIdx = a.details.size() - 1;
        for (int idx = 0; idx < a.details.size(); idx++) {
            Detail d = a.details.get(idx);

            // 출발지(첫)와 복귀지(마지막)는 이미지 검색 안 함. 경유지만 검색.
            String imageUrl = null;
            if (idx != 0 && idx != lastIdx) {
                imageUrl = kakao.searchImageUrl(d.name());
            }

            list.add(new StopoverDetail(
                    d.sequence(),
                    d.arrive().withSecond(0).toString().length() == 5
                            ? d.arrive().toString() + ":00" : d.arrive().toString(),
                    d.name(),
                    minToHms(d.stayMin()),
                    d.fee(),
                    d.reason(),
                    d.budget(),
                    d.mode(),
                    LocalTime.of(d.moveMin() / 60, d.moveMin() % 60),
                    d.km(),
                    imageUrl
            ));
        }
        return new Stopover(
                list.size(),
                list,
                minToHms(a.totalStayMin + a.totalMoveMin) != null
                        ? LocalTime.of((a.totalStayMin + a.totalMoveMin) / 60, (a.totalStayMin + a.totalMoveMin) % 60)
                        : LocalTime.MIDNIGHT,
                LocalTime.of(a.totalStayMin / 60, a.totalStayMin % 60),
                LocalTime.of(a.totalMoveMin / 60, a.totalMoveMin % 60),
                Math.round(a.totalKm * 10) / 10.0,
                a.stayBudget + a.transportBudget
        );
    }

    private static String minToHms(int min) {
        return String.format("%02d:%02d:00", min / 60, min % 60);
    }
}