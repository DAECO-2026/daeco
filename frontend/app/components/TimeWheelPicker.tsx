"use client";

import { useEffect, useRef, useState } from "react";

const ITEM_H = 40; // 한 항목 높이(px)
const VISIBLE = 5; // 보이는 항목 수(홀수)
const PAD = ((VISIBLE - 1) / 2) * ITEM_H; // 위·아래 여백

const AMPM = ["오전", "오후"];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1~12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0~59

/** 스크롤 스냅 기반 휠 컬럼 */
function WheelColumn<T>({
  items,
  selectedIndex,
  onSelect,
  format,
}: {
  items: T[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  format: (item: T) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  // 최초 마운트 시 선택 위치로 스크롤
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollTop = selectedIndex * ITEM_H;
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const idx = Math.max(
        0,
        Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)),
      );
      if (Math.abs(el.scrollTop - idx * ITEM_H) > 1) {
        el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
      }
      onSelect(idx);
    }, 100);
  };

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      className="hide-scrollbar flex-1 snap-y snap-mandatory overflow-y-scroll"
      style={{ height: VISIBLE * ITEM_H }}
    >
      <div style={{ height: PAD }} />
      {items.map((item, i) => (
        <div
          key={String(item)}
          className={`flex snap-center items-center justify-center text-lg tabular-nums transition-colors ${
            i === selectedIndex
              ? "font-bold text-zinc-900"
              : "text-zinc-300"
          }`}
          style={{ height: ITEM_H }}
        >
          {format(item)}
        </div>
      ))}
      <div style={{ height: PAD }} />
    </div>
  );
}

/** 오전/오후·시·분 3열 휠 시간 피커 (바텀시트) */
export default function TimeWheelPicker({
  initial,
  onConfirm,
  onClose,
}: {
  initial: string; // "HH:mm" (24시간)
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const [h24, m] = initial.split(":").map(Number);
  const [ampmIdx, setAmpmIdx] = useState(h24 < 12 ? 0 : 1);
  const [hourIdx, setHourIdx] = useState((h24 % 12 || 12) - 1);
  const [minuteIdx, setMinuteIdx] = useState(m);

  const confirm = () => {
    const hour12 = HOURS[hourIdx];
    let hh = hour12 % 12; // 오전 12 → 0
    if (ampmIdx === 1) hh += 12; // 오후 → +12
    const value = `${String(hh).padStart(2, "0")}:${String(
      MINUTES[minuteIdx],
    ).padStart(2, "0")}`;
    onConfirm(value);
  };

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
      onClick={onClose}
    >
      <div
        className="animate-slide-up mx-auto w-full max-w-[430px] rounded-t-3xl bg-white pb-8"
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
          <span className="text-sm font-bold text-zinc-800">시간 선택</span>
          <button
            type="button"
            onClick={confirm}
            className="text-sm font-bold text-brand"
          >
            확인
          </button>
        </div>

        {/* 휠 */}
        <div className="relative px-8">
          {/* 중앙 하이라이트 밴드 */}
          <div
            className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 rounded-xl bg-zinc-100"
            style={{ height: ITEM_H }}
          />
          <div className="relative flex">
            <WheelColumn
              items={AMPM}
              selectedIndex={ampmIdx}
              onSelect={setAmpmIdx}
              format={(v) => v}
            />
            <WheelColumn
              items={HOURS}
              selectedIndex={hourIdx}
              onSelect={setHourIdx}
              format={(v) => String(v)}
            />
            <WheelColumn
              items={MINUTES}
              selectedIndex={minuteIdx}
              onSelect={setMinuteIdx}
              format={(v) => String(v).padStart(2, "0")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
