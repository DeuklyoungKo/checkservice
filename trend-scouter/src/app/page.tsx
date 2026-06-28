import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  IconSparkles,
  IconReportAnalytics,
  IconCrown,
  IconTrendingUp,
  IconBulb,
  IconLogout,
  IconUser,
  IconBookmarkFilled,
  IconMail,
  IconArrowRight,
  IconClock,
  IconChartBar,
  IconRocket,
} from "@tabler/icons-react";
import { BookmarkButton } from "@/components/BookmarkButton";
import { BetaEmailSignup } from "@/components/BetaEmailSignup";

import { createClient } from "@/utils/supabase/server";
import { getUnlockedTrendIds, isTrendUnlocked } from "@/lib/unlock";
import { signOut } from "./login/actions";

const getDifficultyBadge = (score: number) => {
  switch (score) {
    case 1: return { text: "1단계 (하루)", class: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20" };
    case 2: return { text: "2단계 (2-3일)", class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
    case 3: return { text: "3단계 (1주)", class: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
    case 4: return { text: "4단계 (2주)", class: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" };
    case 5: return { text: "5단계 (한 달+)", class: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" };
    default: return { text: "2단계 (2-3일)", class: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
  }
};

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // [분석 우선 전략] analysis가 있는 최신 트렌드만 노출합니다.
  // 1. 최신 분석 데이터 6개를 먼저 조회합니다.
  const { data: latestAnalyses } = await supabase
    .from('analysis')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(6);

  // 2. 분석에 연결된 trend_id로 트렌드 정보를 조회합니다.
  const analysisIds = latestAnalyses?.map(a => a.trend_id) || [];
  const { data: rawTrends, error } = analysisIds.length > 0
    ? await supabase.from('trends').select('*').in('id', analysisIds)
    : { data: [], error: null };

  if (error) {
    console.error("Error fetching trends:", error);
  }

  // 3. 프리미엄 정보 및 북마크 조회
  const [{ data: userProfile }, { data: userBookmarks }] = await Promise.all([
    user
      ? supabase.from('user_profiles').select('is_premium').eq('id', user.id).single()
      : Promise.resolve({ data: null, error: null }),
    user
      ? supabase.from('bookmarks').select('trend_id').eq('user_id', user.id)
      : Promise.resolve({ data: [] })
  ]);

  const userIsPremium = userProfile?.is_premium || false;
  const bookmarkedIds = new Set(userBookmarks?.map(b => b.trend_id) || []);
  // 사용자별 단건 잠금 해제 집합 (베타·비로그인 시 빈 집합)
  const unlockedIds = await getUnlockedTrendIds(supabase, user?.id);

  // 4. 매핑합니다.
  type TrendItem = {
    id: string; title: string; category: string; score: number;
    difficulty: string; aiBuildabilityScore: number; potential: string; description: string;
    tags: string[]; isBookmarked: boolean; isUnlocked: boolean;
    koreaDemand: { group: string; ratio: number } | null;
  };
  const trends: TrendItem[] = (latestAnalyses || []).reduce<TrendItem[]>((acc, analysis) => {
    const trend = rawTrends?.find(t => t.id === analysis.trend_id);
    if (!trend) return acc;
    const fallbackScore = analysis.pufe_u > 18 ? 4 : analysis.pufe_u > 10 ? 3 : 2;
    acc.push({
      id: trend.id,
      title: analysis.headline || "분석 중인 트렌드",
      category: analysis.pain_category || 'General',
      score: analysis.pufe_total || 0,
      difficulty: analysis.pufe_u > 18 ? '어려움' : analysis.pufe_u > 10 ? '보통' : '쉬움',
      aiBuildabilityScore: analysis.ai_buildability_score || fallbackScore,
      potential: analysis.pufe_p > 18 ? '매우 높음' : analysis.pufe_p > 12 ? '높음' : '보통',
      description: analysis.summary || "현재 비즈니스 분석이 진행 중입니다.",
      tags: [trend.source, analysis.pain_category || 'General'].filter(Boolean),
      isBookmarked: bookmarkedIds.has(trend.id),
      isUnlocked: isTrendUnlocked(trend.id, { isPremium: userIsPremium, unlockedIds }),
      // 네이버 DataLab 한국 검색 관심도 (상대 지수 0~100 + 카테고리). 절대 검색량 아님.
      koreaDemand: trend.stats_data?.korea_demand
        ? { group: trend.stats_data.korea_demand.group, ratio: trend.stats_data.korea_demand.ratio }
        : null,
    });
    return acc;
  }, []);

  // JSON-LD: WebSite + FAQPage 스키마 (SEO·AEO)
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Trend Scouter",
      "url": "https://trend.gonsuit.com",
      "description": "Hacker News·GitHub·Dev.to에서 실제 페인포인트를 PUFE로 분석하고, 네이버 DataLab으로 한국 수요를 교차 검증해 AI 개발 브리프를 제공하는 서비스",
      "inLanguage": "ko-KR",
      "potentialAction": {
        "@type": "SearchAction",
        "target": { "@type": "EntryPoint", "urlTemplate": "https://trend.gonsuit.com/trends?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "PUFE 스코어란 무엇인가요?",
          "acceptedAnswer": { "@type": "Answer", "text": "PUFE는 Pain(고통), Urgency(긴급), Frequency(빈도), Existing Solution(기존 대안)의 4가지 지표로 아이디어의 수익 가능성을 0~100점으로 평가하는 프레임워크입니다." },
        },
        {
          "@type": "Question",
          "name": "AI 개발 브리프를 어떤 도구에 사용할 수 있나요?",
          "acceptedAnswer": { "@type": "Answer", "text": "Claude Code, ChatGPT, Gemini, Cursor 등 어떤 AI 코딩 도구에도 바로 붙여넣기 가능한 마크다운 형식으로 제공됩니다." },
        },
        {
          "@type": "Question",
          "name": "AI Buildability Score는 무엇인가요?",
          "acceptedAnswer": { "@type": "Answer", "text": "AI 코딩 도구로 해당 아이디어를 구현하는 데 걸리는 예상 시간입니다. 1단계(하루)부터 5단계(한 달 이상)까지 평가합니다." },
        },
        {
          "@type": "Question",
          "name": "Trend Scouter는 어떤 데이터 소스를 사용하나요?",
          "acceptedAnswer": { "@type": "Answer", "text": "Hacker News, GitHub, Dev.to 등의 공개 데이터와 공식 API를 2시간마다 수집하고, 네이버 DataLab 공식 API로 한국 검색 수요를 교차 검증합니다." },
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 transition-all duration-500">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero Section */}
      <header className="relative overflow-hidden pt-20 pb-16 sm:pt-32 sm:pb-24 border-b bg-muted/30">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-4xl">
            <Badge variant="outline" className="mb-6 px-4 py-1 text-primary border-primary/30 bg-primary/5 gap-2 uppercase tracking-widest font-bold">
              <IconSparkles size={14} />
              Vibe Coding × Side Project
            </Badge>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              주말에 만들 수 있는<br />
              <span className="text-primary italic underline decoration-primary/30">수익형 아이디어</span>를<br />
              AI가 매일 발굴합니다
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-6 max-w-2xl">
              사람들이 <strong className="text-foreground">실제로 돈을 내는 문제</strong>만 골라<br className="hidden sm:block" />
              Claude Code, ChatGPT 등 AI 코딩 도구에 바로 붙여넣을 수 있는<br />개발 브리프로 제공합니다.
            </p>
            {/* 차별점: 글로벌 + 한국 수요 동시 검증 */}
            <p className="text-base sm:text-lg font-bold text-foreground mb-10 max-w-2xl flex items-start gap-2">
              <span aria-hidden className="text-xl leading-none">🇰🇷</span>
              <span>글로벌에서 뜨는 아이디어가 <span className="text-primary underline decoration-primary/30">한국에서도 팔리는지</span>, 네이버 DataLab으로 동시에 검증합니다.</span>
            </p>
            {/* 신뢰 지표 */}
            <div className="flex flex-wrap gap-3 mb-10 text-xs font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5 bg-background border border-muted px-3 py-1.5 rounded-full">
                <IconChartBar size={13} className="text-primary" /> PUFE 프레임워크 분석
              </span>
              <span className="flex items-center gap-1.5 bg-background border border-muted px-3 py-1.5 rounded-full">
                <IconTrendingUp size={13} className="text-primary" /> 네이버 DataLab 한국 수요 검증
              </span>
              <span className="flex items-center gap-1.5 bg-background border border-muted px-3 py-1.5 rounded-full">
                <IconRocket size={13} className="text-primary" /> AI 개발 브리프 즉시 복사
              </span>
              <span className="flex items-center gap-1.5 bg-background border border-muted px-3 py-1.5 rounded-full">
                <IconClock size={13} className="text-primary" /> 2시간마다 자동 업데이트
              </span>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="/trends">
                <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20 gap-2">
                  <IconSparkles size={20} />
                  아이디어 탐색하기
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-2xl gap-2 border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30">
                  <IconMail size={20} />
                  베타 피드백 남기기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* HOT 트렌드 6개 미리보기 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <IconTrendingUp className="text-primary w-8 h-8" />
            <h2 className="text-3xl font-bold">오늘의 HOT 트렌드</h2>
          </div>
          <Link href="/trends">
            <Button variant="outline" className="gap-2 rounded-full font-bold hidden md:flex">
              전체 트렌드 보기
              <IconArrowRight size={16} />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trends.map((trend) => (
            <Card key={trend.id} className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden rounded-3xl bg-card flex flex-col h-full relative">
              {/* Premium Badge */}
              {!trend.isUnlocked && (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg shadow-amber-500/20 uppercase tracking-widest border border-white/20">
                  <IconRocket size={12} className="text-white animate-pulse" />
                  Premium
                </div>
              )}

              <CardHeader className="pb-4 pt-8">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    {trend.category}
                  </Badge>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-black text-primary leading-none">{trend.score}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">Score</span>
                    <div className="mt-2">
                      <BookmarkButton trendId={trend.id} initialIsBookmarked={trend.isBookmarked} />
                    </div>
                  </div>
                </div>
                <CardTitle className="group-hover:text-primary transition-colors mb-2 min-h-[7rem] flex items-start gap-2">
                  {!trend.isUnlocked && (
                    <div className="flex-shrink-0 mt-2">
                      <IconBulb size={24} className="text-amber-500" />
                    </div>
                  )}
                  <div className="text-2xl line-clamp-3 leading-normal py-1">
                    {trend.title}
                  </div>
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed line-clamp-3 h-[4.5rem]">
                  {trend.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-6 flex-grow">
                <div className="flex flex-wrap gap-2 mb-6">
                  {trend.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="rounded-md border-muted text-muted-foreground text-[10px]">#{tag}</Badge>
                  ))}
                </div>
                <Separator className="mb-6 opacity-30" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1"><IconClock size={12} /> AI 난이도</p>
                    <Badge variant="outline" className={`rounded-lg px-2 py-0.5 border text-xs font-bold leading-none ${getDifficultyBadge(trend.aiBuildabilityScore).class}`}>
                      {getDifficultyBadge(trend.aiBuildabilityScore).text}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1"><IconChartBar size={12} /> 잠재력</p>
                    <p className={`text-sm font-bold ${trend.potential === '매우 높음' ? 'text-rose-600 dark:text-rose-500' : trend.potential === '높음' ? 'text-orange-500' : 'text-foreground'}`}>{trend.potential}</p>
                  </div>
                </div>
                {trend.koreaDemand && (
                  <div className="mt-4 pt-4 border-t border-dashed border-muted">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1 mb-1.5">
                      <IconTrendingUp size={12} /> 한국 검색 관심도
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {trend.koreaDemand.ratio}<span className="text-muted-foreground font-normal text-xs">/100</span>
                      </span>
                      <Badge variant="outline" className="rounded-md border-muted text-muted-foreground text-[10px]">
                        {trend.koreaDemand.group}
                      </Badge>
                    </div>
                    <p className="text-[9px] text-muted-foreground/50 mt-1">네이버 DataLab 상대 지수</p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/30 p-4 mt-auto">
                <Link href={`/trend/${trend.id}`} className="w-full">
                  {trend.isUnlocked ? (
                    <Button className="w-full rounded-xl font-bold bg-muted hover:bg-primary hover:text-primary-foreground text-foreground transition-all duration-300" variant="ghost">
                      심층 분석 데이터 보기
                      <IconArrowRight size={16} className="ml-2" />
                    </Button>
                  ) : (
                    <Button className="w-full rounded-xl font-black bg-primary/10 text-primary hover:bg-primary transition-all duration-300 border border-primary/20" variant="ghost">
                      분석 데이터 잠금 해제
                      <IconRocket size={16} className="ml-2 scale-110" />
                    </Button>
                  )}
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* 전체 트렌드 보기 CTA */}
        <div className="mt-14 flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-sm font-medium">더 많은 트렌드를 탐색해 보시겠어요?</p>
          <Link href="/trends">
            <Button size="lg" className="gap-3 h-14 px-10 rounded-2xl font-bold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
              전체 트렌드 탐색하기
              <IconArrowRight size={20} />
            </Button>
          </Link>
        </div>
      </main>

      {/* Bottom CTA Section — 베타 이메일 등록 */}
      <section className="py-24 max-w-7xl mx-auto px-6 mb-20">
        <div className="bg-amber-500/5 rounded-[40px] px-6 py-16 md:py-24 border border-amber-400/30 text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-primary/5 opacity-50 transition-transform duration-700 group-hover:scale-105" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-4 py-1.5 text-xs font-black tracking-[0.2em] uppercase rounded-full mb-8 inline-flex gap-2">
              <IconRocket size={14} />
              베타 서비스 무료 이용 중 · ~ 2026. 8. 31
            </Badge>
            <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-foreground">
              베타 기간,<br />
              <span className="text-amber-500">모든 분석 데이터</span>를<br />
              무료로 이용하세요
            </h2>
            <p className="text-muted-foreground text-lg mb-4 leading-relaxed font-medium">
              이메일을 등록하시면 베타 종료 전 미리 알려드립니다.<br className="hidden md:block" />
              서비스 개선을 위한 피드백도 언제든 환영합니다.
            </p>
            <p className="text-xs text-muted-foreground/60 mb-10 font-medium">
              베타 종료일: 2026년 8월 31일 예정 (상황에 따라 변경될 수 있습니다)
            </p>
            <BetaEmailSignup />
            <div className="mt-6">
              <Link href="/trends">
                <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground font-bold">
                  <IconSparkles size={16} />
                  이메일 없이 바로 탐색하기
                  <IconArrowRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16 bg-muted/50 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 opacity-50">
              <img src="/logo.png" alt="Trend Scouter" width={24} height={24} className="w-6 h-6 rounded-md" />
              <span className="text-lg font-bold">Trend Scouter</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2026 Trend Scouter. Built with Precision & AI.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mt-4">
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">이용약관 / Terms</Link>
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">개인정보처리방침 / Privacy</Link>
              <Link href="/refund" className="text-sm text-muted-foreground hover:text-primary transition-colors">환불정책 / Refund</Link>
            </div>
            {/* 데이터 출처·면책 고지 (Phase E) */}
            <p className="text-[11px] text-muted-foreground/50 mt-6 max-w-2xl mx-auto leading-relaxed">
              본 서비스는 Hacker News·GitHub·Dev.to 등의 공개 데이터와 네이버 DataLab 등 공식 API의 통계를 가공·분석해 제공합니다.
              원문 저작권은 각 출처에 있으며, 본문은 저장하지 않고 원문 링크를 통해 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
