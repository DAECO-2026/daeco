/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// 카카오 지도에 추천 경로를 순위별 색으로 그린다.
// 장소명 → 좌표(SDK Places) → 도로 경로(/api/directions) → 폴리라인 + 마커.

import { useEffect, useRef, useState } from "react";
import type { RouteOption } from "../lib/types";

const JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

// 순위별 색 (1순위 주 / 2순위 초록 / 3순위 회색)
const RANK_COLORS = ["#6b7fb8", "#7c8a4e", "#b8bcc4"];
const DAEJEON = { lat: 36.3504, lng: 127.3845 };

type LatLng = { lat: number; lng: number };

function loadKakaoSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) {
      resolve();
      return;
    }
    const existing = document.getElementById(
      "kakao-map-sdk",
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () =>
        window.kakao.maps.load(() => resolve()),
      );
      existing.addEventListener("error", () => reject(new Error("sdk error")));
      return;
    }
    const script = document.createElement("script");
    script.id = "kakao-map-sdk";
    script.async = true;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY}&libraries=services&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => reject(new Error("SDK load failed"));
    document.head.appendChild(script);
  });
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function KakaoRouteMap({
  options,
  selected,
  className,
}: {
  options: RouteOption[];
  selected: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const geocodeCache = useRef<Map<string, LatLng>>(new Map());
  const drawGen = useRef(0); // 비동기 draw 경쟁 방지용 세대 카운터
  const [ready, setReady] = useState(false);

  // 지도 초기화 (1회)
  useEffect(() => {
    if (!JS_KEY) return;
    let cancelled = false;
    loadKakaoSdk()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const kakao = window.kakao;
        mapRef.current = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(DAEJEON.lat, DAEJEON.lng),
          level: 7,
        });
        setReady(true);
      })
      .catch(() => {
        /* 도메인 미등록/키 오류 시 지도 미표시 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 지도 준비 + 옵션/선택 변경 시 다시 그림
  useEffect(() => {
    if (!ready || options.length === 0) return;
    const gen = ++drawGen.current;
    void drawRoutes(gen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, options, selected]);

  const geocode = (name: string): Promise<LatLng | null> => {
    const cached = geocodeCache.current.get(name);
    if (cached) return Promise.resolve(cached);
    return new Promise((resolve) => {
      const places = new window.kakao.maps.services.Places();
      places.keywordSearch(name, (data: any[], status: any) => {
        if (status === window.kakao.maps.services.Status.OK && data[0]) {
          const p = { lat: Number(data[0].y), lng: Number(data[0].x) };
          geocodeCache.current.set(name, p);
          resolve(p);
        } else {
          resolve(null);
        }
      });
    });
  };

  const getRoadPath = async (coords: LatLng[]): Promise<LatLng[]> => {
    if (coords.length < 2) return coords;
    const origin = `${coords[0].lng},${coords[0].lat}`;
    const destination = `${coords[coords.length - 1].lng},${
      coords[coords.length - 1].lat
    }`;
    const waypoints = coords
      .slice(1, -1)
      .map((c) => `${c.lng},${c.lat}`)
      .join("|");
    try {
      const qs = new URLSearchParams({ origin, destination });
      if (waypoints) qs.set("waypoints", waypoints);
      const res = await fetch(`/api/directions?${qs.toString()}`);
      const data = await res.json();
      if (data.path?.length) return data.path as LatLng[];
    } catch {
      /* 폴백: 직선 */
    }
    return coords;
  };

  const clearOverlays = () => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
  };

  const drawRoutes = async (gen: number) => {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!map) return;

    // 옵션별 경유지 좌표
    const optionCoords = await Promise.all(
      options.map((opt) =>
        Promise.all(opt.stopovers.map((s) => geocode(s.locationName))),
      ),
    );
    // 옵션별 도로 경로
    const optionPaths = await Promise.all(
      optionCoords.map((cs) => {
        const valid = cs.filter(Boolean) as LatLng[];
        return valid.length >= 2 ? getRoadPath(valid) : Promise.resolve(valid);
      }),
    );

    if (gen !== drawGen.current) return; // 더 최신 draw가 시작됨 → 폐기

    clearOverlays();
    const bounds = new kakao.maps.LatLngBounds();

    // 선택 경로를 마지막에 그려 위로 오게
    const order = [
      ...options.map((_, i) => i).filter((i) => i !== selected),
      selected,
    ];

    for (const i of order) {
      const path = optionPaths[i];
      if (!path || path.length < 2) continue;
      const isSelected = i === selected;
      const linePath = path.map((c) => new kakao.maps.LatLng(c.lat, c.lng));

      const polyline = new kakao.maps.Polyline({
        path: linePath,
        strokeWeight: isSelected ? 6 : 4,
        strokeColor: RANK_COLORS[i] ?? RANK_COLORS[2],
        strokeOpacity: isSelected ? 0.95 : 0.45,
        strokeStyle: "solid",
        zIndex: isSelected ? 10 : 1,
      });
      polyline.setMap(map);
      overlaysRef.current.push(polyline);
    }

    // 선택 경로의 경유지 번호 마커 + bounds (마커 색 = 선택 경로 순위 색)
    const markerColor = RANK_COLORS[selected] ?? RANK_COLORS[2];
    const selCoords = (optionCoords[selected]?.filter(Boolean) ??
      []) as LatLng[];
    selCoords.forEach((c, idx) => {
      const pos = new kakao.maps.LatLng(c.lat, c.lng);
      bounds.extend(pos);
      const el = document.createElement("div");
      el.style.cssText =
        `transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:${markerColor};color:#fff;font-size:12px;font-weight:700;box-shadow:0 1px 4px rgba(0,0,0,0.35)`;
      el.textContent = String(idx + 1);
      const overlay = new kakao.maps.CustomOverlay({
        position: pos,
        content: el,
        zIndex: 20,
      });
      overlay.setMap(map);
      overlaysRef.current.push(overlay);
    });

    if (!bounds.isEmpty()) map.setBounds(bounds, 40, 40, 40, 40);
  };

  if (!JS_KEY) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 text-center text-sm text-zinc-400 ${className}`}
      >
        NEXT_PUBLIC_KAKAO_JS_KEY 미설정
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
