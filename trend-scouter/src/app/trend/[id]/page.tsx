import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
    IconArrowLeft,
    IconChartBar,
    IconClock,
    IconBulb,
    IconTarget,
    IconCheck,
    IconExternalLink,
    IconTrendingUp
} from "@tabler/icons-react";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function TrendDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    const { data: trend, error } = await supabase
        .from('trends')
        .select(`
      *,
      analysis (
        *
      )
    `)
        .eq('id', id)
        .single();

    if (error || !trend) {
        notFound();
    }

    const analysis = trend.analysis?.[0];

    // Summary에서 Reasoning과 GTM 전략 섹션을 분리합니다.
    const summaryParts = analysis?.summary?.split('### 💡 점수 부여 근거 (Reasoning)') || [];
    const mainSummary = summaryParts[0]?.trim();
    const reasoningAndGtm = summaryParts[1] || "";

    const gtmParts = reasoningAndGtm.split('### 🇰🇷 한국형 진입 전략 (GTM)') || [];
    const reasoning = gtmParts[0]?.trim();
    const gtmStrategy = gtmParts[1]?.trim();

    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            {/* Top Navigation */}
            <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2 rounded-full">
                            <IconArrowLeft size={18} />
                            목록으로 돌아가기
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <IconBulb className="text-primary w-5 h-5" />
                        <span className="font-bold text-sm">Trend Detail</span>
                    </div>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 py-12">
                {/* Header Section */}
                <header className="mb-12">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <Badge variant="secondary" className="bg-primary/10 text-primary px-3 py-1 text-xs">
                            {trend.source.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            {new Date(trend.created_at).toLocaleDateString()}
                        </Badge>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-8 leading-tight">
                        {trend.title}
                    </h1>

                    <div className="flex flex-wrap gap-8 items-center bg-muted/30 p-8 rounded-3xl border border-muted">
                        <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-2">총점</span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-5xl font-black text-primary">{analysis?.score_revenue || 0}</span>
                                <span className="text-sm font-bold text-muted-foreground">/ 100</span>
                            </div>
                        </div>
                        <Separator orientation="vertical" className="h-12 hidden sm:block" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 flex-1">
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1">
                                    <IconClock size={14} /> 실행 난이도
                                </p>
                                <p className="text-lg font-bold">{analysis?.score_difficulty > 70 ? '어려움' : analysis?.score_difficulty > 40 ? '보통' : '쉬움'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1">
                                    <IconTrendingUp size={14} /> 한국 시장 잠재력
                                </p>
                                <p className="text-lg font-bold text-orange-500">{analysis?.score_korea_potential > 70 ? '높음' : analysis?.score_korea_potential > 40 ? '보통' : '낮음'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest flex items-center gap-1">
                                    <IconChartBar size={14} /> 수익성 모델
                                </p>
                                <p className="text-lg font-bold">구간 결제 / 구독</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        {/* Summary Section */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <IconCheck className="text-primary w-5 h-5" />
                                </div>
                                <h2 className="text-2xl font-bold">아이디어 요약</h2>
                            </div>
                            <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                {mainSummary || "현재 분석 중입니다."}
                            </p>
                        </section>

                        {/* Reasoning Section */}
                        <section className="space-y-4 bg-primary/5 p-8 rounded-3xl border border-primary/10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                    <IconTarget className="text-primary-foreground w-5 h-5" />
                                </div>
                                <h2 className="text-2xl font-bold">점수 부여 근거</h2>
                            </div>
                            <p className="text-md leading-relaxed whitespace-pre-wrap">
                                {reasoning || "데이터 기반 분석 근거가 준비 중입니다."}
                            </p>
                        </section>

                        {/* GTM Strategy Section */}
                        <section className="space-y-4 bg-muted/50 p-8 rounded-3xl border border-muted">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                    <IconTrendingUp className="text-white w-5 h-5" />
                                </div>
                                <h2 className="text-2xl font-bold">🇰🇷 한국형 진입 전략</h2>
                            </div>
                            <p className="text-md leading-relaxed whitespace-pre-wrap">
                                {gtmStrategy || "한국 시장 특화 전략이 준비 중입니다."}
                            </p>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-8">
                        <div className="bg-card border rounded-3xl p-6 shadow-sm">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <IconExternalLink size={18} /> 원본 소스
                            </h3>
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    트렌드 스카우터가 수집한 원문 데이터를 직접 확인해 보세요.
                                </p>
                                <a href={trend.url} target="_blank" rel="noopener noreferrer" className="block">
                                    <Button variant="outline" className="w-full justify-between group">
                                        원본 게시물 방문
                                        <IconExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </Button>
                                </a>
                            </div>
                        </div>

                        <div className="bg-primary/5 border border-primary/10 rounded-3xl p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-primary">
                                추가 인사이트가 필요하신가요?
                            </h3>
                            <p className="text-sm leading-relaxed mb-6">
                                프리미엄 구독을 통해 해당 아이디어의 경쟁사 분석, 상세 마케팅 플랜, 기술 스택 추천 리포트를 받아보세요.
                            </p>
                            <Button className="w-full bg-primary font-bold shadow-lg shadow-primary/20">
                                Premium 리포트 신청
                            </Button>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t py-12 bg-muted/30 mt-20">
                <div className="max-w-5xl mx-auto px-4 text-center">
                    <p className="text-muted-foreground text-sm">
                        © 2026 Trend Scouter. Built with Precision & AI.
                    </p>
                </div>
            </footer>
        </div>
    );
}
