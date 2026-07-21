// 자동차 길찾기 (카카오모빌리티 Directions API 프록시)
// /api/directions?origin=lng,lat&destination=lng,lat&waypoints=lng,lat|lng,lat
// 응답: { path: [{lat,lng}, ...] } (도로 경로 좌표), 실패 시 path: []

type LatLng = { lat: number; lng: number };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin");
  const destination = searchParams.get("destination");
  const waypoints = searchParams.get("waypoints");

  if (!origin || !destination) {
    return Response.json(
      { error: "origin, destination이 필요합니다.", path: [] },
      { status: 400 },
    );
  }

  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    return Response.json(
      { error: "KAKAO_REST_API_KEY가 설정되지 않았습니다.", path: [] },
      { status: 500 },
    );
  }

  const url = new URL("https://apis-navi.kakaomobility.com/v1/directions");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  if (waypoints) url.searchParams.set("waypoints", waypoints);
  url.searchParams.set("priority", "RECOMMEND");

  const res = await fetch(url, {
    headers: { Authorization: `KakaoAK ${key}` },
  });

  if (!res.ok) {
    return Response.json(
      { error: `길찾기 API 오류 (${res.status})`, path: [] },
      { status: 502 },
    );
  }

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route || route.result_code !== 0) {
    return Response.json({ error: route?.result_msg ?? "경로 없음", path: [] });
  }

  const path: LatLng[] = [];
  for (const section of route.sections ?? []) {
    for (const road of section.roads ?? []) {
      const v: number[] = road.vertexes ?? [];
      for (let i = 0; i + 1 < v.length; i += 2) {
        path.push({ lng: v[i], lat: v[i + 1] });
      }
    }
  }

  return Response.json({ path });
}
