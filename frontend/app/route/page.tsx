"use client";

// 루트 상세 (타임라인) — /map의 "이 루트로 시작하기"에서 진입.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import KakaoRouteMap from "../components/KakaoRouteMap";
import {
  ChevronLeftIcon,
  BookmarkIcon,
  CarIcon,
  WalkIcon,
  BusIcon,
  InfoIcon,
} from "../components/icons";
import type { RouteOption } from "../lib/types";

/** "HH:mm:ss" → "N시간 M분" */
function formatDuration(hms: string): string {
  const [h, m] = hms.split(":").map(Number);
  const parts: string[] = [];
  if (h) parts.push(`${h}시간`);
  if (m) parts.push(`${m}분`);
  return parts.length ? parts.join(" ") : "0분";
}

/** "HH:mm:ss" → "HH:mm" */
const clock = (hms: string) => hms.slice(0, 5);

/** km → "350m" 또는 "1.2km" */
function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km}km`;
}

// 출발지(현재 위치)에 항상 쓰는 충남대 이미지
const CNU_IMAGE =
  "https://cdn.cctoday.co.kr/news/photo/202504/2211353_657609_2233.jpg";

// 백엔드에 이미지가 없는 장소용 프론트 폴백 이미지 (장소명 부분 일치)
const PLACE_IMAGE_FALLBACK: Record<string, string> = {
  충남대: CNU_IMAGE,
  대전역:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Daejeon_Station_2017.JPG/500px-Daejeon_Station_2017.JPG",
};

/** 장소명에 폴백 키가 포함되면 해당 이미지 반환 (예: "충남대학교" → "충남대") */
function fallbackImage(name: string): string | null {
  for (const [key, url] of Object.entries(PLACE_IMAGE_FALLBACK)) {
    if (name.includes(key)) return url;
  }
  return null;
}

function transportIcon(t: string) {
  if (t.includes("도보") || t.includes("걷")) return WalkIcon;
  if (t.includes("택시") || t.includes("자동차") || t.includes("차"))
    return CarIcon;
  return BusIcon; // 대중교통·버스·지하철 등
}

export default function RouteDetailPage() {
  const router = useRouter();
  const [route, setRoute] = useState<RouteOption | null>(null);
  const [tab, setTab] = useState<"route" | "place">("route");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("daeco:selectedRoute");
    if (raw) {
      try {
        setRoute(JSON.parse(raw) as RouteOption);
      } catch {
        setRoute(null);
      }
    }
    setLoaded(true);
  }, []);

  const stops = route?.stopovers ?? [];
  const entranceStop = stops.find((s) => s.entranceFee);
  const tip = entranceStop
    ? `${entranceStop.locationName}은(는) 입장료가 있어요. 미리 확인하고 방문하세요!`
    : "복귀 시간을 넉넉히 두고 여유 있게 즐겨보세요!";

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {/* 헤더 */}
      <header className="relative flex items-center justify-center px-6 py-5">
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={() => router.back()}
          className="absolute left-6 text-zinc-800"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-zinc-900">루트 상세</h1>
        <div className="absolute right-6 flex items-center gap-3 text-zinc-700">
          <BookmarkIcon className="h-5 w-5 text-brand" />
          <span className="text-lg leading-none">⋮</span>
        </div>
      </header>

      {/* 탭 */}
      <div className="flex border-b border-zinc-100">
        {(
          [
            ["route", "루트 정보"],
            ["place", "장소 정보"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-semibold ${
              tab === key
                ? "border-b-2 border-brand text-brand"
                : "text-zinc-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
        {!loaded ? null : !route ? (
          <p className="mt-20 text-center text-sm text-zinc-400">
            선택한 루트가 없습니다.
          </p>
        ) : tab === "place" ? (
          <p className="mt-20 text-center text-sm text-zinc-400">
            장소 정보는 준비 중입니다.
          </p>
        ) : (
          <>
            {/* 지도 */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-100">
              <KakaoRouteMap
                options={[route]}
                selected={0}
                className="h-48 w-full bg-zinc-100"
              />
            </div>

            {/* 요약 */}
            <div className="mt-4 grid grid-cols-4 divide-x divide-zinc-200 rounded-2xl border border-zinc-200 py-3">
              {[
                ["총 예상 시간", formatDuration(route.totalUseTime)],
                ["체류 시간", formatDuration(route.totalStayTime)],
                ["이동 시간", formatDuration(route.totalMovementTime)],
                ["총 이동 거리", `${route.totalMovementDistance}km`],
              ].map(([label, value]) => (
                <div key={label} className="px-1 text-center">
                  <p className="text-[11px] text-zinc-400">{label}</p>
                  <p className="mt-1 text-sm font-bold text-zinc-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* 타임라인 */}
            <ol className="mt-6">
              {stops.map((s, i) => {
                const isFirst = i === 0;
                const isLast = i === stops.length - 1;
                const next = stops[i + 1];
                return (
                  <li key={s.sequence}>
                    {/* 노드 */}
                    <div className="flex gap-4">
                      <div className="flex w-12 shrink-0 flex-col items-center">
                        {isFirst ? (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand">
                            출발
                          </span>
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                            {s.sequence}
                          </span>
                        )}
                        <span className="mt-1 text-xs text-zinc-500">
                          {clock(s.arriveTime)}
                        </span>
                      </div>

                      <div className="flex flex-1 justify-between gap-3 pb-1">
                        <div className="min-w-0">
                          <h3 className="font-bold text-zinc-900">
                            {s.locationName}
                          </h3>
                          <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500">
                            <PinDot />
                            {isFirst
                              ? "현재 위치"
                              : isLast
                                ? "복귀 장소"
                                : `체류 ${formatDuration(s.recommendStayTime)}`}
                          </p>
                          {s.entranceFee && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                              <InfoIcon className="h-3.5 w-3.5" />
                              입장료 있음
                            </p>
                          )}
                        </div>
                        <StopImage
                          urls={
                            isFirst
                              ? [CNU_IMAGE]
                              : [fallbackImage(s.locationName), s.imageUrl]
                          }
                        />

                      </div>
                    </div>

                    {/* 연결(이동) */}
                    {next && (
                      <div className="flex gap-4">
                        <div className="flex w-12 shrink-0 justify-center">
                          <span
                            className={`my-1 block w-px flex-1 border-l ${
                              next.transportation.includes("도보")
                                ? "border-dashed"
                                : ""
                            } border-zinc-300`}
                          />
                        </div>
                        <div className="flex items-center gap-2 py-3 text-xs text-zinc-500">
                          {(() => {
                            const Icon = transportIcon(next.transportation);
                            return <Icon className="h-4 w-4 text-zinc-500" />;
                          })()}
                          이동 {formatDuration(next.movementTime)} (
                          {formatDist(next.movementDistance)})
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            {/* 추천 팁 */}
            <div className="mt-6 rounded-2xl border border-brand/30 bg-brand/5 px-5 py-4">
              <span className="inline-block rounded-full border border-brand/40 px-3 py-0.5 text-xs font-semibold text-brand">
                추천 팁
              </span>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{tip}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** 장소 이미지 — 후보 URL을 순서대로 시도하고, 모두 실패하면 placeholder */
function StopImage({ urls }: { urls: (string | null)[] }) {
  const candidates = urls.filter((u): u is string => !!u);
  const [idx, setIdx] = useState(0);

  if (idx >= candidates.length) {
    return (
      <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-[11px] text-zinc-400">
        상점별 사진
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={candidates[idx]}
      src={candidates[idx]}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setIdx((i) => i + 1)}
      className="h-16 w-20 shrink-0 rounded-xl object-cover"
    />
  );
}

function PinDot() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-zinc-400" fill="none">
      <path
        d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
