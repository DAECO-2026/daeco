/** 스플래시 하단의 대전 스카이라인 실루엣 (다리 · 대관람차 · 타워 · 빌딩군 + 물 반영) */
export default function DaejeonSkyline({
  className,
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 430 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
    >
      {/* 도시 실루엣 (기준선 y=180) */}
      <g id="daeco-city" fill="#ffffff">
        {/* 좌측 전망 타워 */}
        <path d="M40 180 L45 96 L55 96 L60 180 Z" />
        <rect x="43" y="86" width="14" height="14" rx="3" />
        <rect x="48.5" y="58" width="3" height="30" />
        <circle cx="50" cy="55" r="3" />
        {/* 빌딩군 */}
        <rect x="70" y="118" width="20" height="62" />
        <rect x="93" y="100" width="24" height="80" rx="2" />
        <rect x="120" y="128" width="18" height="52" />
        <rect x="142" y="88" width="26" height="92" rx="2" />
        <rect x="171" y="134" width="16" height="46" />
        {/* 사장교 (엑스포다리 느낌): 주탑 + 케이블 + 상판 */}
        <rect x="243" y="96" width="5" height="70" />
        <path
          d="M245.5 98 L214 165 M245.5 98 L277 165 M245.5 108 L224 165 M245.5 108 L267 165 M245.5 118 L234 165 M245.5 118 L257 165"
          stroke="#ffffff"
          strokeWidth="1.4"
        />
        <rect x="206" y="164" width="86" height="6" rx="2" />
        {/* 우측 빌딩군 */}
        <rect x="300" y="112" width="18" height="68" rx="2" />
        <rect x="321" y="132" width="16" height="48" />
        {/* 대관람차 */}
        <circle
          cx="384"
          cy="120"
          r="34"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
        />
        <path
          d="M384 86 L384 154 M350 120 L418 120 M360 96 L408 144 M360 144 L408 96"
          stroke="#ffffff"
          strokeWidth="1.4"
        />
        <circle cx="384" cy="120" r="4" />
        <circle cx="384" cy="86" r="3.5" />
        <circle cx="384" cy="154" r="3.5" />
        <circle cx="350" cy="120" r="3.5" />
        <circle cx="418" cy="120" r="3.5" />
        <circle cx="360" cy="96" r="3.5" />
        <circle cx="408" cy="96" r="3.5" />
        <circle cx="360" cy="144" r="3.5" />
        <circle cx="408" cy="144" r="3.5" />
        <path d="M370 148 L384 120 L398 148 Z" fill="#ffffff" opacity="0.9" />
        {/* 지면 */}
        <rect x="0" y="178" width="430" height="4" />
      </g>

      {/* 물 반영 (기준선 y=180 기준 대칭, 흐리게) */}
      <use
        href="#daeco-city"
        transform="translate(0 360) scale(1 -1)"
        opacity="0.16"
      />
    </svg>
  );
}
