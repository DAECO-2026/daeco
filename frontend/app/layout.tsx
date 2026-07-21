import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Pretendard 가변 폰트 (자체 호스팅)
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
});

export const metadata: Metadata = {
  title: "DAECO",
  description: "AI가 추천하는 나만의 대전 여행 코스",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6b7fb8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${pretendard.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full">
        {/* 모바일 웹앱 프레임: 뷰포트 높이 고정, 내부에서 스크롤 (헤더·하단 버튼 고정) */}
        <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white shadow-xl">
          {children}
        </div>
      </body>
    </html>
  );
}
