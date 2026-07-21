// 좌표 → 주소 역지오코딩 (카카오 REST API 프록시)
// 클라이언트는 /api/geocode?lat=..&lng=.. 로 호출. REST 키는 서버에만 보관.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return Response.json({ error: "lat, lng 파라미터가 필요합니다." }, { status: 400 });
  }

  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    return Response.json(
      { error: "KAKAO_REST_API_KEY가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
    { headers: { Authorization: `KakaoAK ${key}` } },
  );

  if (!res.ok) {
    return Response.json(
      { error: `카카오 API 오류 (${res.status})` },
      { status: 502 },
    );
  }

  const data = await res.json();
  const doc = data.documents?.[0];
  const placeName =
    doc?.road_address?.address_name ?? doc?.address?.address_name ?? null;

  return Response.json({ placeName });
}
