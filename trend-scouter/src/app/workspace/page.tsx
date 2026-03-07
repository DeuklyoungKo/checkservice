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
    IconArrowLeft
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
        return {
            id: t.id,
            title: t.title,
            category: t.source === 'reddit' ? 'Community/Reddit' : t.source === 'product-hunt' ? 'SaaS/Product Hunt' : 'General',
            score: analysis?.score_revenue || 0,
            difficulty: analysis?.score_difficulty > 70 ? '어려움' : analysis?.score_difficulty > 40 ? '보통' : '쉬움',
            potential: analysis?.score_korea_potential > 70 ? '높음' : analysis?.score_korea_potential > 40 ? '보통' : '낮음',
            description: analysis?.summary || t.description || "설명이 없습니다.",
            tags: t.raw_data?.tags || [t.source],
            isBookmarked: true,
        };
    }) || [];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                            <IconBulb className="text-primary-foreground w-5 h-5" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-primary">Trend Scouter</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <IconArrowLeft size={18} />
                                목록으로
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center gap-4 mb-10">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                        <IconBookmarkFilled className="text-primary w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">내 워크스페이스</h1>
                        <p className="text-muted-foreground">내가 찜한 비즈니스 기회들을 관리하세요.</p>
                    </div>
                </div>

                {trends.length === 0 ? (
                    <div className="text-center py-32 bg-muted/20 rounded-3xl border-2 border-dashed">
                        <IconTrendingUp className="mx-auto w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-xl font-bold mb-2">저장된 트렌드가 없습니다</h3>
                        <p className="text-muted-foreground mb-6">마음에 드는 아이디어를 발견하면 북마크 버튼을 눌러보세요.</p>
                        <Link href="/">
                            <Button className="rounded-xl font-bold">트렌드 탐색하기</Button>
                        </Link>
                    </div>
                ) : (
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
                                            <div className="mt-2 text-primary">
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
                                        <Button className="w-full rounded-xl font-bold bg-white hover:bg-primary hover:text-primary-foreground text-foreground transition-all duration-300" variant="outline">
                                            상세 리포트 보기
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
