package daeco.demo_service.Controller;

import daeco.demo_service.DTO.RequestDTO;
import daeco.demo_service.DTO.ResponseDTO;
import daeco.demo_service.Service.DaecoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/route")
@RequiredArgsConstructor
public class RequestController {
    private final DaecoService daecoService;

    @PostMapping
    public ResponseEntity<ResponseDTO> createRequest(@RequestBody RequestDTO requestDTO){
        return new ResponseEntity<>(
            daecoService.requestNavigateService(requestDTO),
            HttpStatus.OK
        );
    }
}
