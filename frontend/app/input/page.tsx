"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  ClockIcon,
  LocationOutlineIcon,
  CrosshairIcon,
  MapIcon,
} from "../components/icons";
import { requestRouteRecommendation, toLocalTime } from "../lib/api";
import type { RouteRequest } from "../lib/types";

const PLACE_TYPES = [
  "카페",
  "전시/박물관",
  "소품샵",
  "맛집",
  "산책",
  "사진",
  "쇼핑",
  "실내",
];

const CONDITIONS = ["짐이 많아요", "비가 와요", "많이 걷기 힘들어요"];

const inputClass =
  "w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-brand focus:outline-none";

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
      className={`rounded-xl border px-4 py-2.5 text-sm transition-colors ${
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
  const [locationMode, setLocationMode] = useState<"current" | "manual">(
    "current",
  );
  const [currentLocation] = useState("성심당 본점"); // TODO: geolocation 연동
  const [manualLocation, setManualLocation] = useState("");
  const [curTime, setCurTime] = useState("15:20");
  const [arriveLocation, setArriveLocation] = useState("대전역");
  const [deadLine, setDeadLine] = useState("18:00");
  const [types, setTypes] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [conditionText, setConditionText] = useState("");

  // 요청 상태
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (
    value: string,
    list: string[],
    setList: (v: string[]) => void,
  ) =>
    setList(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value],
    );

  const handleRecommend = async () => {
    const curLocation = (
      locationMode === "current" ? currentLocation : manualLocation
    ).trim();

    // 백엔드 RequestDTO 필드에 맞춰 매핑 (루트 이름·현장 조건은 백엔드 미수신 → 제외)
    const payload: RouteRequest = {
      curLocation,
      curTime: toLocalTime(curTime),
      arriveLocation: arriveLocation.trim(),
      deadLine: toLocalTime(deadLine),
      preferLocation: types,
    };

    if (!curLocation || !payload.arriveLocation) {
      setError("현재 위치와 복귀 장소를 입력해주세요.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const result = await requestRouteRecommendation(payload);
      // 결과 화면은 아직 디자인 전 → 응답을 세션에 보관하고 로그로 확인
      sessionStorage.setItem("daeco:lastRequest", JSON.stringify(payload));
      sessionStorage.setItem("daeco:recommendation", JSON.stringify(result));
      console.log("[DAECO] 추천 요청:", payload);
      console.log("[DAECO] 추천 응답:", result);
      // TODO: 결과 화면 디자인 확정 시 router.push("/result")로 이동
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
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setLocationMode("current")}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${
                locationMode === "current"
                  ? "border border-brand bg-brand/10 text-brand"
                  : "bg-zinc-100 text-zinc-400"
              }`}
            >
              현재 위치 사용
            </button>
            <button
              type="button"
              onClick={() => setLocationMode("manual")}
              className={`flex-1 rounded-xl py-3 text-sm font-semibold transition-colors ${
                locationMode === "manual"
                  ? "border border-brand bg-brand/10 text-brand"
                  : "bg-zinc-100 text-zinc-400"
              }`}
            >
              직접 입력
            </button>
          </div>

          {locationMode === "current" ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-zinc-200 px-4 py-3">
              <LocationOutlineIcon className="h-5 w-5 shrink-0 text-zinc-500" />
              <div className="flex-1">
                <p className="text-xs text-zinc-400">현재 위치</p>
                <p className="text-sm font-medium text-zinc-800">
                  {currentLocation}
                </p>
              </div>
              <button
                type="button"
                aria-label="현재 위치 새로고침"
                className="text-brand"
              >
                <CrosshairIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder="출발 위치를 입력하세요."
              className={`mt-3 ${inputClass}`}
            />
          )}
        </section>

        {/* 현재 시각 */}
        <section className="mt-6">
          <label className="text-[15px] font-bold text-zinc-900">
            현재 시각
          </label>
          <div className="relative mt-2">
            <ClockIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={curTime}
              onChange={(e) => setCurTime(e.target.value)}
              className={`${inputClass} pl-11`}
            />
          </div>
        </section>

        {/* 복귀 장소 / 복귀 마감 시각 */}
        <section className="mt-6 grid grid-cols-2 gap-3">
          <div>
            <label className="text-[15px] font-bold text-zinc-900">
              복귀 장소
            </label>
            <div className="relative mt-2">
              <LocationOutlineIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={arriveLocation}
                onChange={(e) => setArriveLocation(e.target.value)}
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>
          <div>
            <label className="text-[15px] font-bold text-zinc-900">
              복귀 마감 시각
            </label>
            <div className="relative mt-2">
              <ClockIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={deadLine}
                onChange={(e) => setDeadLine(e.target.value)}
                className={`${inputClass} pl-11`}
              />
            </div>
          </div>
        </section>

        {/* 선호 장소 유형 */}
        <section className="mt-6">
          <p className="text-[15px] font-bold text-zinc-900">
            선호 장소 유형{" "}
            <span className="text-sm font-normal text-zinc-400">
              (복수 선택)
            </span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {PLACE_TYPES.map((type) => (
              <Chip
                key={type}
                label={type}
                active={types.includes(type)}
                onClick={() => toggle(type, types, setTypes)}
              />
            ))}
          </div>
        </section>

        {/* 현장 조건 */}
        <section className="mt-6">
          <p className="text-[15px] font-bold text-zinc-900">현장 조건</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CONDITIONS.map((cond) => (
              <Chip
                key={cond}
                label={cond}
                active={conditions.includes(cond)}
                onClick={() => toggle(cond, conditions, setConditions)}
              />
            ))}
          </div>
          <input
            type="text"
            value={conditionText}
            onChange={(e) => setConditionText(e.target.value)}
            placeholder="조건을 입력하세요."
            className={`mt-3 ${inputClass}`}
          />
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
    </div>
  );
}
