package daeco.demo_service.Service;

import java.util.regex.Pattern;

/**
 * 추천 이유 등 텍스트에 한국어가 아닌 문자(한자, 일본어 가나 등)가
 * 섞였는지 검사한다. LLM이 지시를 어기고 CJK를 섞는 경우를 잡는 안전장치.
 */
public final class KoreanTextValidator {

    // 히라가나(3040-309F), 가타카나(30A0-30FF), CJK 한자(4E00-9FFF, 3400-4DBF)
    private static final Pattern NON_KOREAN_CJK =
            Pattern.compile("[\\u3040-\\u30ff\\u3400-\\u4dbf\\u4e00-\\u9fff]");

    private KoreanTextValidator() {}

    /** 한자/가나가 하나라도 있으면 true */
    public static boolean hasNonKorean(String text) {
        if (text == null) return false;
        return NON_KOREAN_CJK.matcher(text).find();
    }
}
