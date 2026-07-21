package daeco.demo_service.Service;

import daeco.demo_service.DTO.RequestDTO;
import daeco.demo_service.DTO.ResponseDTO;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

@Service
public class DaecoService {

    private final ChatClient chatClient;

    public DaecoService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public ResponseDTO requestNavigateService(RequestDTO requestDTO){
        String systemInstruction =
                "너는 사용자의 현재 위치와 복귀 마감 시각, 선호 장소 유형을 종합하여 " +
                        "대전 지역 내 최적의 당일 여행/산책 추천 코스를 설계해 주는 맞춤형 여행 가이드 AI이다.";

        String userPrompt = String.format(
                "다음 조건에 맞춰 2~3곳을 연결한 추천 루트 1개를 작성해줘.\n" +
                        "- 현재 위치: %s\n" +
                        "- 현재 시각: %s\n" +
                        "- 복귀 장소: %s\n" +
                        "- 복귀 마감 시각: %s\n" +
                        "- 선호 장소 유형: %s",
                requestDTO.curLocation(),
                requestDTO.curTime(),
                requestDTO.arriveLocation(),
                requestDTO.deadLine(),
                String.join(", ", requestDTO.preferLocation())
        );

        return chatClient.prompt()
                .system(systemInstruction)
                .user(userPrompt)
                .call()
                .entity(ResponseDTO.class);
    }
}
