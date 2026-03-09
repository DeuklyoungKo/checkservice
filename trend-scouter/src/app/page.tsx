import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  IconSparkles,
  IconLayoutDashboard,
  IconReportAnalytics,
  IconCrown,
  IconTrendingUp,
  IconBulb,
  IconLogout,
  IconUser,
  IconBookmarkFilled
} from "@tabler/icons-react";

import { createClient } from "@/utils/supabase/server";
import { signOut } from "./login/actions";
import { TrendList } from "@/components/TrendList";
import { NewsletterForm } from "@/components/NewsletterForm";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // trends 테이블과 연관된 analysis 데이터를 최신순으로 가져옵니다.
  const { data: rawTrends, error } = await supabase
    .from('trends')
    .select(`
      *,
      analysis (
        score_revenue,
        score_difficulty,
        score_korea_potential,
        summary
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // 현재 유저의 북마크 목록을 가져옵니다.
  const { data: userBookmarks } = user
    ? await supabase.from('bookmarks').select('trend_id').eq('user_id', user.id)
    : { data: [] };

  const bookmarkedIds = new Set(userBookmarks?.map(b => b.trend_id) || []);

  if (error) {
    console.error("Error fetching trends:", error);
  }

  // DB 데이터를 UI 형식에 맞춰 매핑합니다.
  const trends = rawTrends?.map(t => {
    const analysis = t.analysis?.[0]; // 최신 분석 결과 1개 사용

    // [TITLE_KO] 추출 로직
    let displayTitle = t.title;
    let displayDescription = analysis?.summary || t.description || "설명이 없습니다.";

    if (analysis?.summary && analysis.summary.startsWith('[TITLE_KO]')) {
      const parts = analysis.summary.split('\n\n');
      const titleMatch = parts[0].replace('[TITLE_KO] ', '').trim();
      if (titleMatch) {
        displayTitle = titleMatch;
        // 설명 부분에서 타이틀 제거
        displayDescription = parts.slice(1).join('\n\n').split('###')[0].trim();
      }
    } else if (analysis?.summary) {
      displayDescription = analysis.summary.split('###')[0].trim();
    }

    return {
      id: t.id,
      title: displayTitle,
      category: t.source === 'reddit' ? 'Community/Reddit' : t.source === 'product-hunt' ? 'SaaS/Product Hunt' : t.source === 'indie-hackers' ? 'Indie Hackers' : 'General',
      score: analysis?.score_revenue || 0,
      difficulty: analysis?.score_difficulty > 70 ? '어려움' : analysis?.score_difficulty > 40 ? '보통' : '쉬움',
      potential: analysis?.score_korea_potential > 70 ? '높음' : analysis?.score_korea_potential > 40 ? '보통' : '낮음',
      description: displayDescription,
      tags: t.raw_data?.tags || [t.source],
      isBookmarked: bookmarkedIds.has(t.id),
    };
  }) || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 transition-all duration-500">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <IconBulb className="text-primary-foreground w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-primary">Trend Scouter</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <Button variant="ghost" size="sm" className="gap-2">
                <IconLayoutDashboard size={18} />
                대시보드
              </Button>
              {user && (
                <Link href="/workspace">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <IconBookmarkFilled size={18} className="text-primary" />
                    워크스페이스
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="sm" className="gap-2 cursor-not-allowed opacity-50">
                <IconReportAnalytics size={18} />
                리포트
              </Button>

              <Separator orientation="vertical" className="h-6 mx-2" />

              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                    <IconUser size={16} className="text-primary" />
                    <span className="text-xs font-bold truncate max-w-[120px]">{user.email?.split('@')[0]}</span>
                  </div>
                  <form action={signOut}>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-destructive transition-colors">
                      <IconLogout size={18} />
                      로그아웃
                    </Button>
                  </form>
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <IconUser size={18} />
                    로그인
                  </Button>
                </Link>
              )}

                <Link href="/premium">
                  <Button size="sm" className="gap-2 rounded-full font-bold shadow-md shadow-primary/10">
                    <IconCrown size={18} />
                    Premium 가입
                  </Button>
                </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden pt-20 pb-16 sm:pt-32 sm:pb-24 border-b bg-muted/30">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl">
            <Badge variant="outline" className="mb-6 px-4 py-1 text-primary border-primary/30 bg-primary/5 gap-2 uppercase tracking-widest font-bold">
              <IconSparkles size={14} />
              Next Big Opportunity
            </Badge>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              AI가 발견한<br />
              유망한 <span className="text-primary italic underline decoration-primary/30">비즈니스</span> 기회
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl">
              실시간 데이터 분석을 통해 1인 개발로 시작 가능한 고수익 아이디어를 매일 아침 선별해 드립니다.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-2xl shadow-xl shadow-primary/20">
                지금 시작하기
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-2xl">
                분석 샘플 보기
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Trends Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <IconTrendingUp className="text-primary w-8 h-8" />
            <h2 className="text-3xl font-bold">오늘의 HOT 트렌드</h2>
          </div>
        </div>

        <TrendList initialTrends={trends} />
      </main>

      {/* Newsletter Section */}
      <section className="border-y bg-muted/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[size:24px_24px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
              <IconSparkles size={14} className="text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Stay Ahead of Trends</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter leading-tight text-balance">
              새로운 비즈니스 기회를<br />
              <span className="text-primary">가장 먼저</span> 받아보세요
            </h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-xl mx-auto">
              매주 엄선된 글로벌 트렌드 데이터와 한국형 수익화 전략 리포트를 메일함으로 바로 보내드립니다.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-16 bg-muted/50 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 opacity-50">
              <IconBulb size={24} />
              <span className="text-lg font-bold">Trend Scouter</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2026 Trend Scouter. Built with Precision & AI.
            </p>
            <div className="flex gap-6 mt-4">
              <Button variant="link" className="text-muted-foreground hover:text-primary p-0">Terms</Button>
              <Button variant="link" className="text-muted-foreground hover:text-primary p-0">Privacy</Button>
              <Button variant="link" className="text-muted-foreground hover:text-primary p-0">Twitter</Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
