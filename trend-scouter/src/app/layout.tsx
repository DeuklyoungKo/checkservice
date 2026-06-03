import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import GlobalNav from "@/components/GlobalNav";
import { BetaBanner } from "@/components/BetaBanner";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";

const GA_ID = "G-8D2C55XEB7";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansKR = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
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
    <html lang="ko" dir="ltr" suppressHydrationWarning>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body
        className={`${inter.variable} ${notoSansKR.variable} antialiased font-sans`}
        suppressHydrationWarning
      >
        <BetaBanner />
        <GlobalNav />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
