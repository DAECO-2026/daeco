/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// 카카오 지도에 추천 경로를 순위별 색으로 그린다.
// 장소명 → 좌표(SDK Places) → 도로 경로(/api/directions) → 폴리라인 + 마커.

import { useEffect, useRef } from "react";
import type { RouteOption } from "../lib/types";

const JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

// 순위별 색 (1순위 주 / 2순위 초록 / 3순위 회색)
const RANK_COLORS = ["#6b7fb8", "#7c8a4e", "#d6d6d6"];
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
  const overlaysRef = useRef<any[]>([]); // 폴리라인·마커 등 정리용
  const geocodeCache = useRef<Map<string, LatLng>>(new Map());
  const readyRef = useRef(false);

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
          level: 6,
        });
        readyRef.current = true;
        void draw();
      })
      .catch(() => {
        /* 도메인 미등록/키 오류 시 지도 미표시 */
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 옵션·선택 변경 시 다시 그림
  useEffect(() => {
    if (readyRef.current) void draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, selected]);

  const geocode = (name: string): Promise<LatLng | null> => {
    const cached = geocodeCache.current.get(name);
    if (cached) return Promise.resolve(cached);
    return new Promise((resolve) => {
      const places = new window.kakao.maps.services.Places();
      places.keywordSearch(name, (data: any[], status: any) => {
        if (
          status === window.kakao.maps.services.Status.OK &&
          data[0]
        ) {
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
    const mid = coords.slice(1, -1);
    const waypoints = mid.map((c) => `${c.lng},${c.lat}`).join("|");
    try {
      const qs = new URLSearchParams({ origin, destination });
      if (waypoints) qs.set("waypoints", waypoints);
      const res = await fetch(`/api/directions?${qs.toString()}`);
      const data = await res.json();
      if (data.path?.length) return data.path as LatLng[];
    } catch {
      /* 실패 시 직선 폴백 */
    }
    return coords; // 폴백: 직선 연결
  };

  const clearOverlays = () => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
  };

  const draw = async () => {
    const kakao = window.kakao;
    const map = mapRef.current;
    if (!map || options.length === 0) return;

    // 각 옵션의 좌표 계산
    const optionCoords = await Promise.all(
      options.map((opt) =>
        Promise.all(opt.stopovers.map((s) => geocode(s.locationName))),
      ),
    );

    clearOverlays();
    const bounds = new kakao.maps.LatLngBounds();

    // 선택된 경로를 마지막에 그려서 위로 오도록 순서 조정
    const order = options
      .map((_, i) => i)
      .sort((a, b) => (a === selected ? 1 : b === selected ? -1 : 0));

    for (const i of order) {
      const coords = optionCoords[i].filter(Boolean) as LatLng[];
      if (coords.length < 2) continue;
      const isSelected = i === selected;
      const path = await getRoadPath(coords);
      const linePath = path.map((c) => new kakao.maps.LatLng(c.lat, c.lng));

      const polyline = new kakao.maps.Polyline({
        path: linePath,
        strokeWeight: isSelected ? 6 : 4,
        strokeColor: RANK_COLORS[i] ?? RANK_COLORS[2],
        strokeOpacity: isSelected ? 0.95 : 0.5,
        strokeStyle: "solid",
        zIndex: isSelected ? 10 : 1,
      });
      polyline.setMap(map);
      overlaysRef.current.push(polyline);

      // 선택된 경로에만 번호 마커 표시
      if (isSelected) {
        coords.forEach((c, idx) => {
          bounds.extend(new kakao.maps.LatLng(c.lat, c.lng));
          const el = document.createElement("div");
          el.style.cssText =
            "transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:#6b7fb8;color:#fff;font-size:12px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,0.3)";
          el.textContent = String(idx + 1);
          const overlay = new kakao.maps.CustomOverlay({
            position: new kakao.maps.LatLng(c.lat, c.lng),
            content: el,
            zIndex: 20,
          });
          overlay.setMap(map);
          overlaysRef.current.push(overlay);
        });
      } else {
        coords.forEach((c) =>
          bounds.extend(new kakao.maps.LatLng(c.lat, c.lng)),
        );
      }
    }

    if (!bounds.isEmpty()) map.setBounds(bounds);
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
