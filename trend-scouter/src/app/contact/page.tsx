"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Send, CheckCircle2, Phone, Clock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    IconBulb,
    IconArrowRight,
} from "@tabler/icons-react";

export default function ContactPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get("name"),
            email: formData.get("email"),
            category: formData.get("category"),
            subject: formData.get("subject"),
            message: formData.get("message"),
        };

        try {
            const response = await fetch("/api/contact", {
                method: "POST",
                body: JSON.stringify(data),
                headers: { "Content-Type": "application/json" },
            });

            if (response.ok) setIsSubmitted(true);
            else alert("알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
        } catch (error) {
            console.error("Error submitting form:", error);
            alert("전송 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">

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
                            <Button variant="outline" size="sm" className="gap-2 rounded-full font-bold">
                                대시보드로 이동
                                <IconArrowRight size={16} />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="relative overflow-hidden pt-20 pb-16 sm:pt-28 sm:pb-20 border-b bg-muted/20">
                <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <Badge variant="outline" className="mb-6 px-4 py-1 text-primary border-primary/30 bg-primary/5 gap-2 uppercase tracking-widest font-bold">
                        <Mail size={14} />
                        Business Inquiry
                    </Badge>
                    <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                        협업 및 맞춤형<br />
                        <span className="text-primary italic">리포트 문의</span>
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl">
                        SaaS/AI 시장 진입 전략부터 특정 산업별 심층 데이터까지,
                        필요한 인사이트가 있다면 언제든 편하게 문의해 주세요.
                    </p>

                    {/* Info Cards */}
                    <div className="mt-10 flex flex-wrap gap-4">
                        <div className="flex items-center gap-3 bg-background border border-border/50 rounded-full px-5 py-2.5 shadow-sm">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold">업무일 기준 24시간 이내 회신</span>
                        </div>
                        <div className="flex items-center gap-3 bg-background border border-border/50 rounded-full px-5 py-2.5 shadow-sm">
                            <MessageCircle className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold">한국어 / 영어 모두 가능</span>
                        </div>
                        <div className="flex items-center gap-3 bg-background border border-border/50 rounded-full px-5 py-2.5 shadow-sm">
                            <Phone className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold">trend@gonsuit.com</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-20 items-start">

                    {/* Left: Category Cards */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-black mb-6">어떤 분야인가요?</h2>

                        {[
                            { icon: "📊", title: "맞춤형 심층 리포트", desc: "특정 산업 또는 경쟁사 분석 데이터 의뢰" },
                            { icon: "🔗", title: "데이터 API 연동", desc: "트렌드 데이터 스트림을 외부 시스템에 통합" },
                            { icon: "🧠", title: "비즈니스 컨설팅", desc: "AI/SaaS 아이디어 검증 및 전략 수립" },
                            { icon: "🤝", title: "제휴 및 협업", desc: "파트너십, 기술 협력, 콘텐츠 공동 기획" },
                        ].map(({ icon, title, desc }) => (
                            <div
                                key={title}
                                className="flex items-start gap-4 p-5 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-default group"
                            >
                                <span className="text-2xl mt-0.5">{icon}</span>
                                <div>
                                    <p className="font-black text-sm group-hover:text-primary transition-colors">{title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Right: Form */}
                    <div className="lg:col-span-3">
                        {isSubmitted ? (
                            <div className="flex flex-col items-center justify-center text-center py-20 bg-card rounded-3xl border border-border/50 animate-in fade-in zoom-in duration-500">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
                                    <CheckCircle2 className="h-10 w-10" />
                                </div>
                                <h3 className="text-2xl font-black mb-3">문의가 접수되었습니다!</h3>
                                <p className="text-muted-foreground max-w-sm font-medium">
                                    검토 후 업무일 기준 24시간 이내에 입력하신 이메일로 답변드리겠습니다.
                                </p>
                                <Link href="/">
                                    <Button className="mt-8 font-bold px-8 h-12 rounded-xl">
                                        홈으로 돌아가기
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="bg-card border border-border/50 shadow-sm rounded-3xl p-8 md:p-10">
                                <h2 className="text-xl font-black mb-8">문의 내용 작성</h2>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-6 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <label htmlFor="name" className="text-sm font-bold text-foreground/80">
                                                이름 / 회사명 <span className="text-destructive">*</span>
                                            </label>
                                            <Input
                                                id="name"
                                                name="name"
                                                required
                                                placeholder="ex) 홍길동 / 고앤슈트"
                                                className="h-12 rounded-xl bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/30"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label htmlFor="email" className="text-sm font-bold text-foreground/80">
                                                회신받을 이메일 <span className="text-destructive">*</span>
                                            </label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                required
                                                placeholder="name@company.com"
                                                className="h-12 rounded-xl bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/30"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="category" className="text-sm font-bold text-foreground/80">
                                            문의 항목 <span className="text-destructive">*</span>
                                        </label>
                                        <select
                                            id="category"
                                            name="category"
                                            required
                                            defaultValue=""
                                            className="flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 appearance-none"
                                        >
                                            <option value="" disabled>항목을 선택해주세요</option>
                                            <option value="custom_report">특정 산업 맞춤형 심층 리포트 의뢰</option>
                                            <option value="api_data">트렌드 데이터 API 연동 문의</option>
                                            <option value="consulting">AI/SaaS 비즈니스 기획 컨설팅</option>
                                            <option value="partnership">기타 제휴 및 협업</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="text-sm font-bold text-foreground/80">
                                            제목 <span className="text-destructive">*</span>
                                        </label>
                                        <Input
                                            id="subject"
                                            name="subject"
                                            required
                                            placeholder="문의 내용을 간략히 요약해주세요"
                                            className="h-12 rounded-xl bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/30"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="message" className="text-sm font-bold text-foreground/80">
                                            상세 내용 <span className="text-destructive">*</span>
                                        </label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            required
                                            rows={6}
                                            placeholder="구체적인 필요 사항이나 궁금하신 점을 자유롭게 적어주세요."
                                            className="flex w-full rounded-xl border border-muted-foreground/20 bg-background/50 px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-y"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full h-14 rounded-xl text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all"
                                    >
                                        {loading ? (
                                            <span className="flex items-center gap-2">전송 중...</span>
                                        ) : (
                                            <span className="flex items-center gap-2">
                                                문의 제출하기 <Send className="h-4 w-4 ml-1" />
                                            </span>
                                        )}
                                    </Button>
                                    <p className="text-center text-xs text-muted-foreground/60">
                                        제출하신 정보는 1:1 상담 목적으로만 사용되며, 동의 없이 외부에 제공되지 않습니다.
                                    </p>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t py-16 bg-muted/50 text-center mt-8">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2 opacity-50">
                            <IconBulb size={24} />
                            <span className="text-lg font-bold">Trend Intelligence</span>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            © 2026 Trend Intelligence. Built with Precision & AI.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
