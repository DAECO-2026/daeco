import type { RouteRequest, RouteResponse } from "./types";

/**
 * "HH:mm"(폼 입력) → "HH:mm:ss"(백엔드 LocalTime) 변환.
 * 이미 초까지 있으면 그대로 둔다.
 */
export function toLocalTime(value: string): string {
  const t = value.trim();
  if (/^\d{1,2}:\d{2}$/.test(t)) {
    return `${t.padStart(5, "0")}:00`;
  }
  return t;
}

/**
 * 루트 추천 요청. next.config 리라이트를 통해 백엔드(POST /api/route)로 프록시된다.
 */
export async function requestRouteRecommendation(
  payload: RouteRequest,
): Promise<RouteResponse> {
  const res = await fetch("/api/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `추천 요청에 실패했습니다. (${res.status}) ${detail}`.trim(),
    );
  }

  return (await res.json()) as RouteResponse;
}
