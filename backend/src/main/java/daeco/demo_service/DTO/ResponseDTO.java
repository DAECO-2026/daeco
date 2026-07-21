package daeco.demo_service.DTO;

import java.time.LocalTime;
import java.util.List;

/**
 * 클라이언트로 나가는 최종 응답 DTO.
 * 시간/거리 관련 값은 전부 카카오 API + 코드 계산으로 채워진 '검증된 값'이다.
 */
public record ResponseDTO(
        List<Stopover> stopoverList
) {
    public record Stopover(
            int stopoverCount,
            List<StopoverDetail> stopovers,
            LocalTime totalUseTime,          // 총 예상 소요 시간 (체류 + 이동 합)
            LocalTime totalStayTime,         // 총 체류 시간
            LocalTime totalMovementTime,     // 총 이동 시간
            double totalMovementDistance,    // 총 이동 거리 (km)
            int totalBudget                  // 총 예산 (장소 지출 + 교통비)
    ) {
        public record StopoverDetail(
                int sequence,
                String arriveTime,           // "HH:mm:ss" (코드 계산)
                String locationName,
                String recommendStayTime,    // "HH:mm:ss"
                boolean entranceFee,
                String recommendReason,
                int budget,                  // 이 구간 지출 (장소 지출 + 이 구간 교통비)
                String transportation,       // 이동 수단
                LocalTime movementTime,       // 이 지점까지 오는 이동 시간 (카카오 계산)
                double movementDistance,     // 이 지점까지 오는 이동 거리 km (카카오 계산)
                String imageUrl              // 장소 대표 이미지 URL (프론트 img src용, 없으면 null)
        ) {
        }
    }
}