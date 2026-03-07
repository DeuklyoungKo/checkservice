import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import {
  IconSparkles,
  IconLayoutDashboard,
  IconReportAnalytics,
  IconSettings,
  IconCrown,
  IconTrendingUp,
  IconClock,
  IconChartBar,
  IconSearch,
  IconBulb,
  IconLogout,
  IconUser,
  IconBookmarkFilled
} from "@tabler/icons-react";

import { createClient } from "@/utils/supabase/server";
import { signOut } from "./login/actions";
import { BookmarkButton } from "@/components/BookmarkButton";

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
    .limit(10);

  // 현재 유저의 북마크 목록을 가져옵니다.
  const { data: userBookmarks } = user
    ? await supabase.from('bookmarks').select('trend_id').eq('user_id', user.id)
    : { data: [] };

  const bookmarkedIds = new Set(userBookmarks?.map(b => b.trend_id) || []);

  if (error) {
    console.error("Error fetching trends:", error);
  } else {
    console.log(`📡 [Server] Fetched ${rawTrends?.length || 0} trends from DB.`);
  }

  // DB 데이터를 UI 형식에 맞춰 매핑합니다.
  const trends = rawTrends?.map(t => {
    const analysis = t.analysis?.[0]; // 최신 분석 결과 1개 사용
    return {
      id: t.id,
      title: t.title,
      category: t.source === 'reddit' ? 'Community/Reddit' : t.source === 'product-hunt' ? 'SaaS/Product Hunt' : 'General',
      score: analysis?.score_revenue || 0,
      difficulty: analysis?.score_difficulty > 70 ? '어려움' : analysis?.score_difficulty > 40 ? '보통' : '쉬움',
      potential: analysis?.score_korea_potential > 70 ? '높음' : analysis?.score_korea_potential > 40 ? '보통' : '낮음',
      description: analysis?.summary || t.description || "설명이 없습니다.",
      tags: t.raw_data?.tags || [t.source],
      isBookmarked: bookmarkedIds.has(t.id),
    };
  }) || [];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
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
              <Button variant="ghost" size="sm" className="gap-2">
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

              <Button size="sm" className="gap-2 rounded-full font-bold">
                <IconCrown size={18} />
                Premium 가입
              </Button>
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
          <div className="relative w-72">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              placeholder="카테고리 검색..."
              className="w-full bg-muted border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trends.map((trend) => (
            <Card key={trend.id} className="group border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 overflow-hidden rounded-3xl bg-card">
              <CardHeader className="pb-4">
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
                <CardTitle className="text-2xl group-hover:text-primary transition-colors mb-2">
                  {trend.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed min-h-[60px]">
                  {trend.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pb-6">
                <div className="flex flex-wrap gap-2 mb-6">
                  {trend.tags.map((tag: string) => (
                    <Badge key={tag} variant="outline" className="rounded-md border-muted text-muted-foreground text-[10px]">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <Separator className="mb-6 opacity-30" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                      <IconClock size={12} /> 난이도
                    </p>
                    <p className="text-sm font-bold">{trend.difficulty}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1">
                      <IconChartBar size={12} /> 잠재력
                    </p>
                    <p className="text-sm font-bold text-orange-500">{trend.potential}</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/30 p-4">
                <Link href={`/trend/${trend.id}`} className="w-full">
                  <Button className="w-full rounded-xl font-bold bg-muted hover:bg-primary hover:text-primary-foreground text-foreground transition-all duration-300" variant="ghost">
                    심층 분석 데이터 보기
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>

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
