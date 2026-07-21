"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const SPLASH_DURATION = 1300;
const FADE_DURATION = 400;

export default function SplashPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    router.prefetch("/onboarding");
    const enter = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setLeaving(true), SPLASH_DURATION);
    return () => {
      cancelAnimationFrame(enter);
      clearTimeout(timer);
    };
  }, [router]);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => router.push("/onboarding"), FADE_DURATION);
    return () => clearTimeout(timer);
  }, [leaving, router]);

  return (
    <div
      onClick={() => setLeaving(true)}
      className="relative flex flex-1 cursor-pointer flex-col overflow-hidden text-white transition-opacity ease-out"
      style={{
        background:
          "linear-gradient(180deg, #6f83c6 0%, #8497d1 38%, #b3c0e3 72%, #cdd6ec 100%)",
        opacity: visible && !leaving ? 1 : 0,
        transitionDuration: `${FADE_DURATION}ms`,
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

      {/* 하단 도시 스카이라인 */}
      <Image
        src="/city.png"
        alt=""
        width={414}
        height={317}
        priority
        className="pointer-events-none absolute bottom-0 left-0 h-auto w-full"
      />
    </div>
  );
}
