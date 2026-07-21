package daeco.demo_service.DTO;

import java.time.LocalTime;
import java.util.List;

public record ResponseDTO(
        List<Stopover> stopoverList
) {
    public record Stopover(
            int stopoverCount,
            List<StopoverDetail> stopovers,
            LocalTime arriveTime,
            String remainTime
    ) {
        public record StopoverDetail(
                int sequence,
                String locationName,
                String pathTime,
                String recommendStayTime,
                String recommendReason,
                int budget
        ) {
        }
    }
}