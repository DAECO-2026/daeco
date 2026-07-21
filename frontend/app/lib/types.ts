// 백엔드(POST /api/route) 요청·응답 DTO 타입
// 백엔드 RequestDTO / ResponseDTO(record)와 필드명이 1:1로 대응한다.

/** 루트 추천 요청 — 백엔드 RequestDTO */
export interface RouteRequest {
  curLocation: string; // 현재 위치
  curTime: string; // 현재 시각 (LocalTime, "HH:mm:ss")
  arriveLocation: string; // 복귀 장소
  deadLine: string; // 복귀 마감 시각 (LocalTime, "HH:mm:ss")
  preferLocation: string[]; // 선호 장소 유형
}

/** 경유지 상세 — 백엔드 ResponseDTO.StopoverDetail */
export interface Stopover {
  sequence: number;
  locationName: string;
  pathTime: string;
  recommendStayTime: string;
  recommendReason: string;
}

/** 루트 추천 응답 — 백엔드 ResponseDTO */
export interface RouteResponse {
  stopoverCount: number;
  stopovers: Stopover[];
  arriveTime: string; // LocalTime ("HH:mm:ss")
  remainTime: string;
}
