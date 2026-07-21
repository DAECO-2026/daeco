import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
  display: "swap",
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
    <html lang="ko" className={`${notoSansKr.variable} h-full`}>
      <body className="h-full">
        {/* 모바일 웹앱 프레임: 데스크톱에서는 가운데 정렬된 폰 너비 컬럼 */}
        <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white shadow-xl">
          {children}
        </div>
      </body>
    </html>
  );
}
