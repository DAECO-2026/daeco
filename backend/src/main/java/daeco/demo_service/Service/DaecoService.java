package daeco.demo_service.Service;

import daeco.demo_service.DTO.LlmRouteDTO;
import daeco.demo_service.DTO.LlmRouteDTO.LlmRoute;
import daeco.demo_service.DTO.LlmRouteDTO.LlmRoute.LlmStop;
import daeco.demo_service.DTO.RequestDTO;
import daeco.demo_service.DTO.ResponseDTO;
import daeco.demo_service.DTO.ResponseDTO.Stopover;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

@Service
public class DaecoService {

    private static final Logger log = LoggerFactory.getLogger(DaecoService.class);

    private final ChatClient chatClient;
    private final RouteBuilder routeBuilder;

    private static final int TARGET_ROUTES = 3;        // 최종 목표 루트 개수
    private static final int MAX_TOTAL_ATTEMPTS = 8;   // 전체 재요청 상한(무한루프 방지)

    public DaecoService(ChatClient.Builder builder, RouteBuilder routeBuilder) {
        this.chatClient = builder.build();
        this.routeBuilder = routeBuilder;
    }

    public ResponseDTO requestNavigateService(RequestDTO requestDTO) {
        LocalTime startTime = requestDTO.curTime();
        LocalTime deadline = requestDTO.deadLine();
        List<String> modes = requestDTO.preferTransportation();
        int budget = requestDTO.budget();

        // 1) LLM에게 '장소 코스 후보'만 요청 (시간 계산은 시키지 않음)
        LlmRouteDTO llmOut = askLlmForRoutes(requestDTO, null);

        if (llmOut == null || llmOut.routes() == null || llmOut.routes().isEmpty()) {
            log.warn("LLM이 루트를 생성하지 못함. 응답이 비어있거나 파싱 실패.");
            return new ResponseDTO(new ArrayList<>());
        }
        log.info("LLM이 생성한 루트 개수: {}", llmOut.routes().size());

        // 검증 대기 후보 큐
        Deque<LlmRoute> candidates = new ArrayDeque<>(llmOut.routes());
        List<Stopover> finalRoutes = new ArrayList<>();
        int totalAttempts = 0;
        String lastFailure = null;

        // TARGET_ROUTES 개를 채울 때까지 반복 (전체 시도 상한으로 무한루프 방지)
        while (finalRoutes.size() < TARGET_ROUTES && totalAttempts < MAX_TOTAL_ATTEMPTS) {
            // 후보가 비었으면 추가로 요청 (직전 실패 사유를 반영)
            if (candidates.isEmpty()) {
                LlmRouteDTO more = askLlmForRoutes(requestDTO, lastFailure);
                if (more != null && more.routes() != null && !more.routes().isEmpty()) {
                    candidates.addAll(more.routes());
                } else {
                    break; // 더 못 만들면 종료
                }
            }

            LlmRoute current = sanitizeKorean(candidates.poll());
            totalAttempts++;

            RouteBuilder.BuildResult result = routeBuilder.build(
                    current,
                    requestDTO.curLocation(),
                    requestDTO.arriveLocation(),
                    startTime, deadline, modes, budget);

            if (result.isSuccess()) {
                finalRoutes.add(result.stopover());
            } else {
                lastFailure = result.failureReason();
                log.warn("루트 검증 실패 (시도 {}): {}", totalAttempts, lastFailure);
            }
        }

        log.info("최종 성공 루트 개수: {} (총 시도 {})", finalRoutes.size(), totalAttempts);
        return new ResponseDTO(finalRoutes);
    }

    /**
     * LLM 호출. failureReason이 null이면 최초 3개 루트 요청,
     * 값이 있으면 '해당 사유를 고쳐서 대체 루트 1개'를 요청.
     */
    private LlmRouteDTO askLlmForRoutes(RequestDTO req, String failureReason) {
        String system =
                "너는 대전 지역 당일 여행/산책 코스를 설계하는 여행 가이드 AI다.\n" +
                        "[매우 중요] 너는 '장소 선정과 순서'만 정한다. " +
                        "도착시각, 이동시간, 이동거리 같은 시간·거리 계산은 절대 하지 마라. " +
                        "그 값들은 시스템이 카카오맵으로 직접 계산한다.\n" +
                        "[규칙]\n" +
                        "- 모든 텍스트(추천 이유 포함)는 반드시 한국어로만. 한자·일본어·중국어 절대 금지.\n" +
                        "- 실제로 대전에 존재하는 장소만 사용. 확실하지 않으면 쓰지 마라. " +
                        "지도에서 검색되는 정확한 공식 명칭을 사용하고, " +
                        "축제·행사·거리 이름처럼 지도 검색이 안 될 수 있는 모호한 명칭은 피하라. " +
                        "유명한 관광지·박물관·공원·미술관 위주로 골라라.\n" +
                        "- recommendStayMinutes 는 분 단위 정수(예: 60).\n" +
                        "- estimatedBudget 은 그 장소에서의 예상 지출(입장료/식비 등, 교통비 제외).\n" +
                        "- 각 루트는 2~3개 장소로 구성.\n" +
                        "- [중요] 현재 위치(출발지)는 경유지 목록에 넣지 마라. " +
                        "출발지에서 '이동해서 방문할' 새로운 장소들만 나열하라. " +
                        "출발지와 같은 장소를 첫 경유지로 다시 넣지 마라.\n" +
                        "- [동선 중요] 여행이 끝나면 복귀 장소로 돌아가야 하므로, " +
                        "마지막 경유지는 복귀 장소와 가까운 곳으로 골라 복귀 시간을 최소화하라. " +
                        "출발지→경유지들→복귀지가 한 방향으로 자연스럽게 이어지도록 동선을 짜라. " +
                        "복귀 장소에서 너무 먼(왕복하게 되는) 장소는 피하라.\n" +
                        "- 추천 이유에는 그 경로만의 차별적 이점을 담아라.";

        String modeText = String.join(", ", req.preferTransportation());

        String user;
        if (failureReason == null) {
            user = String.format(
                    "다음 조건으로 서로 다른 추천 루트 3개를 만들어줘.\n" +
                            "- 현재 위치(출발지): %s\n- 복귀 장소: %s\n- 복귀 마감 시각: %s\n" +
                            "- 선호 이동 수단: %s\n- 예산(원): %d\n" +
                            "마지막 경유지는 복귀 장소 '%s' 와 가까운 곳으로 골라라.\n" +
                            "각 장소는 sequence, locationName, recommendStayMinutes, " +
                            "entranceFee(true/false), recommendReason, estimatedBudget 로 구성.",
                    req.curLocation(), req.arriveLocation(), req.deadLine(),
                    modeText, req.budget(), req.arriveLocation());
        } else {
            user = String.format(
                    "직전에 만든 루트가 아래 사유로 실패했다. 이 문제를 해결한 대체 루트 1개를 만들어줘.\n" +
                            "[실패 사유] %s\n" +
                            "- 현재 위치(출발지): %s\n- 복귀 장소: %s\n- 복귀 마감 시각: %s\n" +
                            "- 선호 이동 수단: %s\n- 예산(원): %d\n" +
                            "마지막 경유지는 복귀 장소 '%s' 와 가까운 곳으로 골라 복귀 시간을 줄여라.\n" +
                            "routes 배열에 대체 루트 1개만 담아 반환.",
                    failureReason, req.curLocation(), req.arriveLocation(), req.deadLine(),
                    modeText, req.budget(), req.arriveLocation());
        }

        return chatClient.prompt()
                .system(system)
                .user(user)
                .call()
                .entity(LlmRouteDTO.class);
    }

    /** 추천 이유에 CJK가 섞였으면 LLM에게 그 필드만 한국어로 재작성 요청 */
    private LlmRoute sanitizeKorean(LlmRoute route) {
        List<LlmStop> cleaned = new ArrayList<>();
        for (LlmStop s : route.stops()) {
            String reason = s.recommendReason();
            if (KoreanTextValidator.hasNonKorean(reason)) {
                reason = retranslateToKorean(reason);
            }
            cleaned.add(new LlmStop(s.sequence(), s.locationName(),
                    s.recommendStayMinutes(), s.entranceFee(), reason, s.estimatedBudget()));
        }
        return new LlmRoute(cleaned);
    }

    private String retranslateToKorean(String text) {
        try {
            String out = chatClient.prompt()
                    .system("아래 문장을 자연스러운 한국어로만 다시 써라. " +
                            "한자·일본어·중국어를 절대 쓰지 말고 순수 한국어로만 출력해라. " +
                            "설명 없이 결과 문장만 출력해라.")
                    .user(text)
                    .call()
                    .content();
            // 재번역 결과에도 CJK가 남으면 최후엔 CJK 문자만 제거
            return KoreanTextValidator.hasNonKorean(out) ? stripCjk(out) : out;
        } catch (Exception e) {
            return stripCjk(text);
        }
    }

    private String stripCjk(String text) {
        return text.replaceAll("[\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff]", "").trim();
    }
}