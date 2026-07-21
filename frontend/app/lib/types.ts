// 백엔드(POST /api/route) 요청·응답 DTO 타입
// 백엔드 RequestDTO / ResponseDTO(record)와 필드명이 1:1로 대응한다.

/** 루트 추천 요청 — 백엔드 RequestDTO */
export interface RouteRequest {
  curLocation: string; // 현재 위치
  curTime: string; // 현재 시각 (LocalTime, "HH:mm:ss")
  arriveLocation: string; // 복귀 장소
  deadLine: string; // 복귀 마감 시각 (LocalTime, "HH:mm:ss")
  preferTransportation: string[]; // 선호 이동 수단
  budget: number; // 총 예산 (원)
}

/** 경유지 상세 — 백엔드 ResponseDTO.Stopover.StopoverDetail */
export interface StopoverDetail {
  sequence: number;
  arriveTime: string; // "HH:mm:ss"
  locationName: string;
  recommendStayTime: string; // "HH:mm:ss"
  entranceFee: boolean;
  recommendReason: string;
  budget: number; // 이 구간 지출
  transportation: string; // 이동 수단
  movementTime: string; // 이 지점까지 이동 시간 "HH:mm:ss"
  movementDistance: number; // 이 지점까지 이동 거리 (km)
}

/** 추천 코스 1개 — 백엔드 ResponseDTO.Stopover */
export interface RouteOption {
  stopoverCount: number;
  stopovers: StopoverDetail[];
  totalUseTime: string; // 총 소요 (체류+이동) "HH:mm:ss"
  totalStayTime: string; // 총 체류 "HH:mm:ss"
  totalMovementTime: string; // 총 이동 "HH:mm:ss"
  totalMovementDistance: number; // 총 이동 거리 (km)
  totalBudget: number; // 총 예산
}

/** 루트 추천 응답 — 백엔드 ResponseDTO (추천 코스 여러 개) */
export interface RouteResponse {
  stopoverList: RouteOption[];
}
