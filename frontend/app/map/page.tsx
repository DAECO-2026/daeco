"use client";

// 지도 탭 = AI 루트 추천 결과 화면.
// 지도는 카카오 JS SDK로 대체 예정(현재 placeholder). 경로는 순위별 색으로 표시.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RouteResponse, RouteOption } from "../lib/types";
import BottomNav from "../components/BottomNav";
import KakaoRouteMap from "../components/KakaoRouteMap";
import { SearchIcon, BookmarkIcon } from "../components/icons";

const FILTERS = ["추천 루트", "카페", "맛집", "관광"];
const RANK_COLORS = ["var(--route-1)", "var(--route-2)", "var(--route-3)"];

/** "HH:mm:ss" → "N시간 M분" */
function formatDuration(hms: string): string {
  const [h, m] = hms.split(":").map(Number);
  const parts: string[] = [];
  if (h) parts.push(`${h}시간`);
  if (m) parts.push(`${m}분`);
  return parts.length ? parts.join(" ") : "0분";
}

export default function MapPage() {
  const router = useRouter();
  const [options, setOptions] = useState<RouteOption[]>([]);
  const [selected, setSelected] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const startRoute = () => {
    const route = options[selected];
    if (!route) return;
    sessionStorage.setItem("daeco:selectedRoute", JSON.stringify(route));
    router.push("/route");
  };

  useEffect(() => {
    const raw = sessionStorage.getItem("daeco:recommendation");
    if (raw) {
      try {
        const data = JSON.parse(raw) as RouteResponse;
        setOptions(data.stopoverList ?? []);
      } catch {
        setOptions([]);
      }
    }
    setLoaded(true);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-6 pb-2 pt-5">
        <h1 className="text-xl font-bold text-zinc-900">지도</h1>
        <div className="flex items-center gap-4 text-zinc-700">
          <BookmarkIcon className="h-5 w-5" />
          <span className="text-lg leading-none">⋮</span>
        </div>
      </header>

      {/* 검색 */}
      <div className="px-6 pb-3">
        <div className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5">
          <SearchIcon className="h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="장소 검색"
            className="w-full bg-transparent text-sm placeholder:text-zinc-400 focus:outline-none"
          />
        </div>
      </div>

      {/* 필터 칩 */}
      <div className="flex gap-2 overflow-x-auto px-6 pb-3">
        {FILTERS.map((f, i) => (
          <button
            key={f}
            type="button"
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium ${
              i === 0
                ? "border-brand bg-brand/10 text-brand"
                : "border-zinc-200 text-zinc-500"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* 지도 */}
      <KakaoRouteMap
        options={options}
        selected={selected}
        className="h-64 w-full shrink-0 bg-zinc-100"
      />

      {/* 추천 루트 카드 + 시작 버튼 */}
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">AI 추천 루트</h2>
            <span className="text-xs text-zinc-400">지도에서 보기</span>
          </div>

          {!loaded ? null : options.length === 0 ? (
            <p className="mt-10 text-center text-sm text-zinc-400">
              추천받은 루트가 없어요.
            </p>
          ) : (
            <div className="space-y-3">
              {options.map((opt, i) => {
                const active = i === selected;
                const path = opt.stopovers
                  .map((s) => s.locationName)
                  .join(" → ");
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelected(i)}
                    className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      active
                        ? "border-brand bg-brand/5"
                        : "border-zinc-200"
                    }`}
                  >
                    {/* 순위 색 표시 */}
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          RANK_COLORS[i] ?? "var(--route-3)",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-zinc-900">
                        AI 추천 {i + 1}순위
                      </p>
                      <p className="mt-1 truncate text-[13px] text-zinc-600">
                        {path}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {formatDuration(opt.totalUseTime)} · 예상 금액 ₩
                        {opt.totalBudget.toLocaleString("ko-KR")}
                      </p>
                    </div>
                    {/* 선택 표시 */}
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        active
                          ? "border-brand bg-brand text-white"
                          : "border-zinc-300"
                      }`}
                    >
                      {active && (
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
                          <path
                            d="m5 12 5 5 9-9"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 시작 버튼 */}
        <div className="px-6 pb-4 pt-3">
          <button
            type="button"
            onClick={startRoute}
            disabled={options.length === 0}
            className="w-full rounded-2xl bg-brand py-4 text-base font-bold text-white transition-colors hover:bg-brand-strong disabled:opacity-50"
          >
            이 루트로 시작하기
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
