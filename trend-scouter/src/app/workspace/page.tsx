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
    IconSparkles
} from "@tabler/icons-react";
import { redirect } from "next/navigation";

export default async function WorkspacePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 사용자의 북마크된 트렌드를 가져옵니다.
    const { data: savedItems, error } = await supabase
        .from('bookmarks')
        .select(`
      *,
      trends (
        *,
        analysis (*)
      )
    `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching bookmarks:", error);
    }

    const trends = savedItems?.map(item => {
        const t = item.trends as any;
        const analysis = t.analysis?.[0];

        let displayTitle = t.title;
        let displayDescription = analysis?.summary || t.description || "설명이 없습니다.";

        if (analysis?.summary && analysis.summary.startsWith('[TITLE_KO]')) {
            const parts = analysis.summary.split('\n\n');
            const titleMatch = parts[0].replace('[TITLE_KO] ', '').trim();
            if (titleMatch) {
                displayTitle = titleMatch;
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
            isBookmarked: true,
        };
    }) || [];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 transition-all duration-500">
            {/* Navigation */}
            <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <IconBulb className="text-primary-foreground w-5 h-5" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-primary">Trend Intelligence</span>
                    </Link>
                    <div className="flex items-center gap-4">
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
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div className="space-y-4">
                        <Badge variant="outline" className="px-4 py-1 text-primary border-primary/30 bg-primary/5 gap-2 uppercase tracking-widest font-black text-[10px]">
                            <IconSparkles size={12} /> My Workspace
                        </Badge>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">내 워크스페이스</h1>
                        <p className="text-lg text-muted-foreground max-w-2xl">
                            관심 있는 비즈니스 기회들을 한곳에서 관리하세요. <br className="hidden sm:block" />
                            실행 준비가 된 아이디어들을 북마크했습니다.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/30 px-6 py-4 rounded-[32px] border border-muted-foreground/10 shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                            <IconBookmarkFilled className="text-primary w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">저장된 기회</p>
                            <p className="text-2xl font-black tabular-nums">{trends.length}개</p>
                        </div>
                    </div>
                </div>

                {trends.length === 0 ? (
                    <div className="text-center py-32 bg-muted/10 rounded-[48px] border-4 border-dashed border-muted/50 transition-all hover:bg-muted/20">
                        <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <IconTrendingUp className="w-10 h-10 text-muted-foreground opacity-30" />
                        </div>
                        <h3 className="text-2xl font-black mb-3 text-balance">아직 저장된 트렌드가 없습니다</h3>
                        <p className="text-muted-foreground mb-10 text-lg max-w-sm mx-auto leading-relaxed">
                            매일 아침 배달되는 새로운 기회를 확인하고 <br />
                            나만의 리스트를 완성해 보세요.
                        </p>
                        <Link href="/">
                            <Button className="rounded-2xl font-black h-14 px-10 text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                                트렌드 탐색하러 가기
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {trends.map((trend) => (
                            <Card key={trend.id} className="group border-2 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(var(--primary-rgb),0.1)] overflow-hidden rounded-[40px] bg-card flex flex-col h-full border-muted-foreground/10 shadow-sm">
                                <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start mb-6">
                                        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-bold px-3 py-1">
                                            {trend.category}
                                        </Badge>
                                        <div className="flex flex-col items-end">
                                            <span className="text-2xl font-black text-primary leading-none tabular-nums">{trend.score}</span>
                                            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">Score</span>
                                            <div className="mt-3">
                                                <BookmarkButton trendId={trend.id} initialIsBookmarked={trend.isBookmarked} />
                                            </div>
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl group-hover:text-primary transition-colors mb-3 font-black tracking-tight line-clamp-2">
                                        {trend.title}
                                    </CardTitle>
                                    <CardDescription className="text-sm leading-relaxed line-clamp-3 h-[4.5rem]">
                                        {trend.description}
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="pb-6 flex-grow">
                                    <div className="flex flex-wrap gap-2 mb-8">
                                        {trend.tags.slice(0, 3).map((tag: string) => (
                                            <Badge key={tag} variant="outline" className="rounded-lg border-muted text-muted-foreground text-[10px] px-2 py-0.5 font-medium">
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <Separator className="mb-8 opacity-20" />
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1">
                                                <IconClock size={12} className="text-blue-500" /> 난이도
                                            </p>
                                            <p className="text-sm font-black">{trend.difficulty}</p>
                                        </div>
                                        <div className="space-y-1.5">
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1">
                                                <IconChartBar size={12} className="text-orange-500" /> 잠재력
                                            </p>
                                            <p className="text-sm font-black text-orange-500">{trend.potential}</p>
                                        </div>
                                    </div>
                                </CardContent>

                                <CardFooter className="bg-muted/30 p-5 mt-auto border-t border-muted/50">
                                    <Link href={`/trend/${trend.id}`} className="w-full">
                                        <Button className="w-full rounded-2xl font-black bg-white hover:bg-primary hover:text-primary-foreground text-foreground transition-all duration-300 h-12 shadow-sm border-2 border-muted" variant="ghost">
                                            상세 분석 리포트 확인
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
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
