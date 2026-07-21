"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, MapPinIcon, BookmarkIcon } from "./icons";

type NavItem = {
  label: string;
  href?: string; // 아직 만들지 않은 화면은 href 없이 비활성으로 표시
  Icon: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement;
};

const ITEMS: NavItem[] = [
  { label: "홈", href: "/home", Icon: HomeIcon },
  { label: "지도", href: "/map", Icon: MapPinIcon },
  { label: "즐겨찾기", Icon: BookmarkIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-around border-t border-zinc-100 px-6 pb-3 pt-2.5">
      {ITEMS.map(({ label, href, Icon }) => {
        const active = href ? pathname === href : false;
        const className = `flex flex-col items-center gap-1 ${
          active ? "text-zinc-800" : "text-zinc-400"
        }`;
        const content = (
          <>
            <Icon className="h-6 w-6" />
            <span className="text-[11px] font-medium">{label}</span>
          </>
        );

        return href ? (
          <Link key={label} href={href} className={className}>
            {content}
          </Link>
        ) : (
          <span key={label} className={`${className} cursor-default`}>
            {content}
          </span>
        );
      })}
    </nav>
  );
}
