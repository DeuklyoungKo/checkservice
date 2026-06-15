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

const BASE_URL = "https://trend.gonsuit.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Trend Scouter — 주말에 만들 수 있는 수익형 AI 사이드 프로젝트 아이디어",
    template: "%s — Trend Scouter",
  },
  description:
    "Reddit·Product Hunt·GeekNews에서 실제로 돈을 내는 문제만 골라 PUFE 프레임워크로 분석합니다. Claude Code·ChatGPT·Gemini에 바로 붙여넣을 수 있는 AI 개발 브리프를 무료로 제공합니다.",
  keywords: [
    "수익형 사이드 프로젝트", "AI 코딩", "바이브 코딩", "vibe coding",
    "Claude Code", "ChatGPT", "Gemini", "사이드 프로젝트 아이디어",
    "PUFE 분석", "1인 창업", "SaaS 아이디어", "AI 개발 브리프",
  ],
  authors: [{ name: "Trend Scouter", url: BASE_URL }],
  creator: "Trend Scouter",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: BASE_URL,
    siteName: "Trend Scouter",
    title: "Trend Scouter — 주말에 만들 수 있는 수익형 AI 사이드 프로젝트 아이디어",
    description:
      "Reddit·Product Hunt·GeekNews 페인포인트를 PUFE 프레임워크로 분석. AI 개발 브리프 즉시 복사 가능.",
    // og:image는 app/opengraph-image.tsx가 동적 생성하여 자동 주입 (하위 라우트에 상속).
  },
  twitter: {
    card: "summary_large_image",
    title: "Trend Scouter — 주말에 만들 수 있는 수익형 AI 사이드 프로젝트 아이디어",
    description:
      "Reddit·Product Hunt·GeekNews 페인포인트를 PUFE 프레임워크로 분석. AI 개발 브리프 즉시 복사 가능.",
    // twitter:image도 opengraph-image.tsx 결과를 자동 사용.
  },
  alternates: { canonical: BASE_URL },
  robots: { index: true, follow: true },
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
