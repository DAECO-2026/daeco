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
            "대전 지역 내 최적의 당일 여행/산책 추천 코스를 설계해 주는 맞춤형 여행 가이드 AI이다." +
            "무조건 한자말고 한국어로 대답하고, 시간 데이터 부분들은 LocalTime 형식에 맞춰서 데이터를 작성해줘" +
            "이동수단에서 소요되는 금액도 전부 예산에 포함될 수 있도록 만들어줘" +
            "루트 선정 이유를 해당 경로의 대표적인 요소들을 포함하여 어떤점이 차별적으로 이점이 존재하는지 작성해줘" +
            "데이터를 최종적으로 작성하기 전에, 너가 짜놓은 경로가 실제로 대전에 존재하는지, 이동시간 및 예산이 맞는지 등을 다시 한번 검토하고 보내줘" +
            "특히 추천 이유를 한국어로만 작성하였는지 무조건 확인해줘. (만약 한국어가 아닌 경우 한국어로 다시 번역해줘)";

        String userPrompt = String.format(
            "다음 조건에 맞춰 2~3곳을 연결한 추천 루트 3개를 작성해줘.\n" +
            "- 현재 위치: %s\n" +
            "- 현재 시각: %s\n" +
            "- 복귀 장소: %s\n" +
            "- 복귀 마감 시각: %s\n" +
            "- 선호 이동 수단: %s\n" +
            "- 예산: %d",
            requestDTO.curLocation(),
            requestDTO.curTime(),
            requestDTO.arriveLocation(),
            requestDTO.deadLine(),
            requestDTO.preferMovement(),
            requestDTO.budget()
        );

        return chatClient.prompt()
                .system(systemInstruction)
                .user(userPrompt)
                .call()
                .entity(ResponseDTO.class);
    }
}
