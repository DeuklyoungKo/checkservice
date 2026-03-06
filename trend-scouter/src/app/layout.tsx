import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trend Scouter - AI 기반 비즈니스 기회 포착 서비스",
  description: "글로벌 비즈니스 트렌드를 실시간으로 분석하여 성공 가능한 수익화 아이디어를 제안합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="rtl">
      <body
        className={`${jetbrainsMono.variable} antialiased font-mono`}
      >
        {children}
      </body>
    </html>
  );
}
