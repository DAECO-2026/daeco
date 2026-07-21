/** 온보딩 화면의 접힌 지도 + 추천 루트 일러스트 (출발/경유 → 도착 핀) */
export default function RouteMap({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 360 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fold-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f4f5f7" />
          <stop offset="1" stopColor="#e7e9ee" />
        </linearGradient>
        <linearGradient id="fold-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eceef2" />
          <stop offset="1" stopColor="#dcdfe6" />
        </linearGradient>
      </defs>

      {/* 접힌 지도 패널 (지그재그 폴드) */}
      <g>
        <path d="M20 78 L110 62 L110 250 L20 262 Z" fill="url(#fold-a)" />
        <path d="M110 62 L200 78 L200 262 L110 250 Z" fill="url(#fold-b)" />
        <path d="M200 78 L290 62 L290 250 L200 262 Z" fill="url(#fold-a)" />
        <path d="M290 62 L340 74 L340 240 L290 250 Z" fill="url(#fold-b)" />
        {/* 폴드 음영 라인 */}
        <path
          d="M110 62 L110 250 M200 78 L200 262 M290 62 L290 250"
          stroke="#c9cdd6"
          strokeWidth="1"
          opacity="0.7"
        />
      </g>

      {/* 도로 그리드 */}
      <g stroke="#d3d7df" strokeWidth="2" strokeLinecap="round">
        <path d="M40 120 L330 105" />
        <path d="M32 165 L332 152" />
        <path d="M36 208 L330 198" />
        <path d="M80 80 L92 255" />
        <path d="M160 72 L172 258" />
        <path d="M245 72 L255 252" />
      </g>

      {/* 공원 블록 */}
      <rect x="118" y="128" width="46" height="30" rx="4" fill="#cfe3b8" />
      <rect x="258" y="170" width="40" height="34" rx="4" fill="#cfe3b8" />

      {/* 추천 루트 라인 */}
      <path
        d="M72 232 Q118 214 132 200 Q150 182 180 186 Q214 190 228 168 Q244 142 232 128"
        stroke="var(--route)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* 경유 지점 (흰 원) */}
      <circle cx="132" cy="200" r="6" fill="#ffffff" stroke="var(--route)" strokeWidth="3" />
      <circle cx="228" cy="168" r="6" fill="#ffffff" stroke="var(--route)" strokeWidth="3" />

      {/* 출발 지점 */}
      <circle cx="72" cy="232" r="7" fill="var(--route)" stroke="#ffffff" strokeWidth="3" />

      {/* 도착 핀 (보라) */}
      <g transform="translate(232 128)">
        <path
          d="M0 -34 C-14 -34 -24 -24 -24 -11 C-24 5 0 22 0 22 C0 22 24 5 24 -11 C24 -24 14 -34 0 -34 Z"
          fill="var(--pin-purple)"
        />
        <circle cx="0" cy="-11" r="8" fill="#ffffff" />
      </g>

      {/* 보조 목적지 핀 (초록) */}
      <g transform="translate(298 210)">
        <path
          d="M0 -28 C-11 -28 -20 -20 -20 -9 C-20 4 0 18 0 18 C0 18 20 4 20 -9 C20 -20 11 -28 0 -28 Z"
          fill="var(--pin-green)"
        />
        <circle cx="0" cy="-9" r="6.5" fill="#ffffff" />
      </g>
    </svg>
  );
}
