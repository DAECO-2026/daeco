// 장소 키워드 검색 (카카오 REST API 프록시)
// 클라이언트는 /api/places?query=대전역 으로 호출. REST 키는 서버에만 보관.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();

  if (!query) {
    return Response.json({ places: [] });
  }

  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) {
    return Response.json(
      { error: "KAKAO_REST_API_KEY가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(
      query,
    )}&size=15`,
    { headers: { Authorization: `KakaoAK ${key}` } },
  );

  if (!res.ok) {
    return Response.json(
      { error: `카카오 API 오류 (${res.status})` },
      { status: 502 },
    );
  }

  const data = await res.json();
  const places = (data.documents ?? []).map(
    (d: {
      place_name: string;
      road_address_name?: string;
      address_name?: string;
    }) => ({
      name: d.place_name,
      address: d.road_address_name || d.address_name || "",
    }),
  );

  return Response.json({ places });
}
