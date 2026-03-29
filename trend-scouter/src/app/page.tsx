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

import { createClient } from "@/utils/supabase/server";
import { signOut } from "./login/actions";


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

  // 3. 북마크 조회
  const { data: userBookmarks } = user
    ? await supabase.from('bookmarks').select('trend_id').eq('user_id', user.id)
    : { data: [] };

  const bookmarkedIds = new Set(userBookmarks?.map(b => b.trend_id) || []);

  // 4. 매핑합니다.
  type TrendItem = {
    id: string; title: string; category: string; score: number;
    difficulty: string; potential: string; description: string;
    tags: string[]; isBookmarked: boolean; isUnlocked: boolean;
  };
  const trends: TrendItem[] = (latestAnalyses || []).reduce<TrendItem[]>((acc, analysis) => {
    const trend = rawTrends?.find(t => t.id === analysis.trend_id);
    if (!trend) return acc;
    acc.push({
      id: trend.id,
      title: analysis.headline || "분석 중인 트렌드",
      category: analysis.pain_category || 'General',
      score: analysis.pufe_total || 0,
      difficulty: analysis.pufe_u > 18 ? '어려움' : analysis.pufe_u > 10 ? '보통' : '쉬움',
      potential: analysis.pufe_p > 18 ? '높음' : analysis.pufe_p > 10 ? '보통' : '낮음',
      description: analysis.summary || "비즈니스 기회를 분석하고 있습니다...",
      tags: [trend.source],
      isBookmarked: bookmarkedIds.has(trend.id),
      isUnlocked: analysis.is_unlocked ?? false,
    });
    return acc;
  }, []);

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
              <span className="text-xl font-bold tracking-tight text-primary">Trend Intelligence</span>
            </div>

            <div className="hidden md:flex items-center gap-6">
              {user && (
                <Link href="/workspace">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <IconBookmarkFilled size={18} className="text-primary" />
                    워크스페이스
                  </Button>
                </Link>
              )}
              <Link href="/trends">
                <Button variant="ghost" size="sm" className="gap-2">
                  <IconReportAnalytics size={18} />
                  전체 트렌드
                </Button>
              </Link>

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
                <CardTitle className="text-2xl group-hover:text-primary transition-colors mb-2 line-clamp-2 h-[4rem] flex items-center gap-2">
                  {!trend.isUnlocked && <IconBulb size={24} className="text-amber-500 flex-shrink-0" />}
                  {trend.title}
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
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1"><IconClock size={12} /> 난이도</p>
                    <p className="text-sm font-bold">{trend.difficulty}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1"><IconChartBar size={12} /> 잠재력</p>
                    <p className={`text-sm font-bold ${trend.potential === '높음' ? 'text-orange-500' : 'text-foreground'}`}>{trend.potential}</p>
                  </div>
                </div>
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

      {/* Newsletter Section Replaced by Contact Inquiry Section */}
        <section className="py-24 max-w-7xl mx-auto px-6 mb-20">
          <div className="bg-primary/5 rounded-[40px] px-6 py-16 md:py-24 border border-primary/20 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 opacity-50 transition-transform duration-700 group-hover:scale-105" />
            
            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary mb-8 animate-pulse shadow-glow">
                <IconMail className="w-6 h-6" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight text-foreground">
                맞춤형 <span className="text-primary">트렌드 리포트</span>가 필요하신가요?
              </h2>
              <p className="text-muted-foreground text-lg mb-10 leading-relaxed font-medium">
                SaaS/AI 시장 진입 전략, 특정 산업별 심층 데이터가 필요하시다면<br className="hidden md:block"/>
                언제든 비즈니스 문의를 남겨주세요.
              </p>
              
              <Link href="/contact">
                <Button className="h-14 px-10 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-[1.03] transition-transform">
                  비즈니스 / 맞춤 리포트 문의하기
                </Button>
              </Link>
            </div>
          </div>
        </section>

      {/* Footer */}
      <footer className="border-t py-16 bg-muted/50 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 opacity-50">
              <IconBulb size={24} />
              <span className="text-lg font-bold">Trend Intelligence</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2026 Trend Intelligence. Built with Precision & AI.
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
