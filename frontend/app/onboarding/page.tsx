"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="animate-fade-in-up relative flex flex-1 flex-col overflow-hidden bg-white px-8 pt-28 pb-10">
      {/* 스카이라인 워터마크 (홈과 동일 위치) */}
      <Image
        src="/city.png"
        alt=""
        width={414}
        height={317}
        priority
        className="pointer-events-none absolute left-0 -top-24 w-full opacity-[0.06] invert"
      />

      {/* 헤드라인 */}
      <div className="relative z-10 text-center">
        <h1 className="text-2xl font-bold leading-9 text-brand-ink">
          AI 맞춤 추천으로
          <br />
          더 즐거운 대전 여행 즐기기
        </h1>
        <p className="mt-5 text-sm leading-6 text-zinc-500">
          당신의 취향과 시간을 고려해
          <br />
          최적의 루트를 추천해드려요.
        </p>
      </div>

      {/* 지도 일러스트 (좌우 꽉 차게) */}
      <div className="relative z-10 -mx-8 flex flex-1 items-center justify-center">
        <Image
          src="/map.png"
          alt="추천 루트 지도"
          width={398}
          height={429}
          priority
          className="h-auto w-full"
        />
      </div>

      {/* 시작 버튼 */}
      <button
        type="button"
        onClick={() => router.push("/home")}
        className="relative z-10 w-full rounded-2xl bg-brand py-4 text-base font-bold text-white transition-colors hover:bg-brand-strong active:bg-brand-strong"
      >
        시작하기
      </button>
    </div>
  );
}
