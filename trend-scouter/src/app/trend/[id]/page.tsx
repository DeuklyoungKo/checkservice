import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
    IconArrowLeft,
    IconChartBar,
    IconClock,
    IconBulb,
    IconTarget,
    IconCheck,
    IconExternalLink,
    IconTrendingUp,
    IconRocket,
    IconTools,
    IconWorld
} from "@tabler/icons-react";
import { BookmarkButton } from "@/components/BookmarkButton";

interface PageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: trend } = await supabase
        .from('trends')
        .select('*, analysis(headline, summary)')
        .eq('id', id)
        .single();

    if (!trend) return { title: "Trend NOT Found" };

    const analysis = trend.analysis?.[0];
    const displayTitle = analysis?.headline || "분석 중인 트렌드";

    return {
        title: `${displayTitle} - Trend Intelligence`,
        description: analysis?.summary || "비즈니스 기회를 분석하고 있습니다.",
    };
}

export default async function TrendDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // [수동 병합] 외래키 미설정으로 인한 PGRST200 오류 우회:
    // trend와 analysis를 각각 호출 후 병합합니다.
    const [{ data: trend, error }, { data: { user } }] = await Promise.all([
        supabase.from('trends').select('*').eq('id', id).single(),
        supabase.auth.getUser(),
    ]);

    if (error || !trend) {
        notFound();
    }

    const [{ data: analysisData }, { data: bookmark }] = await Promise.all([
        supabase.from('analysis').select('*').eq('trend_id', id).single(),
        user
            ? supabase.from('bookmarks').select('*').eq('user_id', user.id).eq('trend_id', id).single()
            : Promise.resolve({ data: null }),
    ]);

    const analysis = analysisData;
    const isUnlocked = analysis?.is_unlocked ?? false;

    // Stats-Only: Use AI-generated headline and summary directly
    const displayTitle = analysis?.headline || "분석 중인 트렌드";
    const mainSummary = analysis?.summary || "현재 비즈니스 분석이 진행 중입니다.";
    const reasoning = analysis?.summary ? "데이터 기반 분석 근거가 준비되었습니다." : "분석 근거를 생성 중입니다.";

    // 기술 스택 파싱
    const cleanTechStack = (text: string | null): string[] => {
        if (!text) return [];
        let processed = text.trim();
        if (processed.startsWith('[') && processed.endsWith(']')) {
            try {
                const parsed = JSON.parse(processed);
                if (Array.isArray(parsed)) {
                    return parsed.flatMap((item: string) =>
                        item.split('\n').map((s: string) => s.trim()).filter(Boolean)
                    );
                }
            } catch { }
        }
        return processed
            .replace(/^\[|\]$/g, '')
            .replace(/^["']|["']$/gm, '')
            .split(/[\n,]/)
            .map(l => l.replace(/^["']|["'\s,]+$/g, '').trim())
            .filter(Boolean);
    };

    // 문장 단위 줄바꿈 최적화
    const formatNarrativeText = (text: string | null) => {
        if (!text) return "";
        let processed = text.trim();
        if (processed.includes('\n\n')) return processed;
        if (/\d+\./.test(processed)) {
            return processed
                .replace(/(\d+\.)/g, '\n\n$1')
                .split('\n\n')
                .map(block => block.trim())
                .filter(Boolean)
                .join('\n\n');
        }
        const sentences = processed
            .split(/\.[\s\n]+/)
            .map(s => s.trim())
            .filter(Boolean)
            .map(sentence => sentence.endsWith('.') ? sentence : `${sentence}.`);

        const groupedParagraphs = [];
        for (let i = 0; i < sentences.length; i += 2) {
            const paragraph = sentences.slice(i, i + 2).join(' ');
            groupedParagraphs.push(paragraph);
        }
        return groupedParagraphs.join('\n\n');
    };

    // Unlock CTA Component
    const UnlockCTA = () => (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/40 backdrop-blur-sm rounded-[64px] p-8 text-center animate-in fade-in duration-700">
            <div className="bg-background/90 p-12 rounded-[56px] border-2 border-primary/20 shadow-2xl max-w-lg space-y-8">
                <div className="w-24 h-24 bg-primary/10 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                    <IconRocket size={48} className="text-primary animate-bounce" />
                </div>
                <h3 className="text-3xl font-black tracking-tighter leading-tight">
                    이 트렌드의 <span className="text-primary italic underline decoration-4 underline-offset-4">성공 레시피</span>가 <br />궁금하신가요?
                </h3>
                <p className="text-muted-foreground font-bold leading-relaxed">
                    PUFE 상세 지표, 한국형 GTM 전략, 실행 체크리스트 등 <br />
                    비즈니스 실행력을 높여줄 모든 분석 데이터가 잠겨 있습니다.
                </p>
                <div className="pt-6 space-y-4">
                    <Link href="/premium" className="block">
                        <Button size="lg" className="w-full bg-primary font-black shadow-xl shadow-primary/30 h-16 rounded-2xl text-xl hover:scale-105 transition-all">
                            분석 리포트 잠금 해제하기
                        </Button>
                    </Link>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-50 uppercase">
                        Premium membership required for deep insights
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 transition-all duration-500">
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* 뒤로가기 + 북마크 */}
                <div className="flex items-center justify-between mb-8">
                    <Link href="/trends">
                        <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-muted transition-all font-bold">
                            <IconArrowLeft size={18} />
                            트렌드 목록으로
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3">
                        <BookmarkButton trendId={trend.id} initialIsBookmarked={!!bookmark} />
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-2">
                            <IconBulb className="text-primary w-5 h-5" />
                            <span className="font-black text-sm hidden sm:inline text-primary">심층 분석 리포트</span>
                        </div>
                    </div>
                </div>
                {/* Header Section */}
                <header className="mb-16">
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <Badge variant="secondary" className="bg-primary/10 text-primary px-3 py-1 text-xs font-black tracking-widest uppercase">
                            {trend.source.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs font-black uppercase tracking-widest text-muted-foreground bg-background/50">
                            수집일: {new Date(trend.created_at).toLocaleDateString()}
                        </Badge>
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black tracking-tighter mb-12 leading-[1.05] text-balance">
                        {displayTitle}
                    </h1>

                    <div className="space-y-4 bg-primary/5 p-8 rounded-[56px] border border-primary/10 shadow-sm backdrop-blur-sm">
                        {/* Row 1: 4 PUFE Score Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Pain */}
                            <div className="bg-background/80 p-6 rounded-[40px] border border-muted/50 shadow-sm flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] text-primary/60 font-black uppercase tracking-widest mb-2">Pain (고통)</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-primary">{analysis?.pufe_p || 0}</span>
                                    <span className="text-[10px] font-bold text-primary/30">/ 25</span>
                                </div>
                            </div>
                            {/* Urgency */}
                            <div className="bg-background/80 p-6 rounded-[40px] border border-muted/50 shadow-sm flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] text-orange-500/60 font-black uppercase tracking-widest mb-2">Urgency (긴급)</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-orange-500">{analysis?.pufe_u || 0}</span>
                                    <span className="text-[10px] font-bold text-orange-500/30">/ 25</span>
                                </div>
                            </div>
                            {/* Frequency */}
                            <div className="bg-background/80 p-6 rounded-[40px] border border-muted/50 shadow-sm flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] text-blue-500/60 font-black uppercase tracking-widest mb-2">Frequency (빈도)</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-blue-500">{analysis?.pufe_f || 0}</span>
                                    <span className="text-[10px] font-bold text-blue-500/30">/ 25</span>
                                </div>
                            </div>
                            {/* Existing Solution */}
                            <div className="bg-background/80 p-6 rounded-[40px] border border-muted/50 shadow-sm flex flex-col items-center justify-center text-center">
                                <span className="text-[10px] text-green-500/60 font-black uppercase tracking-widest mb-2">Existing (대안)</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-green-500">{analysis?.pufe_e || 0}</span>
                                    <span className="text-[10px] font-bold text-green-500/30">/ 25</span>
                                </div>
                            </div>
                        </div>

                        {/* Summary Score & Category (Full Width) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative bg-background/80 px-10 py-6 rounded-[40px] border border-primary/20 shadow-sm flex items-center justify-between">
                                <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">종합 PUFE 스코어</span>
                                <span className="text-4xl font-black text-primary">{analysis?.pufe_total || 0} <span className="text-xs font-bold opacity-30">PTS</span></span>
                            </div>
                            <div className="relative bg-background/80 px-10 py-6 rounded-[40px] border border-muted/50 shadow-sm flex items-center justify-between">
                                <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">Pain Point 유형</span>
                                <Badge className="rounded-full px-6 py-2 bg-primary/10 text-primary font-black border-none text-sm">
                                    {analysis?.pain_category || 'General'} Pain
                                </Badge>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex flex-col lg:flex-row gap-16">
                    <div className="flex-1 space-y-24">
                        {/* 1. Summary Section (Always Visible) */}
                        <section className="space-y-10 group/summary">
                            <div className="flex items-center gap-6 mb-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-[28px] flex items-center justify-center shadow-inner border border-primary/20 group-hover/summary:scale-110 transition-transform duration-500">
                                    <IconCheck className="text-primary w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-1.5 px-0.5 opacity-60">Overview</p>
                                    <h2 className="text-4xl font-black tracking-tighter">AI 아이디어 요약</h2>
                                </div>
                            </div>
                            <div className="prose prose-xl prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed font-medium bg-background/40 p-10 rounded-[40px] border border-muted/50 shadow-sm">
                                <ReactMarkdown>{mainSummary || "분석 데이터를 불러오고 있습니다."}</ReactMarkdown>
                            </div>
                        </section>

                        <div className="relative">
                            {/* Premium Masking Layer */}
                            <div className={isUnlocked ? "" : "blur-3xl select-none pointer-events-none opacity-40 grayscale transition-all duration-1000"}>
                                {/* 2. Reasoning */}
                                <section className="space-y-10 bg-muted/20 p-12 rounded-[64px] border border-muted-foreground/5 shadow-sm group/reasoning mb-24">
                                    <div className="flex items-center gap-6 mb-4">
                                        <div className="w-16 h-16 bg-primary rounded-[28px] flex items-center justify-center shadow-xl shadow-primary/30 group-hover/reasoning:scale-110 transition-transform duration-500">
                                            <IconTarget className="text-primary-foreground w-8 h-8" />
                                        </div>
                                        <h2 className="text-4xl font-black tracking-tighter">점수 부여 상세 근거</h2>
                                    </div>
                                    <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed bg-background/60 p-10 rounded-[40px] border border-muted shadow-inner">
                                        <ReactMarkdown>{formatNarrativeText(reasoning)}</ReactMarkdown>
                                    </div>
                                </section>

                                {/* 3. GTM Strategy */}
                                <section className="space-y-10 relative overflow-hidden group/gtm mb-24">
                                    <div className="flex items-center gap-6 mb-4">
                                        <div className="w-16 h-16 bg-orange-500 rounded-[28px] flex items-center justify-center shadow-xl shadow-orange-500/30 group-hover/gtm:scale-110 transition-transform duration-500">
                                            <IconTrendingUp className="text-white w-8 h-8" />
                                        </div>
                                        <h2 className="text-4xl font-black tracking-tighter">한국형 진입 전략 (GTM)</h2>
                                    </div>
                                    <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed bg-white dark:bg-slate-900 p-12 sm:p-16 rounded-[64px] border border-orange-200/50 dark:border-orange-900/40 shadow-2xl relative">
                                        <ReactMarkdown>{formatNarrativeText(analysis?.gtm_strategy)}</ReactMarkdown>
                                    </div>
                                </section>

                                {/* 4. Solution Wizard */}
                                <section className="space-y-12 bg-primary/5 p-12 rounded-[64px] border border-primary/20 shadow-inner group/wizard">
                                    <h2 className="text-4xl font-black tracking-tighter flex items-center gap-6 mb-4">
                                        <div className="w-16 h-16 bg-foreground rounded-[28px] flex items-center justify-center shadow-2xl group-hover/wizard:rotate-12 transition-transform duration-500">
                                            <IconRocket className="text-background w-8 h-8" />
                                        </div>
                                        AI 아이디어 컨버터
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-6">
                                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                                <IconCheck className="text-primary" /> 해결 실행 단계
                                            </h3>
                                            {(analysis?.solution_wizard as any)?.steps?.map((step: string, i: number) => (
                                                <div key={i} className="flex gap-4 p-6 bg-background rounded-3xl border border-muted shadow-sm">
                                                    <span className="text-2xl font-black text-primary/20">0{i+1}</span>
                                                    <p className="text-sm font-bold leading-relaxed">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-primary/10 p-10 rounded-[48px] border border-primary/20 h-fit">
                                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                                <IconRocket size={20} className="text-primary" /> 액션 체크리스트
                                            </h3>
                                            <div className="space-y-4">
                                                {(analysis?.solution_wizard as any)?.checklist?.map((item: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-primary/10">
                                                        <IconCheck size={16} className="text-primary" />
                                                        <span className="text-xs font-bold text-foreground/80">{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Unlock Action Overlay */}
                            {!isUnlocked && <UnlockCTA />}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:w-80 space-y-8 h-fit lg:sticky lg:top-24">
                        <div className="bg-card border-2 border-muted hover:border-primary/30 transition-all duration-500 rounded-[48px] p-10 shadow-sm group">
                            <h3 className="font-black text-xl mb-8 flex items-center gap-3">
                                <IconExternalLink size={24} className="text-primary" /> 리서치 원본
                            </h3>
                            <a href={trend.url} target="_blank" rel="noopener noreferrer" className="block">
                                <Button size="lg" variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-500 rounded-2xl font-black h-14 border-2">
                                    원본 게시물 보기
                                    <IconExternalLink size={20} />
                                </Button>
                            </a>
                        </div>

                        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-primary/20 rounded-[48px] p-10 shadow-xl shadow-primary/5 relative overflow-hidden group">
                            <h3 className="font-black text-2xl mb-6 relative z-10 leading-[1.2] tracking-tighter">
                                완벽한 타이밍을 <br />놓치지 마세요.
                            </h3>
                            <Link href="/premium" className="block w-full">
                                <Button size="lg" className="w-full bg-primary font-black shadow-lg shadow-primary/40 h-14 rounded-2xl relative z-10 text-lg hover:scale-[1.03] transition-all duration-300">
                                    Premium 가입하기
                                </Button>
                            </Link>
                        </div>
                    </aside>
                </div>

                {/* Tech & localization (Full Width) */}
                <div className="mt-16 border-t border-muted/30 pt-16 mb-16 relative">
                    <div className={isUnlocked ? "" : "blur-2xl select-none pointer-events-none opacity-40 grayscale"}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
                            <section className="relative group bg-card/80 dark:bg-slate-900/60 p-12 rounded-[56px] border border-blue-100/30 flex-1 backdrop-blur-2xl transition-all duration-500 shadow-2xl overflow-hidden flex flex-col">
                                <h3 className="text-3xl font-black tracking-tighter mb-8 flex items-center gap-6">
                                    <div className="w-16 h-16 bg-blue-500/10 rounded-[28px] flex items-center justify-center border border-blue-500/30">
                                        <IconTools className="text-blue-500 w-8 h-8" />
                                    </div>
                                    추천 기술 스택
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {cleanTechStack(analysis?.tech_stack_suggestion).map((item, i) => (
                                        <span key={i} className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-semibold">{item}</span>
                                    ))}
                                </div>
                            </section>

                            <section className="relative group bg-card/80 dark:bg-slate-900/60 p-12 rounded-[56px] border border-purple-100/30 flex-1 backdrop-blur-2xl transition-all duration-500 shadow-2xl overflow-hidden flex flex-col">
                                <h3 className="text-3xl font-black tracking-tighter mb-8 flex items-center gap-6">
                                    <div className="w-16 h-16 bg-purple-500/10 rounded-[28px] flex items-center justify-center border border-purple-500/30">
                                        <IconWorld className="text-purple-500 w-8 h-8" />
                                    </div>
                                    현지화 핵심 포인트
                                </h3>
                                <div className="space-y-4">
                                    {analysis?.korea_localization_tips?.split(/\n{2,}|(?=\d+\.)/).map((para: string, i: number) => (
                                        <div key={i} className="flex gap-3">
                                            <span className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/15 flex items-center justify-center text-xs font-black text-purple-600 dark:text-purple-400">{i + 1}</span>
                                            <p className="text-sm leading-relaxed text-foreground/80 font-medium">{para.replace(/^\d+\.\s*/, '').trim()}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t py-24 bg-muted/20 relative z-10">
                <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-6">
                    <div className="flex items-center gap-3 opacity-40">
                        <div className="p-2 bg-foreground rounded-lg">
                            <IconBulb size={24} className="text-background" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter">Trend Intelligence</span>
                    </div>
                    <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60">
                        © 2026 Trend Intelligence. Precision Analysis & Global Insights.
                    </p>
                </div>
            </footer>
        </div>
    );
}
