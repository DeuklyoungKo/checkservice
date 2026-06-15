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
    IconInfoCircle,
    IconSparkles
} from "@tabler/icons-react";
import { BookmarkButton } from "@/components/BookmarkButton";
import { AIBriefCopyButton } from "@/components/AIBriefCopyButton";
import { PolarCheckoutButton } from "@/components/PolarCheckoutButton";
import { AIBriefViewer } from "@/components/AIBriefViewer";
import { IS_BETA } from "@/lib/beta";
import { PufeReasoning } from "@/components/PufeReasoning";
import { TrendViewTracker } from "@/components/TrendViewTracker";

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
    const description = analysis?.summary || "비즈니스 기회를 분석하고 있습니다.";
    const url = `https://trend.gonsuit.com/trend/${id}`;

    return {
        title: displayTitle,
        description,
        alternates: { canonical: url },
        openGraph: {
            type: "article",
            url,
            title: displayTitle,
            description,
            siteName: "Trend Scouter",
            // og:image는 같은 폴더의 opengraph-image.tsx가 트렌드별로 동적 생성.
            publishedTime: trend.created_at,
        },
        twitter: {
            card: "summary_large_image",
            title: displayTitle,
            description,
        },
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

    const [{ data: userProfile }, { data: analysisData }, { data: bookmark }] = await Promise.all([
        user
            ? supabase.from('user_profiles').select('is_premium').eq('id', user.id).single()
            : Promise.resolve({ data: null, error: null }),
        supabase.from('analysis').select('*').eq('trend_id', id).single(),
        user
            ? supabase.from('bookmarks').select('*').eq('user_id', user.id).eq('trend_id', id).single()
            : Promise.resolve({ data: null }),
    ]);

    const analysis = analysisData;
    // 베타 기간(~ 2026-08-31) 동안 전체 공개
    const isUnlocked = true;

    // Stats-Only: Use AI-generated headline and summary directly
    const displayTitle = analysis?.headline || "분석 중인 트렌드";
    const mainSummary = analysis?.summary || "현재 비즈니스 분석이 진행 중입니다.";
    const reasoning = analysis?.reasoning || (analysis?.summary ? "데이터 기반 분석 근거가 준비되었습니다." : "분석 근거를 생성 중입니다.");

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

    // PUFE 점수 산정 근거 전용 텍스트 포맷터 (P, U, F, E 각각 줄바꿈 처리)
    const formatReasoningText = (text: string | null) => {
        if (!text) return "";
        let processed = text.trim();
        // P (Problem):, U (Urgency): 등의 패턴 앞에 줄바꿈을 넣고 굵게 처리
        processed = processed.replace(/([PUFE]\s*\([A-Za-z]+\)\s*:)/g, '\n\n**$1**');
        // 만약 괄호 없이 P:, U:, F:, E: 로만 왔을 경우 대비
        processed = processed.replace(/(?<![A-Za-z])([PUFE]\s*:)/g, '\n\n**$1**');
        return processed.trim();
    };

    // GTM 전략 전용 포맷터 (배열 형식 JSON 대응)
    const formatGtmText = (text: string | null) => {
        if (!text) return "";
        let processed = text.trim();
        if (processed.startsWith('[') && processed.endsWith(']')) {
            try {
                const parsed = JSON.parse(processed);
                if (Array.isArray(parsed)) {
                    // 줄바꿈이 포함된 리스트 형태로 가공하여 ReactMarkdown에 전달
                    return parsed.map((item: string) => `- ${item.trim()}`).join('\n\n');
                }
            } catch (e) {
                // JSON 파싱 에러 시 백업으로 일반 텍스트 변환 적용
            }
        }
        return formatNarrativeText(text);
    };

    // AI 복사용 마크다운 백필 브리프
    const fallbackBrief = `# 서비스 개발 브리프

## 아이디어 요약
${mainSummary}

## 타겟 유저
- 페르소나: 이 트렌드 분석에 관심 있는 AI 및 1인 창업 개발자
- 핵심 고통 (Pain Point): ${reasoning ? reasoning.substring(0, 300) + '...' : '수집 중'}
- 지불 의사 (Willingness to Pay): 월 3,000원 ~ 10,000원 수준의 유료 구독형 부가 기능

## MVP 핵심 기능 (3~5개)
${(analysis?.solution_wizard as any)?.steps?.map((step: string, i: number) => `${i + 1}. ${step}`).join('\n') || '1. 기본 MVP 기능 구축\n2. 사용자 인터페이스 연동\n3. 서비스 출시'}

## 추천 기술 스택
- Frontend: Next.js + Tailwind CSS
- Backend/DB: Supabase
- 결제: Polar / Stripe
- 배포: Vercel

## 예상 개발 기간
2~3일 (Claude Code, ChatGPT 등 AI 코딩 도구 사용 시)

## 수익 가능성
사이드 프로젝트 런칭을 통한 마이크로 SaaS 매출 및 프리미어 유료 모델 연동
`;

    const productId3900 = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_3900 || '';
    const productId9900 = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_9900 || '';

    const getSecureText = (text: string | null): string => {
        if (isUnlocked && text) return text;
        if (!text) return "";
        const teaser = text.trim().substring(0, 100);
        return `${teaser}... \n\n🔒 **[이후 상세 분석 내용은 결제 후 잠금 해제됩니다. 원화 3,900원으로 즉시 소장해 보세요!]**`;
    };

    const secureSteps = (steps: string[] | undefined): string[] => {
        if (!steps) return [];
        if (isUnlocked) return steps;
        return steps.map((step, i) => i === 0 ? step : "🔒 개별 리포트 결제 또는 프리미엄 구독 후 전체 실행 단계가 잠금 해제됩니다.");
    };

    const secureChecklist = (checklist: string[] | undefined): string[] => {
        if (!checklist) return [];
        if (isUnlocked) return checklist;
        return checklist.map((item, i) => i === 0 ? item : "🔒 액션 체크리스트 전체 항목 잠금 해제");
    };

    const secureTechStack = (text: string | null): string => {
        if (isUnlocked && text) return text;
        return '["Next.js", "Tailwind CSS", "Supabase", "🔒 결제 후 전체 추천 스택 해제"]';
    };

    const secureLocalizationTips = (text: string | null): string => {
        if (isUnlocked && text) return text;
        if (!text) return "";
        const tips = text.split(/\n{2,}|(?=\d+\.)/);
        return tips.map((tip, i) => i === 0 ? tip : "🔒 한국 시장 맞춤형 현지화 팁 잠금 해제").join('\n\n');
    };

    // Unlock CTA Component
    const UnlockCTA = () => (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/50 backdrop-blur-md rounded-[64px] p-8 text-center animate-in fade-in duration-700">
            <div className="bg-background/95 p-12 rounded-[56px] border-2 border-primary/20 shadow-2xl max-w-2xl space-y-8">
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
                <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">
                    <PolarCheckoutButton
                        productId={productId3900}
                        trendId={trend.id}
                        successPath={`/trend/${trend.id}?unlocked=true`}
                        className="w-full bg-primary font-black shadow-xl shadow-primary/30 h-16 rounded-2xl text-base hover:scale-105 transition-all gap-2"
                    >
                        ⚡ 개별 리포트 구매 (₩3,900)
                    </PolarCheckoutButton>
                    <PolarCheckoutButton
                        productId={productId9900}
                        successPath="/premium?subscribed=true"
                        variant="outline"
                        className="w-full font-black border-2 border-muted hover:border-primary/50 h-16 rounded-2xl text-base hover:scale-105 transition-all"
                    >
                        👑 프리미엄 구독 (₩9,900/월)
                    </PolarCheckoutButton>
                </div>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-65">
                    Polar 안전 결제 / 즉시 잠금 해제 · 프리미엄 구독 시 모든 리포트 무제한
                </p>
            </div>
        </div>
    );

    // JSON-LD: Article 스키마 (SEO·AEO)
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": displayTitle,
        "description": mainSummary,
        "datePublished": trend.created_at,
        "dateModified": trend.updated_at ?? trend.created_at,
        "author": { "@type": "Organization", "name": "Trend Scouter", "url": "https://trend.gonsuit.com" },
        "publisher": { "@type": "Organization", "name": "Trend Scouter", "url": "https://trend.gonsuit.com" },
        "mainEntityOfPage": { "@type": "WebPage", "@id": `https://trend.gonsuit.com/trend/${trend.id}` },
        "keywords": `${analysis?.pain_category || "SaaS"}, 수익형 사이드 프로젝트, AI 개발 브리프, ${trend.source}`,
        "inLanguage": "ko-KR",
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 transition-all duration-500">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <TrendViewTracker trendId={trend.id} />
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
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-400/30 px-3 py-1 text-xs font-black tracking-widest uppercase gap-1.5">
                            🎉 베타 무료 공개 · ~ 2026. 8. 31
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
                                <div className="group relative flex items-center gap-1 mb-2">
                                    <span className="text-[10px] text-primary/60 font-black uppercase tracking-widest">Pain (고통)</span>
                                    <IconInfoCircle size={12} className="text-primary/40 cursor-help" />
                                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 scale-95 transition-all group-hover:opacity-100 group-hover:scale-100 bg-foreground text-background text-xs font-bold rounded-xl p-3 shadow-xl z-50 text-center leading-relaxed">
                                        사용자 결핍의 깊이.<br />(기능적/재정적/감정적)
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-foreground"></div>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-primary">{analysis?.pufe_p || 0}</span>
                                    <span className="text-[10px] font-bold text-primary/30">/ 25</span>
                                </div>
                            </div>
                            {/* Urgency */}
                            <div className="bg-background/80 p-6 rounded-[40px] border border-muted/50 shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="group relative flex items-center gap-1 mb-2">
                                    <span className="text-[10px] text-orange-500/60 font-black uppercase tracking-widest">Urgency (긴급)</span>
                                    <IconInfoCircle size={12} className="text-orange-500/40 cursor-help" />
                                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 scale-95 transition-all group-hover:opacity-100 group-hover:scale-100 bg-foreground text-background text-xs font-bold rounded-xl p-3 shadow-xl z-50 text-center leading-relaxed">
                                        지금 당장 해결해야 하는 정도.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-foreground"></div>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-orange-500">{analysis?.pufe_u || 0}</span>
                                    <span className="text-[10px] font-bold text-orange-500/30">/ 25</span>
                                </div>
                            </div>
                            {/* Frequency */}
                            <div className="bg-background/80 p-6 rounded-[40px] border border-muted/50 shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="group relative flex items-center gap-1 mb-2">
                                    <span className="text-[10px] text-blue-500/60 font-black uppercase tracking-widest">Frequency (빈도)</span>
                                    <IconInfoCircle size={12} className="text-blue-500/40 cursor-help" />
                                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 scale-95 transition-all group-hover:opacity-100 group-hover:scale-100 bg-foreground text-background text-xs font-bold rounded-xl p-3 shadow-xl z-50 text-center leading-relaxed">
                                        얼마나 자주 발생하는 문제인가.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-foreground"></div>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-blue-500">{analysis?.pufe_f || 0}</span>
                                    <span className="text-[10px] font-bold text-blue-500/30">/ 25</span>
                                </div>
                            </div>
                            {/* Existing Solution */}
                            <div className="bg-background/80 p-6 rounded-[40px] border border-muted/50 shadow-sm flex flex-col items-center justify-center text-center">
                                <div className="group relative flex items-center gap-1 mb-2">
                                    <span className="text-[10px] text-green-500/60 font-black uppercase tracking-widest">Existing (대안)</span>
                                    <IconInfoCircle size={12} className="text-green-500/40 cursor-help" />
                                    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 scale-95 transition-all group-hover:opacity-100 group-hover:scale-100 bg-foreground text-background text-xs font-bold rounded-xl p-3 shadow-xl z-50 text-center leading-relaxed">
                                        현재의 대안이 얼마나 불편하거나 비싼가.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-foreground"></div>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-green-500">{analysis?.pufe_e || 0}</span>
                                    <span className="text-[10px] font-bold text-green-500/30">/ 25</span>
                                </div>
                            </div>
                        </div>

                        {/* Summary Score & Category (Full Width) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative bg-background/80 px-10 py-6 rounded-[40px] border border-primary/20 shadow-sm flex items-center justify-between">
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">종합 PUFE 스코어</span>
                                <span className="text-3xl font-black text-primary">{analysis?.pufe_total || 0} <span className="text-xs font-bold opacity-30">PTS</span></span>
                            </div>
                            <div className="relative bg-background/80 px-10 py-6 rounded-[40px] border border-muted/50 shadow-sm flex items-center justify-between">
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Pain Point 유형</span>
                                <Badge className="rounded-full px-4 py-1.5 bg-primary/10 text-primary font-black border-none text-xs">
                                    {analysis?.pain_category || 'General'} Pain
                                </Badge>
                            </div>
                            <div className="relative bg-background/80 px-10 py-6 rounded-[40px] border border-muted/50 shadow-sm flex items-center justify-between">
                                <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">AI 개발 난이도</span>
                                <div className="flex items-center gap-1.5">
                                    {(() => {
                                        const score = analysis?.ai_buildability_score || (analysis?.pufe_u ? (analysis.pufe_u > 18 ? 4 : analysis.pufe_u > 10 ? 3 : 2) : 2);
                                        const labels = ["하루 (초간단)", "2-3일 (간단 SaaS)", "1주일 (일반 SaaS)", "2주일 (실시간/보안)", "1개월+ (복잡)"];
                                        const colors = ["bg-green-500 border-green-500 shadow-green-500/20", "bg-emerald-500 border-emerald-500 shadow-emerald-500/20", "bg-blue-500 border-blue-500 shadow-blue-500/20", "bg-orange-500 border-orange-500 shadow-orange-500/20", "bg-rose-500 border-rose-500 shadow-rose-500/20"];
                                        const colorClass = colors[score - 1] || colors[1];
                                        return (
                                            <>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map((index) => (
                                                        <div
                                                            key={index}
                                                            className={`w-2.5 h-4 rounded-[3px] border ${
                                                                index <= score
                                                                    ? `${colorClass} shadow-md`
                                                                    : 'bg-muted/20 border-muted/40'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-xs font-black text-foreground/80 ml-1.5 uppercase">
                                                    {labels[score - 1] || labels[1]}
                                                </span>
                                            </>
                                        );
                                    })()}
                                </div>
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
                                <ReactMarkdown>{formatNarrativeText(mainSummary) || "분석 데이터를 불러오고 있습니다."}</ReactMarkdown>
                            </div>
                        </section>

                        <div className={`relative ${isUnlocked ? "" : "max-h-[480px] overflow-hidden rounded-[64px] shadow-sm bg-gradient-to-b from-transparent to-background/95 pb-20"}`}>
                            {/* Premium Masking Layer */}
                            <div className={isUnlocked ? "" : "blur-3xl select-none pointer-events-none opacity-40 grayscale transition-all duration-1000"}>
                                {/* 2. AI 개발 브리프 (Prompt Brief) */}
                                <section className="group/brief mb-24">
                                    {/* 섹션 헤더 */}
                                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-primary rounded-[24px] flex items-center justify-center shadow-lg shadow-primary/30 group-hover/brief:scale-110 transition-transform duration-500 flex-shrink-0">
                                                <IconSparkles className="text-primary-foreground w-7 h-7" />
                                            </div>
                                            <div>
                                                <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em] opacity-60">AI Ready Brief</p>
                                                <h2 className="text-3xl font-black tracking-tighter">AI 개발 브리프</h2>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <div className="flex items-center gap-2 bg-muted/60 border border-muted px-3 py-1.5 rounded-xl text-xs font-bold text-muted-foreground">
                                                <span className="opacity-60">추천:</span>
                                                <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Claude</a>
                                                <span className="opacity-30">|</span>
                                                <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">ChatGPT</a>
                                            </div>
                                            <AIBriefCopyButton briefText={analysis?.ai_brief || fallbackBrief} trendId={trend.id} />
                                        </div>
                                    </div>

                                    {/* 마크다운 뷰어 카드 */}
                                    <div className="bg-background border border-muted rounded-[40px] overflow-hidden shadow-sm">
                                        {/* 상단 바 */}
                                        <div className="flex items-center gap-2 px-6 py-4 border-b border-muted bg-muted/30">
                                            <div className="w-3 h-3 rounded-full bg-red-400/60" />
                                            <div className="w-3 h-3 rounded-full bg-yellow-400/60" />
                                            <div className="w-3 h-3 rounded-full bg-green-400/60" />
                                            <span className="ml-3 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">prompt-brief.md</span>
                                        </div>
                                        {/* 본문 */}
                                        <div className="p-8 sm:p-10">
                                            <AIBriefViewer content={getSecureText(analysis?.ai_brief || fallbackBrief)} />
                                        </div>
                                    </div>
                                </section>

                                {/* 3. Reasoning */}
                                <section className="space-y-6 bg-muted/20 p-12 rounded-[64px] border border-muted-foreground/5 shadow-sm group/reasoning mb-24">
                                    <div className="flex items-center gap-6 mb-2">
                                        <div className="w-16 h-16 bg-primary rounded-[28px] flex items-center justify-center shadow-xl shadow-primary/30 group-hover/reasoning:scale-110 transition-transform duration-500">
                                            <IconTarget className="text-primary-foreground w-8 h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-black tracking-tighter">점수 부여 상세 근거</h2>
                                            <p className="text-sm text-muted-foreground mt-1 font-medium">PUFE 각 항목의 점수 산출 근거입니다</p>
                                        </div>
                                    </div>
                                    <PufeReasoning text={getSecureText(reasoning)} />
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
                                        <ReactMarkdown>{formatGtmText(getSecureText(analysis?.gtm_strategy)) || "해당 트렌드의 한국 시장 진출 전략을 분석 중입니다."}</ReactMarkdown>
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
                                            {secureSteps((analysis?.solution_wizard as any)?.steps)?.map((step: string, i: number) => (
                                                <div key={i} className="flex gap-4 p-6 bg-background rounded-3xl border border-muted shadow-sm">
                                                    <span className="text-2xl font-black text-primary/20">0{i + 1}</span>
                                                    <p className="text-sm font-bold leading-relaxed">{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-primary/10 p-10 rounded-[48px] border border-primary/20 h-fit">
                                            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                                                <IconRocket size={20} className="text-primary" /> 액션 체크리스트
                                            </h3>
                                            <div className="space-y-4">
                                                {secureChecklist((analysis?.solution_wizard as any)?.checklist)?.map((item: string, i: number) => (
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

                        {!userProfile?.is_premium && !IS_BETA && (
                            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background border-2 border-primary/20 rounded-[48px] p-8 shadow-xl shadow-primary/5 relative overflow-hidden group">
                                <div className="relative z-10 space-y-1 mb-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Premium Membership</p>
                                    <h3 className="font-black text-xl leading-snug tracking-tighter">
                                        완벽한 타이밍을<br />놓치지 마세요.
                                    </h3>
                                    <p className="text-xs text-muted-foreground font-medium pt-0.5">모든 리포트 무제한 열람</p>
                                </div>
                                <PolarCheckoutButton
                                    productId={productId9900}
                                    successPath="/premium?subscribed=true"
                                    className="w-full bg-primary font-bold shadow-md shadow-primary/10 h-9 rounded-full relative z-10 text-sm hover:scale-[1.02] transition-all duration-300 gap-2"
                                >
                                    👑 구독하기 · ₩9,900/월
                                </PolarCheckoutButton>
                            </div>
                        )}
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
                                    {cleanTechStack(secureTechStack(analysis?.tech_stack_suggestion)).length > 0 ? (
                                        cleanTechStack(secureTechStack(analysis?.tech_stack_suggestion)).map((item, i) => (
                                            <span key={i} className="px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-semibold">{item}</span>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground opacity-60">추천 기술 스택을 분석 중입니다.</p>
                                    )}
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
                                    {secureLocalizationTips(analysis?.korea_localization_tips) ? (
                                        secureLocalizationTips(analysis?.korea_localization_tips).split(/\n{2,}|(?=\d+\.)/).map((para: string, i: number) => (
                                            <div key={i} className="flex gap-3">
                                                <span className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/15 flex items-center justify-center text-xs font-black text-purple-600 dark:text-purple-400">{i + 1}</span>
                                                <p className="text-sm leading-relaxed text-foreground/80 font-medium">{para.replace(/^\d+\.\s*/, '').trim()}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground opacity-60">현지화 포인트를 분석 중입니다.</p>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                </div>

                {/* 🛡️ 파트너 및 배포 인프라 제휴 (Affiliate & Partner Links) */}
                <div className="mt-16 bg-muted/10 p-12 rounded-[56px] border border-muted/30 shadow-inner">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="text-center space-y-2">
                            <span className="text-[10px] text-primary/60 font-black uppercase tracking-[0.2em]">Affiliate Partners</span>
                            <h3 className="text-3xl font-black tracking-tighter">추천 인프라 및 도구</h3>
                            <p className="text-sm text-muted-foreground font-medium">사이드 프로젝트를 즉시 배포하고 결제를 연동하기 위해 최적화된 도구 파트너십입니다.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                            {/* Vercel */}
                            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="group/vercel bg-background hover:bg-black hover:text-white border border-muted hover:border-black p-8 rounded-[40px] shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between space-y-6">
                                <div className="space-y-3">
                                    <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center font-bold text-xl transition-transform group-hover/vercel:-rotate-6">▲</div>
                                    <h4 className="font-black text-lg">Vercel</h4>
                                    <p className="text-xs text-muted-foreground group-hover/vercel:text-white/80 leading-relaxed font-medium">AI 기반 프론트엔드 제품을 초고속으로 배포하고 최적화할 수 있는 업계 표준 인프라입니다.</p>
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-primary group-hover/vercel:text-white/90 flex items-center gap-1.5 pt-2">
                                    배포 플랫폼 바로가기 <IconExternalLink size={14} />
                                </span>
                            </a>
                            
                            {/* Supabase */}
                            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="group/supabase bg-background hover:bg-emerald-950/20 border border-muted hover:border-emerald-500/30 p-8 rounded-[40px] shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between space-y-6">
                                <div className="space-y-3">
                                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center font-bold text-xl transition-transform group-hover/supabase:scale-110">⚡</div>
                                    <h4 className="font-black text-lg group-hover/supabase:text-emerald-500">Supabase</h4>
                                    <p className="text-xs text-muted-foreground group-hover/supabase:text-foreground/80 leading-relaxed font-medium">사용자 인증(Auth) 및 AI 벡터 데이터베이스, 실시간 CRUD 인스턴스를 즉시 구축하세요.</p>
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-primary group-hover/supabase:text-emerald-500 flex items-center gap-1.5 pt-2">
                                    DB 구축 바로가기 <IconExternalLink size={14} />
                                </span>
                            </a>
                            
                            {/* Polar */}
                            <a href="https://polar.sh" target="_blank" rel="noopener noreferrer" className="group/polar bg-background hover:bg-blue-950/20 border border-muted hover:border-blue-500/30 p-8 rounded-[40px] shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between space-y-6">
                                <div className="space-y-3">
                                    <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center font-bold text-xl transition-transform group-hover/polar:scale-110">❄️</div>
                                    <h4 className="font-black text-lg group-hover/polar:text-blue-500">Polar.sh</h4>
                                    <p className="text-xs text-muted-foreground group-hover/polar:text-foreground/80 leading-relaxed font-medium">Stripe 기반의 오픈소스 PG 솔루션으로, 1인 개발자가 가장 간편하게 글로벌 마이크로 결제를 연동하는 방법입니다.</p>
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest text-primary group-hover/polar:text-blue-500 flex items-center gap-1.5 pt-2">
                                    결제 솔루션 바로가기 <IconExternalLink size={14} />
                                </span>
                            </a>
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
