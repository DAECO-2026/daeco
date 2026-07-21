"use client";

// ⚠️ 임시 결과 화면 — 백엔드 응답 확인용 최소 구현. 결과 화면 디자인 확정 시 교체 예정.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "../components/icons";
import type { RouteResponse } from "../lib/types";

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState<RouteResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("daeco:recommendation");
    if (raw) {
      try {
        setData(JSON.parse(raw) as RouteResponse);
      } catch {
        setData(null);
      }
    }
    setLoaded(true);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <header className="relative flex items-center justify-center px-6 py-5">
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={() => router.back()}
          className="absolute left-6 text-zinc-800"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-zinc-900">추천 루트</h1>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-8">
        {!loaded ? null : !data ? (
          <p className="mt-20 text-center text-sm text-zinc-400">
            추천 결과가 없습니다.
          </p>
        ) : (
          <>
            {/* 요약 */}
            <div className="rounded-2xl bg-brand/10 px-5 py-4">
              <p className="text-sm text-brand-ink">
                총 <b>{data.stopoverCount}곳</b> · 예상 복귀{" "}
                <b>{data.arriveTime}</b>
              </p>
              <p className="mt-1 text-sm text-brand-ink">
                복귀 전 여유 <b>{data.remainTime}</b>
              </p>
            </div>

            {/* 경유지 목록 */}
            <ol className="mt-5 space-y-3">
              {data.stopovers.map((s) => (
                <li
                  key={s.sequence}
                  className="rounded-2xl border border-zinc-200 px-5 py-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {s.sequence}
                    </span>
                    <h3 className="font-bold text-zinc-900">
                      {s.locationName}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs text-zinc-400">
                    이동 {s.pathTime} · 체류 {s.recommendStayTime}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {s.recommendReason}
                  </p>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}
