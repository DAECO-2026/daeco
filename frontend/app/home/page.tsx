import Link from "next/link";
import BottomNav from "../components/BottomNav";
import {
  MenuIcon,
  PinIcon,
  ChevronRightIcon,
  PlusIcon,
} from "../components/icons";

type Route = {
  title: string;
  date: string;
  places: string[];
  duration: string;
  distance: string;
};

// 임시 목업 데이터 (추후 API 연동)
const RECENT_ROUTES: Route[] = [
  {
    title: "실내 구경 루트",
    date: "2026.07.20 (월)",
    places: ["성심당 본점", "대전근현대사전시관", "소품샵", "대전역"],
    duration: "2시간 30분",
    distance: "1.8km",
  },
  {
    title: "야구 후 여유 루트",
    date: "2026.07.01 (월)",
    places: ["한화생명 이글스파크", "한밭수목원", "카페", "대전역"],
    duration: "1시간 26분",
    distance: "3.6km",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col bg-white">
      {/* 헤더 */}
      <header className="relative flex items-center justify-center py-5">
        <button
          type="button"
          aria-label="메뉴 열기"
          className="absolute left-6 text-zinc-800"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <span className="text-xl font-extrabold tracking-tight text-brand">
          DAECO
        </span>
      </header>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto pb-4">
        {/* 인사 */}
        <section className="px-6 pt-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-lg font-bold text-zinc-800">안녕하세요!</p>
              <h1 className="mt-1 text-[27px] font-extrabold leading-tight text-zinc-900">
                대전을 더 즐겨보세요.
              </h1>
            </div>
            <PinIcon className="mt-1 h-12 w-12 shrink-0 text-brand" />
          </div>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            남은 시간 안에 방문 가능한
            <br />
            AI 맞춤 루트를 추천해드려요.
          </p>
        </section>

        {/* 최근 루트 */}
        <section className="mt-9 px-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900">최근 루트</h2>
            <button
              type="button"
              className="flex items-center gap-0.5 text-sm text-zinc-400"
            >
              전체 보기
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {RECENT_ROUTES.map((route) => (
              <button
                key={route.title}
                type="button"
                className="flex w-full items-center gap-3 rounded-2xl border border-zinc-200 px-5 py-4 text-left transition-colors hover:bg-zinc-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-bold text-zinc-900">{route.title}</h3>
                    <span className="text-xs text-zinc-400">{route.date}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-5 text-zinc-500">
                    {route.places.join(" → ")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {route.duration} · {route.distance}
                  </p>
                </div>
                <ChevronRightIcon className="h-5 w-5 shrink-0 text-zinc-300" />
              </button>
            ))}
          </div>

          {/* 새 루트 만들기 */}
          <Link
            href="/input"
            className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-bold text-white transition-colors hover:bg-brand-strong active:bg-brand-strong"
          >
            <PlusIcon className="h-5 w-5" />새 루트 만들기
          </Link>
        </section>
      </div>

      {/* 하단 탭 */}
      <BottomNav />
    </div>
  );
}
