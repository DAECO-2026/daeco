"use client";

// ⚠️ 임시 결과 화면 — 백엔드 응답 확인용. 결과 화면 디자인 확정 시 교체 예정.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeftIcon } from "../components/icons";
import type { RouteResponse } from "../lib/types";

/** "HH:mm:ss" → "N시간 M분" (0 파트 생략) */
function formatDuration(hms: string): string {
  const [h, m] = hms.split(":").map(Number);
  const parts: string[] = [];
  if (h) parts.push(`${h}시간`);
  if (m) parts.push(`${m}분`);
  return parts.length ? parts.join(" ") : "0분";
}

/** "HH:mm:ss" → "HH:mm" */
function clock(hms: string): string {
  return hms.slice(0, 5);
}

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

  const options = data?.stopoverList ?? [];

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
        {!loaded ? null : options.length === 0 ? (
          <p className="mt-20 text-center text-sm text-zinc-400">
            추천 결과가 없습니다.
          </p>
        ) : (
          <div className="space-y-8">
            {options.map((opt, i) => (
              <section key={i}>
                <h2 className="mb-3 text-base font-bold text-zinc-900">
                  추천 코스 {i + 1}
                </h2>

                {/* 요약 */}
                <div className="rounded-2xl bg-brand/10 px-5 py-4 text-sm text-brand-ink">
                  <p>
                    총 소요 <b>{formatDuration(opt.totalUseTime)}</b> · 이동{" "}
                    <b>{formatDuration(opt.totalMovementTime)}</b> (
                    {opt.totalMovementDistance}km)
                  </p>
                  <p className="mt-1">
                    예상 예산 <b>{opt.totalBudget.toLocaleString("ko-KR")}원</b>
                  </p>
                </div>

                {/* 경유지 */}
                <ol className="mt-4 space-y-3">
                  {opt.stopovers.map((s) => (
                    <li
                      key={s.sequence}
                      className="rounded-2xl border border-zinc-200 px-5 py-4"
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                          {s.sequence + 1}
                        </span>
                        <h3 className="font-bold text-zinc-900">
                          {s.locationName}
                        </h3>
                        <span className="ml-auto text-xs text-zinc-400">
                          {clock(s.arriveTime)} 도착
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-zinc-400">
                        {s.movementTime !== "00:00:00" && (
                          <>
                            {s.transportation} {formatDuration(s.movementTime)} (
                            {s.movementDistance}km) ·{" "}
                          </>
                        )}
                        체류 {formatDuration(s.recommendStayTime)}
                        {s.budget > 0 &&
                          ` · ${s.budget.toLocaleString("ko-KR")}원`}
                      </p>

                      <p className="mt-1 text-sm text-zinc-600">
                        {s.recommendReason}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
