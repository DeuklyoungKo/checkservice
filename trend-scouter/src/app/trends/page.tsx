import { createClient } from "@/utils/supabase/server";
import { TrendList } from "@/components/TrendList";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
    IconBulb,
    IconTrendingUp,
    IconSparkles,
    IconArrowLeft,
} from "@tabler/icons-react";

export const metadata = {
    title: "전체 트렌드 — Trend Intelligence",
    description: "AI가 분석한 글로벌 트렌드를 모두 탐색하세요. 검색, 필터, 정렬 기능을 제공합니다.",
};

export default async function TrendsPage() {
    const supabase = await createClient();

    // 1. 최신 analysis 데이터를 먼저 조회 (관계 조인 대신 수동 매핑)
    const { data: latestAnalyses } = await supabase
        .from('analysis')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

    // 2. trend_id 목록으로 trends 조회
    const analysisIds = latestAnalyses?.map(a => a.trend_id) || [];
    const { data: rawTrends, error } = analysisIds.length > 0
        ? await supabase.from('trends').select('*').in('id', analysisIds)
        : { data: [], error: null };

    const { data: { user } } = await supabase.auth.getUser();
    const { data: userBookmarks } = user
        ? await supabase.from("bookmarks").select("trend_id").eq("user_id", user.id)
        : { data: [] };
    const bookmarkedIds = new Set(userBookmarks?.map(b => b.trend_id) || []);

    if (error) console.error("Error fetching trends:", error);

    // 3. analysis 순서 기준으로 매핑
    const trends = (latestAnalyses || []).reduce<{
        id: string; title: string; category: string; score: number;
        difficulty: string; potential: string; description: string;
        tags: string[]; isBookmarked: boolean; isUnlocked: boolean;
    }[]>((acc, analysis) => {
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
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                                <IconBulb className="text-primary-foreground w-6 h-6" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-primary">Trend Intelligence</span>
                        </Link>
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="gap-2 font-bold">
                                <IconArrowLeft size={16} />
                                메인으로
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <header className="relative overflow-hidden pt-16 pb-12 border-b bg-muted/20">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <Badge variant="outline" className="mb-4 px-4 py-1 text-primary border-primary/30 bg-primary/5 gap-2 uppercase tracking-widest font-bold">
                        <IconSparkles size={14} />
                        All Trends
                    </Badge>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-[1.1]">
                        전체 트렌드 <span className="text-primary">탐색</span>
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        AI가 분석한 <strong className="text-foreground">{trends.length}개</strong>의 글로벌 트렌드 데이터를 모두 탐색하세요.
                        검색과 필터로 원하는 비즈니스 기회를 빠르게 찾을 수 있습니다.
                    </p>
                </div>
            </header>

            {/* Trend List */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-3">
                        <IconTrendingUp className="text-primary w-7 h-7" />
                        <h2 className="text-2xl font-bold">트렌드 목록</h2>
                    </div>
                </div>
                <TrendList initialTrends={trends} />
            </main>

            {/* Footer */}
            <footer className="border-t py-12 bg-muted/50 text-center mt-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 opacity-50">
                            <IconBulb size={20} />
                            <span className="text-base font-bold">Trend Intelligence</span>
                        </div>
                        <p className="text-muted-foreground text-sm">© 2026 Trend Intelligence. Built with Precision & AI.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
