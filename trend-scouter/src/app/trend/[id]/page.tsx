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
        .select('*, analysis(*)')
        .eq('id', id)
        .single();

    if (!trend) return { title: "Trend NOT Found" };

    const analysis = trend.analysis?.[0];
    let displayTitle = trend.title;

    if (analysis?.summary?.startsWith('[TITLE_KO]')) {
        const titleParts = analysis.summary.split('\n\n');
        displayTitle = titleParts[0].replace('[TITLE_KO] ', '').trim();
    }

    return {
        title: `${displayTitle} - Trend Scouter`,
        description: analysis?.summary?.split('###')[0]?.trim() || trend.description,
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

    // [TITLE_KO] 및 Summary 분리
    let displayTitle = trend.title;
    let mainSummary = "현재 분석 중입니다.";
    let reasoning = "데이터 기반 분석 근거가 준비 중입니다.";

    if (analysis?.summary) {
        let currentContent = analysis.summary;

        // 1. [TITLE_KO] 추출
        if (currentContent.startsWith('[TITLE_KO]')) {
            const titleParts = currentContent.split('\n\n');
            displayTitle = titleParts[0].replace('[TITLE_KO] ', '').trim();
            currentContent = titleParts.slice(1).join('\n\n');
        }

        // 2. Summary와 Reasoning 분리
        const summaryParts = currentContent.split('### 💡 점수 부여 근거 (Reasoning)');
        mainSummary = summaryParts[0]?.trim();

        const reasoningAndGtm = summaryParts[1] || "";
        reasoning = reasoningAndGtm.split('### 🇰🇷 한국형 진입 전략 (GTM)')[0]?.trim();
    }

    const gtmStrategy = analysis?.gtm_strategy?.trim() || "한국 시장 특화 전략이 준비 중입니다.";

    // 리스트 형식 최적화 (Tech Stack, Localization용)
    const formatListText = (text: string | null) => {
        if (!text) return "";
        let processed = text.trim();
        let lines: string[] = [];

        if (processed.includes('\n')) {
            lines = processed.split('\n').map(l => l.trim()).filter(Boolean);
        } else if (processed.includes(',') || processed.includes(';')) {
            const sep = processed.includes(';') ? ';' : ',';
            lines = processed.split(sep).map(l => l.trim()).filter(Boolean);
        } else {
            lines = [processed];
        }

        return lines.map(line => {
            if (line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) return line;
            return `- ${line}`;
        }).join('\n\n');
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

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-primary/5 p-10 rounded-[56px] border border-primary/10 shadow-sm backdrop-blur-sm">
                        <div className="relative flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-primary/10 pb-6 md:pb-0 md:pr-6 min-h-[180px]">
                            <div className="absolute top-8 left-0 right-0 flex items-center justify-center px-4">
                                <span className="text-sm text-primary/60 font-black uppercase tracking-widest whitespace-nowrap">종합 수익 점수</span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-6">
                                <span className="text-7xl font-black text-primary tabular-nums tracking-tighter drop-shadow-sm">{analysis?.score_revenue || 0}</span>
                                <span className="text-sm font-bold text-primary/40 pb-2">/ 100</span>
                            </div>
                        </div>

                        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="relative bg-background/80 p-8 rounded-[40px] border border-muted/50 shadow-sm flex flex-col items-center justify-center text-center hover:border-blue-500/30 transition-all duration-300 min-h-[180px]">
                                <div className="absolute top-8 left-0 right-0 flex items-center justify-center gap-2 px-4">
                                    <IconRocket size={16} className="text-blue-500" />
                                    <span className="text-sm text-muted-foreground uppercase font-black tracking-widest whitespace-nowrap">실행 난이도</span>
                                </div>
                                <p className="text-2xl font-black mt-6">{analysis?.score_difficulty > 70 ? '어려움' : analysis?.score_difficulty > 40 ? '보통' : '쉬움'}</p>
                            </div>
                            <div className="relative bg-background/80 p-8 rounded-[40px] border border-muted/50 shadow-sm flex flex-col items-center justify-center text-center hover:border-orange-500/30 transition-all duration-300 min-h-[180px]">
                                <div className="absolute top-8 left-0 right-0 flex items-center justify-center gap-2 px-4">
                                    <IconTrendingUp size={16} className="text-orange-500" />
                                    <span className="text-sm text-muted-foreground uppercase font-black tracking-widest whitespace-nowrap">한국 잠재력</span>
                                </div>
                                <p className="text-2xl font-black text-orange-500 mt-6">{analysis?.score_korea_potential > 70 ? '압도적' : analysis?.score_korea_potential > 40 ? '유망함' : '낮음'}</p>
                            </div>
                            <div className="relative bg-background/80 p-10 rounded-[40px] border border-muted/50 shadow-sm flex flex-col items-start justify-center text-left hover:border-green-500/30 transition-all duration-300 min-h-[180px]">
                                <div className="absolute top-8 left-0 right-0 flex items-center justify-center gap-2 px-4">
                                    <IconChartBar size={16} className="text-green-500" />
                                    <span className="text-sm text-muted-foreground uppercase font-black tracking-widest whitespace-nowrap">비즈니스 모델</span>
                                </div>
                                <p className="text-xl font-black leading-tight break-words mt-6">{analysis?.business_model || "구독 / 결제"}</p>
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
                                <div className="hidden sm:flex flex-col items-end opacity-40">
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Confidential</span>
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Strategy Report</span>
                                </div>
                            </div>

                            <div className="relative group">
                                <div className="absolute top-8 right-12 opacity-[0.03] select-none pointer-events-none transform rotate-12">
                                    <span className="text-[120px] font-black leading-none">PRO</span>
                                </div>
                                <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-foreground leading-relaxed bg-white dark:bg-slate-900 p-12 sm:p-16 rounded-[64px] border border-orange-200/50 dark:border-orange-900/40 shadow-2xl relative">
                                    {/* Paper texture effect */}
                                    <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/notebook.png')] rounded-[64px]" />
                                    <div className="relative z-10 font-medium leading-loose">
                                        <ReactMarkdown>{formatNarrativeText(analysis?.gtm_strategy) || "전략 수립 중입니다."}</ReactMarkdown>
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
                            <Button size="lg" className="w-full bg-primary font-black shadow-lg shadow-primary/40 h-14 rounded-2xl relative z-10 text-lg hover:scale-[1.03] active:scale-[0.97] transition-all duration-300">
                                Premium 가입하기
                            </Button>
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
                                <div className="prose prose-xl prose-blue dark:prose-invert max-w-none text-muted-foreground leading-relaxed font-medium relative z-10 flex-1">
                                    <ReactMarkdown>{formatListText(analysis?.tech_stack_suggestion) || "정보를 준비하고 있습니다."}</ReactMarkdown>
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
                                <div className="prose prose-xl prose-purple dark:prose-invert max-w-none text-muted-foreground leading-relaxed font-medium relative z-10 flex-1">
                                    <ReactMarkdown>{formatNarrativeText(analysis?.korea_localization_tips) || "정보를 준비하고 있습니다."}</ReactMarkdown>
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
                        <span className="text-2xl font-black tracking-tighter">Trend Scouter</span>
                    </div>
                    <p className="text-muted-foreground text-xs font-black uppercase tracking-widest opacity-60">
                        © 2026 Trend Scouter. Precision Analysis & Global Insights.
                    </p>
                </div>
            </footer>
        </div>
    );
}
