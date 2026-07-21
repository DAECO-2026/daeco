"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import DaejeonSkyline from "./components/DaejeonSkyline";

const SPLASH_DURATION = 2200;

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/onboarding");
    const timer = setTimeout(() => router.push("/onboarding"), SPLASH_DURATION);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      onClick={() => router.push("/onboarding")}
      className="relative flex flex-1 cursor-pointer flex-col overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(180deg, #6f83c6 0%, #8497d1 38%, #b3c0e3 72%, #cdd6ec 100%)",
      }}
    >
      {/* 로고 · 슬로건 */}
      <div className="flex flex-1 flex-col items-center justify-center pb-24">
        <h1 className="text-6xl font-black tracking-tight drop-shadow-sm">
          DAECO
        </h1>
        <p className="mt-6 text-center text-base font-medium leading-7 text-white/90">
          AI가 추천하는
          <br />
          나만의 대전 여행 코스
        </p>
      </div>

      {/* 하단 스카이라인 */}
      <DaejeonSkyline className="pointer-events-none absolute bottom-0 left-0 w-full" />
    </div>
  );
}
