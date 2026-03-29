import { createClient } from "@/utils/supabase/server";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookmarkButton } from "@/components/BookmarkButton";
import Link from "next/link";
import {
    IconBulb,
    IconTrendingUp,
    IconClock,
    IconChartBar,
    IconBookmarkFilled,
    IconArrowLeft,
    IconSparkles,
    IconRocket
} from "@tabler/icons-react";
import { redirect } from "next/navigation";

export default async function WorkspacePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 1. 사용자의 북마크된 트렌드를 가져옵니다.
    const { data: savedItems } = await supabase
        .from('bookmarks')
        .select(`
          *,
          trends (
            *,
            analysis (
                headline,
                summary,
                pufe_total,
                pain_category
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    // 2. 사용자가 직접 입력한 아이디어 분석 리스트를 가져옵니다.
    const { data: userAnalyses } = await supabase
        .from('analysis')
        .select('*')
        .eq('user_id', user.id)
        .is('trend_id', null)
        .order('created_at', { ascending: false });

    const trends = savedItems?.map(item => {
        const t = item.trends as any;
        const analysis = t.analysis?.[0];

        return {
            id: t.id,
            title: analysis?.headline || "분석 중인 트렌드",
            category: analysis?.pain_category || 'General',
            score: analysis?.pufe_total || 0,
            difficulty: analysis?.pufe_u > 18 ? '어려움' : '보통',
            potential: analysis?.pufe_p > 18 ? '높음' : '보통',
            description: analysis?.summary || "비즈니스 기회를 분석 중입니다...",
            tags: [t.source],
            isBookmarked: true,
            isUserIdea: false
        };
    }) || [];

    const myIdeas = userAnalyses?.map(a => {
        return {
            id: a.id,
            title: a.headline || "나의 아이디어 분석",
            category: `${a.pain_category} Pain`,
            score: a.pufe_total || 0,
            description: a.summary || "분석 내용이 없습니다.",
            isUnlocked: a.is_unlocked,
            isUserIdea: true,
            createdAt: a.created_at
        };
    }) || [];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 transition-all duration-500">
            {/* Navigation (Same as Home) */}
            <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                            <IconBulb className="text-primary-foreground w-5 h-5" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-primary">Trend Intelligence</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/wizard">
                            <Button size="sm" className="gap-2 rounded-full font-bold bg-primary/10 text-primary hover:bg-primary/20 border-none">
                                <IconSparkles size={16} />
                                아이디어 분석하기
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2 rounded-full font-bold">
                                <IconArrowLeft size={18} />
                                대시보드로
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                {/* Unified Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="space-y-4">
                        <Badge variant="outline" className="px-4 py-1 text-primary border-primary/30 bg-primary/5 gap-2 uppercase tracking-widest font-black text-[10px]">
                            <IconSparkles size={12} /> My Business Assets
                        </Badge>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">내 워크스페이스</h1>
                    </div>
                    <div className="flex items-center gap-1.5 p-1.5 bg-muted/50 rounded-2xl border border-muted w-fit">
                        <div className="px-5 py-2.5 bg-background rounded-xl shadow-sm border border-muted-foreground/10 text-center">
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">저장됨</p>
                            <p className="text-xl font-black">{trends.length + myIdeas.length}</p>
                        </div>
                    </div>
                </div>

                {/* Tab UI (Simplified CSS Tabs) */}
                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {/* Section 1: My Idea Analysis (High Priority) */}
                        <div className="lg:col-span-3">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                                    <IconRocket size={20} />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight">내 아이디어 분석 리포트</h2>
                            </div>
                            
                            {myIdeas.length === 0 ? (
                                <div className="bg-muted/10 rounded-[48px] border-4 border-dashed border-muted/50 py-16 text-center">
                                    <p className="text-muted-foreground font-bold mb-6">아직 직접 분석한 아이디어가 없습니다.</p>
                                    <Link href="/wizard">
                                        <Button className="rounded-2xl font-black">첫 아이디어 분석하기</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {myIdeas.map((idea) => (
                                        <Card key={idea.id} className="rounded-[40px] border-2 border-muted hover:border-primary shadow-sm flex flex-col h-full bg-card overflow-hidden transition-all group">
                                            <CardHeader className="pb-4">
                                                <div className="flex justify-between items-start mb-4">
                                                    <Badge className="bg-primary/10 text-primary border-none font-bold">
                                                        {idea.category}
                                                    </Badge>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-black text-primary leading-none">{idea.score}</span>
                                                        <p className="text-[10px] text-muted-foreground font-black">PUFE</p>
                                                    </div>
                                                </div>
                                                <CardTitle className="text-xl font-black tracking-tight mb-2 group-hover:text-primary transition-colors">
                                                    {idea.title}
                                                </CardTitle>
                                                <CardDescription className="text-xs line-clamp-3">
                                                    {idea.description}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardFooter className="mt-auto p-4 bg-muted/30">
                                                <Link href={`/wizard?id=${idea.id}`} className="w-full">
                                                    <Button variant="ghost" className="w-full rounded-2xl font-black bg-white border-2 border-muted shadow-sm hover:bg-primary hover:text-white transition-all">
                                                        {idea.isUnlocked ? '전체 리포트 열람' : '분석 결과 확인'}
                                                    </Button>
                                                </Link>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Section 2: Saved Trends (Original Bookmarks) */}
                        <div className="lg:col-span-3 pt-10 border-t border-muted">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-primary">
                                    <IconBookmarkFilled size={20} />
                                </div>
                                <h2 className="text-2xl font-black tracking-tight">저장된 트렌드 북마크</h2>
                            </div>
                            
                            {trends.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground font-bold">저장된 트렌드가 없습니다.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {trends.map((trend) => (
                                        <Card key={trend.id} className="rounded-[40px] border border-muted hover:border-primary/30 transition-all flex flex-col h-full overflow-hidden">
                                            <CardHeader className="pb-4">
                                                <div className="flex justify-between items-start mb-4">
                                                    <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-muted/50 border-none">
                                                        {trend.category}
                                                    </Badge>
                                                    <BookmarkButton trendId={trend.id} initialIsBookmarked={true} />
                                                </div>
                                                <CardTitle className="text-lg font-black tracking-tight mb-2">{trend.title}</CardTitle>
                                            </CardHeader>
                                            <CardFooter className="mt-auto p-4">
                                                <Link href={`/trend/${trend.id}`} className="w-full">
                                                    <Button variant="outline" className="w-full rounded-2xl font-black h-10 text-xs">상세 데이터</Button>
                                                </Link>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t py-12 bg-muted/20 mt-32">
                <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-4">
                    <p className="text-muted-foreground text-xs font-medium">
                        © 2026 Trend Intelligence. Your Personalized Opportunity Map.
                    </p>
                </div>
            </footer>
        </div>
    );
}
