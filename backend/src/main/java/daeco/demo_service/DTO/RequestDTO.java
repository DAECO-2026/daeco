package daeco.demo_service.DTO;

import java.time.LocalTime;
import java.util.List;

public record RequestDTO(
        String curLocation,
        LocalTime curTime,
        String arriveLocation,
        LocalTime deadLine,
        List<String> preferTransportation,
        int budget
) {}