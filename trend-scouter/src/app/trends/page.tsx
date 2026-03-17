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

    const { data: rawTrends, error } = await supabase
        .from("trends")
        .select(`
            *,
            analysis (
                score_revenue,
                score_difficulty,
                score_korea_potential,
                summary
            )
        `)
        .order("created_at", { ascending: false })
        .limit(200);

    const { data: { user } } = await supabase.auth.getUser();
    const { data: userBookmarks } = user
        ? await supabase.from("bookmarks").select("trend_id").eq("user_id", user.id)
        : { data: [] };
    const bookmarkedIds = new Set(userBookmarks?.map(b => b.trend_id) || []);

    if (error) console.error("Error fetching trends:", error);

    const trends = rawTrends?.map(t => {
        const analysis = t.analysis?.[0];
        let displayTitle = t.title;
        let displayDescription = analysis?.summary || t.description || "설명이 없습니다.";

        if (analysis?.summary && analysis.summary.startsWith("[TITLE_KO]")) {
            const parts = analysis.summary.split("\n\n");
            const titleMatch = parts[0].replace("[TITLE_KO] ", "").trim();
            if (titleMatch) {
                displayTitle = titleMatch;
                displayDescription = parts.slice(1).join("\n\n").split("###")[0].trim();
            }
        } else if (analysis?.summary) {
            displayDescription = analysis.summary.split("###")[0].trim();
        }

        return {
            id: t.id,
            title: displayTitle,
            category:
                t.source === "reddit" ? "Community/Reddit" :
                t.source === "product-hunt" ? "SaaS/Product Hunt" :
                t.source === "indie-hackers" ? "Indie Hackers" : "General",
            score: analysis?.score_revenue || 0,
            difficulty: analysis?.score_difficulty > 70 ? "어려움" : analysis?.score_difficulty > 40 ? "보통" : "쉬움",
            potential: analysis?.score_korea_potential > 70 ? "높음" : analysis?.score_korea_potential > 40 ? "보통" : "낮음",
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
