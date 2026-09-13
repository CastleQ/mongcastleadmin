import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "몽캐슬 파티룸 관리자",
  description: "몽캐슬 파티룸 운영관리",
};

// 폰에서 화면 폭보다 작게 축소되지 않게 (넓은 표는 자기 상자 안에서 가로 스크롤)
export const viewport: Viewport = { width: "device-width", initialScale: 1, minimumScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
