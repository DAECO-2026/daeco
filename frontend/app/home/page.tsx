import Link from "next/link";
import Image from "next/image";
import BottomNav from "../components/BottomNav";
import {
  SearchIcon,
  PinIcon,
  ChevronRightIcon,
  ClockIcon,
  PlusIcon,
  LeafIcon,
  UtensilsIcon,
  MuseumIcon,
  MoonIcon,
} from "../components/icons";

const THEMES = [
  { label: "자연 힐링", Icon: LeafIcon, bg: "bg-green-50", fg: "text-green-600" },
  {
    label: "맛집 투어",
    Icon: UtensilsIcon,
    bg: "bg-orange-50",
    fg: "text-orange-500",
  },
  {
    label: "문화·힐링",
    Icon: MuseumIcon,
    bg: "bg-violet-50",
    fg: "text-violet-500",
  },
  { label: "대전 야경", Icon: MoonIcon, bg: "bg-sky-50", fg: "text-sky-500" },
];

export default function HomePage() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {/* 스카이라인 워터마크 */}
      <Image
        src="/city.png"
        alt=""
        width={414}
        height={317}
        priority
        className="pointer-events-none absolute left-0 -top-24 w-full opacity-[0.06] invert"
      />

      {/* 헤더 */}
      <header className="relative z-10 flex items-center justify-center py-5">
        <span className="text-xl font-extrabold tracking-tight text-brand">
          DAECO
        </span>
        <button
          type="button"
          aria-label="검색"
          className="absolute right-6 text-zinc-700"
        >
          <SearchIcon className="h-6 w-6" />
        </button>
      </header>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        {/* 인사 */}
        <section className="pt-2">
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

        {/* 오늘의 추천 코스 */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-900">
              오늘의 추천 코스
            </h2>
            <button
              type="button"
              className="flex items-center gap-0.5 text-sm text-zinc-400"
            >
              더보기
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            className="mt-3 flex w-full gap-3 rounded-2xl border border-zinc-200 p-3 text-left transition-colors hover:bg-zinc-50"
          >
            <div className="flex h-20 w-24 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-[11px] text-zinc-400">
              대표 사진
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-900">대전 핫플 완전 정복</h3>
                <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                  인기
                </span>
              </div>
              <p className="mt-1.5 truncate text-[13px] text-zinc-500">
                성심당 본점 → 카페 → 소품샵 → 대전역
              </p>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-zinc-400">
                <ClockIcon className="h-3.5 w-3.5" />
                2시간 30분 · 예상 금액 ₩21,000원
              </p>
            </div>
          </button>
        </section>

        {/* 테마별로 돌려보기 */}
        <section className="mt-8">
          <h2 className="text-base font-bold text-zinc-900">
            테마별로 돌려보기
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {THEMES.map(({ label, Icon, bg, fg }) => (
              <button
                key={label}
                type="button"
                className={`flex items-center gap-3 rounded-2xl ${bg} px-4 py-4`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70">
                  <Icon className={`h-5 w-5 ${fg}`} />
                </span>
                <span className="font-bold text-zinc-800">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 새 루트 만들기 */}
        <Link
          href="/input"
          className="mt-7 flex items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-bold text-white transition-colors hover:bg-brand-strong"
        >
          <PlusIcon className="h-5 w-5" />새 루트 만들기
        </Link>

        {/* 하단 도들 장식 */}
        <Image
          src="/route-doodle.png"
          alt=""
          width={371}
          height={210}
          className="pointer-events-none mt-6 ml-auto w-3/5 opacity-40"
        />
      </div>

      <BottomNav />
    </div>
  );
}
