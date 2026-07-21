"use client";

// 장소를 검색해서 선택하는 바텀시트 (카카오 키워드 검색 사용)

import { useState } from "react";
import { LocationOutlineIcon } from "./icons";

type Place = { name: string; address: string };

export default function PlaceSearchPicker({
  title = "장소 검색",
  onConfirm,
  onClose,
}: {
  title?: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/places?query=${encodeURIComponent(query.trim())}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "검색에 실패했습니다.");
      setResults(data.places ?? []);
    } catch (e) {
      setResults([]);
      setError(e instanceof Error ? e.message : "검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="mx-auto flex h-[80dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-3xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-zinc-400"
          >
            취소
          </button>
          <span className="text-sm font-bold text-zinc-800">{title}</span>
          <span className="w-8" />
        </div>

        {/* 검색 */}
        <div className="flex gap-2 px-5 pb-3">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="장소·주소 검색 (예: 대전역)"
            className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm placeholder:text-zinc-400 focus:border-brand focus:outline-none"
          />
          <button
            type="button"
            onClick={search}
            className="shrink-0 rounded-xl bg-brand px-4 text-sm font-semibold text-white"
          >
            검색
          </button>
        </div>

        {/* 결과 목록 */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          {loading && (
            <p className="mt-8 text-center text-sm text-zinc-400">검색 중...</p>
          )}
          {!loading && error && (
            <p className="mt-8 text-center text-sm text-red-500">{error}</p>
          )}
          {!loading && !error && searched && results.length === 0 && (
            <p className="mt-8 text-center text-sm text-zinc-400">
              검색 결과가 없어요.
            </p>
          )}
          <ul className="divide-y divide-zinc-100">
            {results.map((place, i) => (
              <li key={`${place.name}-${i}`}>
                <button
                  type="button"
                  onClick={() => onConfirm(place.name)}
                  className="flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-zinc-50"
                >
                  <LocationOutlineIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-800">
                      {place.name}
                    </p>
                    {place.address && (
                      <p className="truncate text-xs text-zinc-400">
                        {place.address}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
