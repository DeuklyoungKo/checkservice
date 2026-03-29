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
    IconWorld,
    IconBookmark
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

    const { data: { user } } = await supabase.auth.getUser();
    const { data: bookmark } = user
        ? await supabase.from('bookmarks').select('*').eq('user_id', user.id).eq('trend_id', id).single()
        : { data: null };

    const analysis = trend.analysis?.[0];

    // Stats-Only: Use AI-generated headline and summary directly
    const displayTitle = analysis?.headline || "분석 중인 트렌드";
    const mainSummary = analysis?.summary || "현재 비즈니스 분석이 진행 중입니다.";
    const reasoning = analysis?.summary ? "데이터 기반 분석 근거가 준비되었습니다." : "분석 근거를 생성 중입니다.";

    const gtmStrategy = analysis?.gtm_strategy?.trim() || "한국 시장 특화 전략이 준비 중입니다.";

    // 기술 스택 파싱: JSON 배열 문자열, 줄바꿈, 쉼표 등 모든 형식 처리
    const cleanTechStack = (text: string | null): string[] => {
        if (!text) return [];
        let processed = text.trim();
        // JSON 배열 형태인 경우 파싱 시도
        if (processed.startsWith('[') && processed.endsWith(']')) {
            try {
                const parsed = JSON.parse(processed);
                if (Array.isArray(parsed)) {
                    // 각 항목 내의 개행으로 다시 분할
                    return parsed.flatMap((item: string) =>
                        item.split('\n').map((s: string) => s.trim()).filter(Boolean)
                    );
                }
            } catch {
                // JSON 파싱 실패 시 문자 기반 처리로 폴백
            }
        }
        // 따옴표, 대괄호 제거 후 줄바꿈/쉼표 분리
        return processed
            .replace(/^\[|\]$/g, '')
            .replace(/^["']|["']$/gm, '')
            .split(/[\n,]/) 
            .map(l => l.replace(/^["']|["'\s,]+$/g, '').trim())
            .filter(Boolean);
    };


    // 문장 단위 줄바꿈 최적화 (Reasoning, GTM용: 2-3문장마다 단락 구분)
    // 문장 단위 줄바꿈 최적화 (Reasoning, GTM용: 2-3문장마다 단락 구분)
    const formatNarrativeText = (text: string | null) => {
        if (!text) return "";
        let processed = text.trim();

        // 이미 단락 구분(\n\n)이 있는 경우 AI의 구조화 의도를 존중하여 그대로 두되, 문장 끝 공백 정합성만 맞춤
        if (processed.includes('\n\n')) {
            return processed;
        }

        // 1. 숫자로 시작하는 리스트 형태(1. 2. 등)가 포함되어 있는지 확인
        // 숫자 앞에 줄바꿈을 넣어 리스트 항목을 명확히 구분
        if (/\d+\./.test(processed)) {
            return processed
                .replace(/(\d+\.)/g, '\n\n$1')
                .split('\n\n')
                .map(block => block.trim())
                .filter(Boolean)
                .join('\n\n');
        }

        // 2. 단락 구분이 없는 일반 서술형 긴 글인 경우, 2문장마다 새로운 단락으로 나눔
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

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 transition-all duration-500">
            {/* Top Navigation */}
            <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-muted transition-all font-bold">
                            <IconArrowLeft size={18} />
                            대시보드로 돌아가기
                        </Button>
                    </Link>
                    <div className="flex items-center gap-4">
                        <BookmarkButton trendId={trend.id} initialIsBookmarked={!!bookmark} />
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex items-center gap-2">
                            <IconBulb className="text-primary w-5 h-5" />
                            <span className="font-black text-sm hidden sm:inline text-primary">심층 분석 리포트</span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-12">
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

                {/* Content Layout */}
                <div className="flex flex-col lg:flex-row gap-16">
                    <div className="flex-1 space-y-24">
                        {/* 1. Summary Section */}
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

                        {/* 2. Reasoning Section */}
                        <section className="space-y-10 bg-muted/20 p-12 rounded-[64px] border border-muted-foreground/5 shadow-sm group/reasoning">
                            <div className="flex items-center gap-6 mb-4">
                                <div className="w-16 h-16 bg-primary rounded-[28px] flex items-center justify-center shadow-xl shadow-primary/30 group-hover/reasoning:scale-110 transition-transform duration-500">
                                    <IconTarget className="text-primary-foreground w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-1.5 px-0.5 opacity-60">Analysis Insights</p>
                                    <h2 className="text-4xl font-black tracking-tighter">점수 부여 상세 근거</h2>
                                </div>
                            </div>
                            <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed bg-background/60 p-10 rounded-[40px] border border-muted shadow-inner">
                                <ReactMarkdown>{formatNarrativeText(reasoning) || "데이터 기반 분석이 로딩 중입니다."}</ReactMarkdown>
                            </div>
                        </section>

                        {/* 3. GTM Strategy Section (Report Style) */}
                        <section className="space-y-10 relative overflow-hidden group/gtm">
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-orange-500 rounded-[28px] flex items-center justify-center shadow-xl shadow-orange-500/30 group-hover/gtm:scale-110 transition-transform duration-500">
                                        <IconTrendingUp className="text-white w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-orange-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1.5 px-0.5 opacity-60">Market Entry Strategy</p>
                                        <h2 className="text-4xl font-black tracking-tighter">한국형 진입 전략 (GTM)</h2>
                                    </div>
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed bg-white dark:bg-slate-900 p-12 sm:p-16 rounded-[64px] border border-orange-200/50 dark:border-orange-900/40 shadow-2xl relative">
                                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] rounded-[64px]" />
                                    <div className="relative z-10 font-medium leading-loose">
                                        <ReactMarkdown>{formatNarrativeText(analysis?.gtm_strategy) || "전략 수립 중입니다."}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 4. Solution Wizard Section (NEW) */}
                        <section className="space-y-12 bg-primary/5 p-12 rounded-[64px] border border-primary/20 shadow-inner group/wizard">
                            <div className="flex items-center gap-6 mb-4">
                                <div className="w-16 h-16 bg-foreground rounded-[28px] flex items-center justify-center shadow-2xl group-hover/wizard:rotate-12 transition-transform duration-500">
                                    <IconRocket className="text-background w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-1.5 px-0.5 opacity-60">Step-by-Step Solution</p>
                                    <h2 className="text-4xl font-black tracking-tighter">AI 아이디어 컨버터 (솔루션 위저드)</h2>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Steps */}
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                        <IconCheck className="text-primary" /> 해결 실행 단계
                                    </h3>
                                    {(analysis?.solution_wizard as any)?.steps?.map((step: string, i: number) => (
                                        <div key={i} className="flex gap-4 p-6 bg-background rounded-3xl border border-muted shadow-sm hover:scale-105 transition-transform">
                                            <span className="text-2xl font-black text-primary/20">0{i+1}</span>
                                            <p className="text-sm font-bold leading-relaxed">{step}</p>
                                        </div>
                                    ))}
                                </div>
                                {/* Checklist */}
                                <div className="bg-primary/10 p-10 rounded-[48px] border border-primary/20 h-fit">
                                    <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                        <IconRocket size={20} className="text-primary" /> 액션 체크리스트
                                    </h3>
                                    <div className="space-y-4">
                                        {(analysis?.solution_wizard as any)?.checklist?.map((item: string, i: number) => (
                                            <div key={i} className="flex items-center gap-4 bg-background/50 p-4 rounded-2xl border border-primary/10">
                                                <div className="w-6 h-6 rounded-full border-2 border-primary/30 flex items-center justify-center group-hover/wizard:bg-primary/20 transition-colors">
                                                    <IconCheck size={12} className="text-primary opacity-0 group-hover:opacity-100" />
                                                </div>
                                                <span className="text-xs font-bold text-foreground/80">{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:w-80 space-y-8 h-fit lg:sticky lg:top-24">
                        <div className="bg-card border-2 border-muted hover:border-primary/30 transition-all duration-500 rounded-[48px] p-10 shadow-sm group">
                            <h3 className="font-black text-xl mb-8 flex items-center gap-3">
                                <IconExternalLink size={24} className="text-primary" /> 리서치 원본
                            </h3>
                            <div className="space-y-8">
                                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                    이 보고서의 기초가 된 원문 데이터를 직접 확인하고 검토해 보세요. 투명한 분석을 위해 원본 링크를 제공합니다.
                                </p>
                                <a href={trend.url} target="_blank" rel="noopener noreferrer" className="block">
                                    <Button size="lg" variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-500 rounded-2xl font-black h-14 border-2">
                                        원본 게시물 보기
                                        <IconExternalLink size={20} className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    </Button>
                                    <p className="mt-4 text-[10px] text-center text-muted-foreground font-black uppercase tracking-widest truncate opacity-40">Source: {trend.url}</p>
                                </a>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-primary/20 rounded-[48px] p-10 shadow-xl shadow-primary/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/20 rounded-full -mr-20 -mt-20 blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-1000" />
                            <h3 className="font-black text-2xl mb-6 relative z-10 leading-[1.2] tracking-tighter">
                                완벽한 타이밍을 <br />놓치지 마세요.
                            </h3>
                            <div className="space-y-3 relative z-10 mb-10">
                                <p className="text-sm leading-relaxed text-muted-foreground font-bold opacity-90">
                                    프리미엄 가입 시 다음과 같은 혜택을 즉시 이용하실 수 있습니다.
                                </p>
                                <ul className="text-xs space-y-2 text-muted-foreground/80 font-medium list-disc list-inside">
                                    <li>경쟁사 분석 데이터봇</li>
                                    <li>상세 마케팅 이메일 템플릿</li>
                                    <li>10분 빠른 신규 트렌드 알림</li>
                                </ul>
                            </div>
                            <div className="pt-4 border-t border-primary/10">
                                <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-4 opacity-70">Business Inquiry</p>
                                <p className="text-sm text-muted-foreground font-medium mb-4">
                                    맞춤형 심층 리포트가 필요하신가요? 언제든 편하게 문의해 주세요.
                                </p>
                                <Link href="/contact" className="block w-full">
                                    <Button variant="outline" className="w-full text-primary border-primary/20 hover:bg-primary/5 font-bold h-12 rounded-xl">
                                        비즈니스 문의하기
                                    </Button>
                                </Link>
                            </div>
                            <Link href="/premium" className="block w-full">
                                <Button size="lg" className="w-full bg-primary font-black shadow-lg shadow-primary/40 h-14 rounded-2xl relative z-10 text-lg hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 mt-6">
                                    Premium 가입하기
                                </Button>
                            </Link>
                        </div>
                    </aside>
                </div>

                {/* 4. Tech & Localization Section (Full Width) */}
                <div className="mt-16 border-t border-muted/30 pt-16 mb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
                        <section className="relative group flex flex-col h-full">
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-cyan-500/30 rounded-[56px] blur-2xl group-hover:opacity-100 transition duration-1000 opacity-20 group-hover:duration-500"></div>
                            <div className="relative space-y-10 bg-card/80 dark:bg-slate-900/60 p-12 rounded-[56px] border border-blue-100/30 dark:border-blue-900/40 flex-1 backdrop-blur-2xl hover:translate-y-[-8px] transition-all duration-500 shadow-2xl overflow-hidden flex flex-col">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full -mr-24 -mt-24 blur-3xl opacity-50" />
                                <div className="flex items-center gap-6 mb-4 relative z-10">
                                    <div className="w-20 h-20 bg-blue-500/10 rounded-[32px] flex items-center justify-center shadow-inner border border-blue-500/30">
                                        <IconTools className="text-blue-500 w-10 h-10" />
                                    </div>
                                    <div>
                                        <p className="text-blue-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1.5 px-0.5 opacity-60">Architecture</p>
                                        <h3 className="text-3xl font-black tracking-tighter">추천 기술 스택</h3>
                                    </div>
                                </div>
                                <div className="relative z-10 flex-1">
                                    {(() => {
                                        const items = cleanTechStack(analysis?.tech_stack_suggestion);
                                        if (items.length === 0) return <p className="text-muted-foreground">정보를 준비하고 있습니다.</p>;
                                        return (
                                            <div className="flex flex-wrap gap-2">
                                                {items.map((item, i) => (
                                                    <span
                                                        key={i}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-semibold hover:bg-blue-500/20 transition-colors"
                                                    >
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        </section>

                        <section className="relative group flex flex-col h-full">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/30 to-pink-500/30 rounded-[56px] blur-2xl group-hover:opacity-100 transition duration-1000 opacity-20 group-hover:duration-500"></div>
                            <div className="relative space-y-10 bg-card/80 dark:bg-slate-900/60 p-12 rounded-[56px] border border-purple-100/30 dark:border-purple-900/40 flex-1 backdrop-blur-2xl hover:translate-y-[-8px] transition-all duration-500 shadow-2xl overflow-hidden flex flex-col">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full -mr-24 -mt-24 blur-3xl opacity-50" />
                                <div className="flex items-center gap-6 mb-4 relative z-10">
                                    <div className="w-20 h-20 bg-purple-500/10 rounded-[32px] flex items-center justify-center shadow-inner border border-purple-500/30">
                                        <IconWorld className="text-purple-500 w-10 h-10" />
                                    </div>
                                    <div>
                                        <p className="text-purple-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1.5 px-0.5 opacity-60">Glocalization</p>
                                        <h3 className="text-3xl font-black tracking-tighter">현지화 핵심 포인트</h3>
                                    </div>
                                </div>
                                <div className="relative z-10 flex-1 space-y-4">
                                    {(() => {
                                        const raw = analysis?.korea_localization_tips;
                                        if (!raw) return <p className="text-muted-foreground">정보를 준비하고 있습니다.</p>;
                                        // 줄바꿈 기준, 번호 기준으로 단락 분리
                                        const paragraphs = raw
                                            .trim()
                                            .split(/\n{2,}|(?=\d+\.)/) // 빈줄 or 번호 앞에서 분할
                                            .map((p: string) => p.trim())
                                            .filter(Boolean);
                                        return paragraphs.map((para: string, i: number) => (
                                            <div key={i} className="flex gap-3">
                                                <span className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-xs font-black text-purple-600 dark:text-purple-400">{i + 1}</span>
                                                <p className="text-sm leading-relaxed text-foreground/80 font-medium">{para.replace(/^\d+\.\s*/, '')}</p>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t py-24 bg-muted/20 mt-20">
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
