/**
 * [PHASE 2 - 차후 보완 오픈 예정]
 *
 * 이 페이지(아이디어 컨버터 위저드)는 현재 개발 보류 상태입니다.
 * PHASE 1 (트렌드 리포트 수익화 검증) 완료 후 정식 오픈 예정입니다.
 *
 * 진행 조건:
 *   - Polar 유료 전환 첫 1건 달성
 *   - 월 활성 사용자(MAU) 300명 이상 확보
 *   - 현 프로토타입에 대한 사용자 피드백 수집 완료
 *
 * 참조: 1.PRD.md > [PHASE 2 - 차후 개발 예정] 아이디어 컨버터 위저드
 */
'use client'

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
    IconBulb, 
    IconRocket, 
    IconSparkles, 
    IconCheck, 
    IconArrowLeft,
    IconLoader2,
    IconLock,
    IconExternalLink
} from "@tabler/icons-react";
import Link from "next/link";
import { analyzeUserIdea } from "@/app/actions/wizard";

export default function WizardPage() {
    const [status, setStatus] = useState<'idle' | 'analyzing' | 'completed'>('idle');
    const [input, setInput] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loadingMessage, setLoadingMessage] = useState('아이디어를 분석하고 있습니다...');

    const loadingMessages = [
        "결핍(Pain)의 깊이를 측정하는 중...",
        "해결 시급성(Urgency)을 판단하고 있습니다...",
        "시장 발생 빈도(Frequency)를 분석 중입니다...",
        "기존 대안(Existing)의 불편함을 조사 중...",
        "최적의 3단계 해결 솔루션을 설계하고 있습니다...",
        "Vibe Coding용 맞춤 기획서를 생성 중입니다..."
    ];

    useEffect(() => {
        if (status === 'analyzing') {
            let i = 0;
            const interval = setInterval(() => {
                setLoadingMessage(loadingMessages[i % loadingMessages.length]);
                i++;
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [status]);

    const handleAnalyze = async () => {
        if (!input.trim() || input.length < 10) return;
        
        setStatus('analyzing');
        try {
            const data = await analyzeUserIdea(input);
            setResult(data);
            setStatus('completed');
        } catch (error) {
            console.error(error);
            alert("분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
            setStatus('idle');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans pb-20 selection:bg-primary/20 transition-all duration-500">
            {/* Navigation */}
            <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                            <IconBulb className="text-primary-foreground w-6 h-6" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-primary">Trend Intelligence</span>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2 rounded-full font-bold">
                            <IconArrowLeft size={18} />
                            대시보드로 돌아가기
                        </Button>
                    </Link>
                </div>
            </nav>

            <main className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
                {status === 'idle' && (
                    <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="text-center space-y-6">
                            <Badge variant="secondary" className="bg-primary/10 text-primary px-4 py-1.5 text-xs font-black tracking-[0.2em] uppercase rounded-full">
                                <IconSparkles size={14} className="mr-2" />
                                Your Idea, Built on Data
                            </Badge>
                            <h1 className="text-5xl sm:text-6xl font-black tracking-tighter leading-tight">
                                어떤 결핍을<br />
                                해결하고 싶으신가요?
                            </h1>
                            <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                                해결하고 싶은 일상의 불편함이나 관찰한 페인포인트를 알려주세요.<br />
                                AI가 즉시 PUFE 프레임워크로 수익성을 분석해 드립니다.
                            </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-8 rounded-[48px] border-2 border-primary/20 shadow-2xl space-y-6">
                            <Textarea 
                                placeholder="예: '주말에만 카페를 빌리고 싶은데, 예약 과정이 너무 복잡하고 가격이 투명하지 않아요.'"
                                className="min-h-[200px] text-xl font-medium p-6 rounded-[32px] border-none focus-visible:ring-0 resize-none bg-muted/30"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <div className="flex justify-between items-center">
                                <span className={`text-sm font-bold ${input.length < 10 ? 'text-muted-foreground' : 'text-primary'}`}>
                                    {input.length} / 최소 10자
                                </span>
                                <Button 
                                    size="lg" 
                                    className="rounded-full px-12 h-16 text-xl font-black shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                    disabled={input.length < 10}
                                    onClick={handleAnalyze}
                                >
                                    무료 분석 시작하기
                                    <IconRocket className="ml-2" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'analyzing' && (
                    <div className="max-w-3xl mx-auto py-32 text-center space-y-8 animate-in fade-in duration-500">
                        <div className="relative inline-block">
                            <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
                            <IconSparkles className="absolute inset-0 m-auto text-primary w-8 h-8 animate-pulse" />
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-3xl font-black tracking-tight">{loadingMessage}</h2>
                            <p className="text-muted-foreground font-bold">평균 15초 정도 소요됩니다.</p>
                        </div>
                    </div>
                )}

                {status === 'completed' && result && (
                    <div className="space-y-16 animate-in fade-in zoom-in-95 duration-700">
                        {/* 1. Header & Result Badge */}
                        <div className="text-center space-y-4">
                            <Badge className="rounded-full px-6 py-1.5 bg-primary/10 text-primary border-none text-xs font-black uppercase tracking-widest">
                                Analysis Result: {result.pain_category} Pain
                            </Badge>
                            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter">분석 리포트가 완성되었습니다</h1>
                        </div>

                        {/* 2. PUFE Dashboard (Refactored from Detail Page) */}
                        <div className="bg-primary/5 p-8 rounded-[56px] border border-primary/10 shadow-sm backdrop-blur-sm space-y-6">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <ScoreCard label="Pain (고통)" value={result.pufe.p} color="text-primary" />
                                <ScoreCard label="Urgency (긴급)" value={result.pufe.u} color="text-orange-500" />
                                <ScoreCard label="Frequency (빈도)" value={result.pufe.f} color="text-blue-500" />
                                <ScoreCard label="Existing (대안)" value={result.pufe.e} color="text-green-500" />
                            </div>
                            <div className="bg-background/80 px-10 py-6 rounded-[40px] border border-primary/20 shadow-sm flex items-center justify-between">
                                <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">종합 PUFE 스코어</span>
                                <span className="text-4xl font-black text-primary">{result.totalScore} <span className="text-xs font-bold opacity-30">PTS</span></span>
                            </div>
                        </div>

                        {/* 3. Success Steps */}
                        <section className="space-y-8">
                            <h3 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                                    <IconCheck size={24} />
                                </div>
                                실행 전략 타임라인
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {result.solution_wizard.steps.map((step: string, i: number) => (
                                    <Card key={i} className="rounded-[40px] border-2 border-muted hover:border-primary/30 transition-all p-8 space-y-4 shadow-sm">
                                        <span className="text-4xl font-black text-primary/10">0{i+1}</span>
                                        <p className="font-bold text-lg leading-snug">{step}</p>
                                    </Card>
                                ))}
                            </div>
                        </section>

                        {/* 4. Booster Package (Locked) */}
                        <section className="relative group overflow-hidden bg-foreground text-background p-12 sm:p-16 rounded-[64px] shadow-2xl border-4 border-primary/20">
                            <div className="relative z-10 space-y-12">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-primary rounded-[28px] flex items-center justify-center shadow-2xl">
                                        <IconLock className="text-primary-foreground w-8 h-8" />
                                    </div>
                                    <div>
                                        <p className="text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-1.5 opacity-60">Premium Access Only</p>
                                        <h2 className="text-4xl font-black tracking-tighter">비즈니스 부스터 패키지</h2>
                                    </div>
                                </div>

                                {/* Blurred Content Preview */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 opacity-30 blur-sm pointer-events-none select-none">
                                    <div className="space-y-4">
                                        <h4 className="text-xl font-black">📊 린 캔버스 모델</h4>
                                        <div className="h-40 bg-background/10 rounded-3xl" />
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xl font-black">🚀 Vibe Coding 기획서 (.md)</h4>
                                        <div className="h-40 bg-background/10 rounded-3xl" />
                                    </div>
                                </div>

                                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 space-y-8 bg-black/40 backdrop-blur-sm rounded-[64px]">
                                    <div className="text-center space-y-4 px-6">
                                        <h3 className="text-3xl font-black tracking-tight text-white">아이디어를 실제로 실현할 도구가 준비되었습니다</h3>
                                        <p className="text-lg text-white/70 font-medium">아이디어 검증 패키지를 해제하고 린 캔버스와 Vibe Coding 기획서를 즉시 받으세요.</p>
                                    </div>
                                    <Link href="https://polar.sh/your-checkout-link" target="_blank" rel="noopener noreferrer">
                                        <Button size="lg" className="h-20 px-12 rounded-full text-2xl font-black bg-primary text-primary-foreground shadow-2xl hover:scale-105 active:scale-95 transition-all gap-3 border-none">
                                            $3로 아이디어 검증 패스 해제하기
                                            <IconExternalLink size={24} />
                                        </Button>
                                    </Link>
                                    <p className="text-white/40 text-xs font-black uppercase tracking-widest">Secured by Polar / Stripe</p>
                                </div>
                            </div>
                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}

function ScoreCard({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div className="bg-background/80 p-6 rounded-[40px] border border-muted/50 shadow-sm flex flex-col items-center justify-center text-center">
            <span className={`text-[10px] ${color} font-black uppercase tracking-widest mb-2`}>{label}</span>
            <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-black ${color}`}>{value || 0}</span>
                <span className={`text-[10px] font-bold ${color} opacity-30`}>/ 25</span>
            </div>
        </div>
    );
}
