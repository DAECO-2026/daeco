"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  ClockIcon,
  LocationOutlineIcon,
  CrosshairIcon,
  MapIcon,
} from "../components/icons";
import { requestRouteRecommendation, toLocalTime } from "../lib/api";
import type { RouteRequest } from "../lib/types";
import TimeWheelPicker from "../components/TimeWheelPicker";
import PlaceSearchPicker from "../components/PlaceSearchPicker";

const TRANSPORTS = ["택시", "대중교통", "도보"];

const inputClass =
  "w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-brand focus:outline-none";

/** 숫자만 남겨 천단위 콤마로 포맷 ("1000" → "1,000") */
function formatNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits).toLocaleString("ko-KR") : "";
}

/** "HH:mm"(24h) → "오전/오후 hh:mm" 표시용 */
function formatDisplayTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h < 12 ? "오전" : "오후";
  const h12 = h % 12 || 12;
  return `${ampm} ${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-5 py-2.5 text-sm transition-colors ${
        active
          ? "border-brand bg-brand/10 font-semibold text-brand"
          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      }`}
    >
      {label}
    </button>
  );
}

export default function CreateRoutePage() {
  const router = useRouter();

  // 폼 상태
  const [routeName, setRouteName] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [curTime, setCurTime] = useState("15:20");
  const [budget, setBudget] = useState("");
  const [arriveLocation, setArriveLocation] = useState("");
  const [deadLine, setDeadLine] = useState("18:00");
  const [transports, setTransports] = useState<string[]>([]);

  // 시간 피커 (열린 대상)
  const [picker, setPicker] = useState<"cur" | "dead" | null>(null);

  // 복귀 장소 검색 피커
  const [placeSearchOpen, setPlaceSearchOpen] = useState(false);

  // 요청 상태
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTransport = (value: string) =>
    setTransports((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value],
    );

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("이 브라우저에서는 위치 기능을 지원하지 않아요.");
      return;
    }
    setError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const fallback = `위도 ${latitude.toFixed(5)}, 경도 ${longitude.toFixed(5)}`;
        try {
          // 카카오 역지오코딩(서버 프록시)으로 좌표 → 주소 변환
          const res = await fetch(
            `/api/geocode?lat=${latitude}&lng=${longitude}`,
          );
          const data = await res.json();
          setCurrentLocation(
            res.ok && data.placeName ? data.placeName : fallback,
          );
        } catch {
          setCurrentLocation(fallback);
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setError(
          err.code === err.PERMISSION_DENIED
            ? "위치 권한이 거부됐어요. 브라우저 설정에서 위치를 허용해주세요."
            : "현재 위치를 가져올 수 없어요. 잠시 후 다시 시도해주세요.",
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleRecommend = async () => {
    // 백엔드 RequestDTO 필드에 맞춰 매핑
    // (루트 이름·총 예산·이동 수단은 백엔드 미수신 → 제외, preferLocation은 현재 UI 미수집)
    const payload: RouteRequest = {
      curLocation: currentLocation.trim(),
      curTime: toLocalTime(curTime),
      arriveLocation: arriveLocation.trim(),
      deadLine: toLocalTime(deadLine),
      preferLocation: [],
    };

    if (!payload.curLocation || !payload.arriveLocation) {
      setError("현재 위치와 복귀 장소를 입력해주세요.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const result = await requestRouteRecommendation(payload);
      sessionStorage.setItem("daeco:lastRequest", JSON.stringify(payload));
      sessionStorage.setItem("daeco:recommendation", JSON.stringify(result));
      router.push("/result");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "요청 중 오류가 발생했습니다.",
      );
    } finally {
      setSubmitting(false);
    }
  };

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
        <h1 className="text-xl font-bold text-zinc-900">루트 만들기</h1>
      </header>

      {/* 폼 */}
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        {/* 루트 이름 */}
        <section>
          <label className="text-[15px] font-bold text-zinc-900">
            루트 이름
          </label>
          <input
            type="text"
            value={routeName}
            onChange={(e) => setRouteName(e.target.value)}
            placeholder="예) 빵지순례 투어"
            className={`mt-2 ${inputClass}`}
          />
        </section>

        {/* 위치 */}
        <section className="mt-6">
          <p className="text-[15px] font-bold text-zinc-900">위치</p>
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3">
            <LocationOutlineIcon className="h-5 w-5 shrink-0 text-zinc-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-zinc-400">현재 위치</p>
              <p
                className={`truncate text-sm font-medium ${
                  currentLocation ? "text-zinc-800" : "text-zinc-400"
                }`}
              >
                {locating
                  ? "위치 확인 중..."
                  : currentLocation || "현재 위치를 가져오세요"}
              </p>
            </div>
            <button
              type="button"
              aria-label="현재 위치 가져오기"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="shrink-0 text-brand disabled:opacity-50"
            >
              <CrosshairIcon className={`h-5 w-5 ${locating ? "animate-spin" : ""}`} />
            </button>
          </div>
        </section>

        {/* 시간입력 */}
        <section className="mt-6">
          <label className="text-[15px] font-bold text-zinc-900">
            시간입력
          </label>
          <button
            type="button"
            onClick={() => setPicker("cur")}
            className="relative mt-2 flex w-full items-center rounded-xl border border-zinc-200 py-3 pl-11 pr-11 text-left text-sm text-zinc-800"
          >
            <ClockIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            {formatDisplayTime(curTime)}
            <ChevronDownIcon className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          </button>
        </section>

        {/* 총 예산 입력 */}
        <section className="mt-6">
          <label className="text-[15px] font-bold text-zinc-900">
            총 예산 입력
          </label>
          <div className="relative mt-2">
            <span
              className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold ${
                budget ? "text-zinc-800" : "text-zinc-400"
              }`}
            >
              ₩
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={budget}
              onChange={(e) => setBudget(formatNumber(e.target.value))}
              placeholder="최소 금액 1,000원 이상"
              className={`${inputClass} pl-9`}
            />
          </div>
        </section>

        {/* 복귀 장소 / 복귀 마감 시각 */}
        <section className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <label className="text-[15px] font-bold text-zinc-900">
              복귀 장소
            </label>
            <button
              type="button"
              onClick={() => setPlaceSearchOpen(true)}
              className="relative mt-2 flex w-full items-center rounded-xl border border-zinc-200 py-3 pl-11 pr-4 text-left text-sm text-zinc-800"
            >
              <LocationOutlineIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <span className={`truncate ${arriveLocation ? "" : "text-zinc-400"}`}>
                {arriveLocation || "장소 선택"}
              </span>
            </button>
          </div>
          <div>
            <label className="text-[15px] font-bold text-zinc-900">
              복귀 마감 시각
            </label>
            <button
              type="button"
              onClick={() => setPicker("dead")}
              className="relative mt-2 flex w-full items-center rounded-xl border border-zinc-200 py-3 pl-11 pr-4 text-left text-sm text-zinc-800"
            >
              <ClockIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              {formatDisplayTime(deadLine)}
            </button>
          </div>
        </section>

        {/* 이동 수단 */}
        <section className="mt-6">
          <p className="text-[15px] font-bold text-zinc-900">
            이동 수단{" "}
            <span className="text-sm font-normal text-zinc-400">
              (복수 선택 가능)
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TRANSPORTS.map((t) => (
              <Chip
                key={t}
                label={t}
                active={transports.includes(t)}
                onClick={() => toggleTransport(t)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* 추천 버튼 */}
      <div className="px-6 pb-6 pt-2">
        {error && (
          <p className="mb-3 text-center text-sm text-red-500">{error}</p>
        )}
        <button
          type="button"
          onClick={handleRecommend}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-bold text-white transition-colors hover:bg-brand-strong active:bg-brand-strong disabled:opacity-60"
        >
          <MapIcon className="h-5 w-5" />
          {submitting ? "루트 추천 받는 중..." : "AI 루트 추천받기"}
        </button>
      </div>

      {/* 시간 휠 피커 */}
      {picker && (
        <TimeWheelPicker
          initial={picker === "cur" ? curTime : deadLine}
          onConfirm={(v) => {
            if (picker === "cur") setCurTime(v);
            else setDeadLine(v);
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
        />
      )}

      {/* 복귀 장소 검색 피커 */}
      {placeSearchOpen && (
        <PlaceSearchPicker
          title="복귀 장소 검색"
          onConfirm={(name) => {
            setArriveLocation(name);
            setPlaceSearchOpen(false);
          }}
          onClose={() => setPlaceSearchOpen(false)}
        />
      )}
    </div>
  );
}
