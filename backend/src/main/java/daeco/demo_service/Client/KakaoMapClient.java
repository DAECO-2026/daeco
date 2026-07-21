package daeco.demo_service.Client;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * 카카오 REST API 클라이언트.
 *
 * ⚠️ 중요:
 * - 인증 헤더는 Bearer가 아니라 "KakaoAK {REST_API_KEY}" 형식이다.
 * - 아래 엔드포인트/응답 필드명은 카카오 문서를 기준으로 작성했으나,
 *   카카오는 스펙을 변경한 이력이 있으므로 반드시 developers.kakao.com 및
 *   카카오모빌리티 문서에서 최신 스펙을 확인할 것.
 * - 대중교통(버스) 소요시간 REST API는 공개 범위에서 제한적일 수 있어,
 *   여기서는 '자동차 경로 시간 × 보정계수'로 버스를 근사한다.
 */
@Component
public class KakaoMapClient {

    private static final Logger log = LoggerFactory.getLogger(KakaoMapClient.class);

    // 장소 검색(주소/키워드 -> 좌표): 카카오 로컬
    private final RestClient localClient;
    // 자동차 길찾기: 카카오모빌리티
    private final RestClient naviClient;

    // 버스 근사 보정: 자동차 시간에 곱하는 계수 + 평균 대기시간(분)
    private static final double BUS_FACTOR = 1.7;
    private static final int BUS_WAIT_MINUTES = 8;
    // 도보 속도 근사: 시속 4.5km 기준으로 거리로부터 시간 산출
    private static final double WALK_KMPH = 4.5;
    // 자동차 길찾기 실패 시: 직선거리 -> 실제 도로거리 보정계수, 자동차 평균 시속
    private static final double ROAD_FACTOR = 1.3;
    private static final double CAR_KMPH = 30.0;

    public KakaoMapClient(@Value("${kakao.rest-api-key}") String restApiKey) {
        String auth = "KakaoAK " + restApiKey;
        this.localClient = RestClient.builder()
                .baseUrl("https://dapi.kakao.com")
                .defaultHeader("Authorization", auth)
                .build();
        this.naviClient = RestClient.builder()
                .baseUrl("https://apis-navi.kakaomobility.com")
                .defaultHeader("Authorization", auth)
                .build();
    }

    /** 좌표 (경도 x, 위도 y) */
    public record Coord(double x, double y) {}

    /** 한 구간 이동 결과 */
    public record LegResult(int minutes, double km, int fare) {}

    /**
     * 장소명 -> 좌표. "대전"을 붙여 지역을 좁히고, 결과 중 대전 소재를 우선 선택.
     * 실패 시 null 반환 (호출부에서 '실제 존재하지 않는 장소'로 처리).
     */
    public Coord searchPlace(String name) {
        if (name == null || name.isBlank()) return null;

        // 여러 검색어 변형을 순서대로 시도한다.
        // 1) 이름에 이미 '대전'이 있으면 그대로, 없으면 '대전 ' 접두어를 붙여 지역 한정
        // 2) 이름 그대로 (지역어 없이)
        // 3) '대전' 접미어
        List<String> queries = new ArrayList<>();
        if (name.contains("대전")) {
            queries.add(name);
            queries.add(name.replace("대전광역시", "대전").trim());
        } else {
            queries.add("대전 " + name);
            queries.add(name);
            queries.add(name + " 대전");
        }

        for (String q : queries) {
            Coord c = trySearch(q);
            if (c != null) return c;
        }
        log.warn("장소 검색 최종 실패 '{}' (시도 쿼리: {})", name, queries);
        return null;
    }

    /** 단일 쿼리로 카카오 로컬 검색. 대전 소재 결과 우선. */
    private Coord trySearch(String query) {
        try {
            JsonNode res = localClient.get()
                    .uri(uri -> uri.path("/v2/local/search/keyword.json")
                            .queryParam("query", query)
                            .build())
                    .retrieve()
                    .body(JsonNode.class);

            if (res == null) return null;
            JsonNode docs = res.get("documents");
            if (docs == null || !docs.isArray() || docs.isEmpty()) return null;

            // 주소에 '대전'이 포함된 결과를 우선 채택
            for (JsonNode d : docs) {
                String addr = textOf(d, "address_name") + textOf(d, "road_address_name");
                if (addr.contains("대전")) {
                    return new Coord(parseD(d, "x"), parseD(d, "y"));
                }
            }
            // 대전 결과가 없으면 이 쿼리는 실패로 간주(다른 지역 오검색 방지)
            return null;
        } catch (Exception e) {
            log.warn("장소 검색 호출 실패 '{}': {}", query, e.getMessage());
            return null;
        }
    }

    /**
     * 두 좌표 사이 이동 결과를 이동수단별로 반환.
     * @param mode "도보" | "버스" | "자동차"
     */
    public LegResult route(Coord from, Coord to, String mode) {
        // 1순위: 카카오 자동차 길찾기 시도
        CarRoute car = carRoute(from, to);

        // 자동차 길찾기 성공 시 그 거리 사용, 실패(-1) 시 직선거리로 대체
        double km = (car.km >= 0)
                ? car.km
                : haversineKm(from, to) * ROAD_FACTOR; // 직선거리에 도로 우회 보정

        return switch (mode) {
            case "도보" -> {
                int walkMin = (int) Math.ceil(km / WALK_KMPH * 60.0);
                yield new LegResult(Math.max(walkMin, 1), round1(km), 0);
            }
            case "버스" -> {
                // 자동차 시간이 있으면 그걸 보정, 없으면 거리로 추정
                int baseMin = (car.minutes >= 0)
                        ? car.minutes
                        : (int) Math.ceil(km / CAR_KMPH * 60.0);
                int busMin = (int) Math.ceil(baseMin * BUS_FACTOR) + BUS_WAIT_MINUTES;
                yield new LegResult(busMin, round1(km), estimateBusFare());
            }
            default -> { // 자동차
                int carMin = (car.minutes >= 0)
                        ? car.minutes
                        : (int) Math.ceil(km / CAR_KMPH * 60.0);
                yield new LegResult(carMin, round1(km), car.fare);
            }
        };
    }

    /** 두 좌표 사이 직선거리(km). Haversine 공식. */
    private static double haversineKm(Coord a, Coord b) {
        double R = 6371.0;
        double dLat = Math.toRadians(b.y() - a.y());
        double dLon = Math.toRadians(b.x() - a.x());
        double lat1 = Math.toRadians(a.y());
        double lat2 = Math.toRadians(b.y());
        double h = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * R * Math.asin(Math.sqrt(h));
    }

    private static double round1(double km) {
        return Math.round(km * 10) / 10.0;
    }

    private record CarRoute(int minutes, double km, int fare) {}

    /**
     * 카카오모빌리티 자동차 길찾기.
     * 응답 필드: routes[0].summary.duration(초), .distance(m), .fare.taxi 등.
     * ⚠️ 실제 필드 구조는 카카오모빌리티 최신 문서로 확인할 것.
     */
    private CarRoute carRoute(Coord from, Coord to) {
        try {
            JsonNode res = naviClient.get()
                    .uri(uri -> uri.path("/v1/directions")
                            .queryParam("origin", from.x() + "," + from.y())
                            .queryParam("destination", to.x() + "," + to.y())
                            .build())
                    .retrieve()
                    .body(JsonNode.class);

            JsonNode summary = res.get("routes").get(0).get("summary");
            int durationSec = summary.get("duration").asInt();
            int distanceM = summary.get("distance").asInt();
            int fare = 0;
            JsonNode fareNode = summary.get("fare");
            if (fareNode != null && fareNode.get("taxi") != null) {
                fare = fareNode.get("taxi").asInt(); // 참고용
            }
            return new CarRoute(
                    (int) Math.ceil(durationSec / 60.0),
                    Math.round(distanceM / 100.0) / 10.0, // km, 소수1자리
                    fare
            );
        } catch (Exception e) {
            log.warn("카카오 자동차 경로 조회 실패 ({},{} -> {},{}): {}",
                    from.x(), from.y(), to.x(), to.y(), e.getMessage());
            // 실패 시 호출부가 감지하도록 -1 신호를 담아 반환
            return new CarRoute(-1, -1, 0);
        }
    }

    // 대전 시내버스 기본요금 근사 (실제 요금은 정책 확인 필요)
    private int estimateBusFare() {
        return 1500;
    }

    private static String textOf(JsonNode n, String f) {
        JsonNode v = n.get(f);
        return v == null || v.isNull() ? "" : v.asText();
    }

    private static double parseD(JsonNode n, String f) {
        return Double.parseDouble(n.get(f).asText());
    }
}