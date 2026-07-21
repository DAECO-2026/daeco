package daeco.demo_service.DTO;

import java.util.List;

/**
 * LLM이 생성하는 응답 전용 DTO.
 *
 * 핵심: LLM은 "장소 선정 + 순서 + 희망 체류시간 + 추천 이유"까지만 만든다.
 * 도착시각(arriveTime), 이동시간(movementTime), 이동거리, 총 시간 등
 * '계산으로 확정되어야 하는 값'은 이 DTO에 포함하지 않는다.
 * 그 값들은 카카오 API + 코드가 채운다.
 */
public record LlmRouteDTO(
        List<LlmRoute> routes
) {
    public record LlmRoute(
            List<LlmStop> stops
    ) {
        public record LlmStop(
                int sequence,            // 방문 순서
                String locationName,     // 장소 이름 (실제 대전 소재)
                int recommendStayMinutes,// 추천 체류시간 (분 단위 정수 - 계산 편의)
                boolean entranceFee,     // 입장료 유무
                String recommendReason,  // 추천 이유 (한국어)
                int estimatedBudget      // 이 장소에서 예상 지출 (입장료/식비 등, 교통비 제외)
        ) {
        }
    }
}
