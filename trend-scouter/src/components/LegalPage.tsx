import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

export function LegalPage({
    titleKo,
    titleEn,
    effectiveDate,
    children,
}: {
    titleKo: string;
    titleEn: string;
    effectiveDate: string;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans">
            <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-10"
                >
                    <IconArrowLeft size={16} /> 홈으로 / Home
                </Link>
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-1">{titleKo}</h1>
                <p className="text-lg text-muted-foreground font-bold mb-3">{titleEn}</p>
                <p className="text-xs text-muted-foreground mb-12">
                    최종 수정일 / Last updated: {effectiveDate}
                </p>
                <div className="space-y-10">{children}</div>

                {/* 서비스 제공자 / Service Provider */}
                <section className="mt-16 pt-8 border-t border-muted text-xs text-muted-foreground space-y-1">
                    <p className="font-bold text-foreground mb-2">서비스 제공자 / Service Provider</p>
                    <p>서비스명 / Service: Trend Scouter (trend.gonsuit.com)</p>
                    <p>상호 / Business Name: 고앤슈트(Gonsuit)</p>
                    <p>대표자 / Representative: 고득용</p>
                    <p>사업자등록번호 / Business Reg. No.: 545-01-03981</p>
                    <p>주소 / Address: 경기도 시흥시 수인로3247번길 34</p>
                    <p>이메일 / Email: trend@gonsuit.com</p>
                </section>
            </main>
        </div>
    );
}

export function LegalSection({
    n,
    titleKo,
    titleEn,
    children,
}: {
    n: number;
    titleKo: string;
    titleEn: string;
    children: React.ReactNode;
}) {
    return (
        <section>
            <h2 className="text-lg font-black mb-3">
                {n}. {titleKo}{" "}
                <span className="text-muted-foreground font-medium text-base">/ {titleEn}</span>
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </section>
    );
}

/** 한국어 본문 + 영문 병기 한 쌍 */
export function Bi({ ko, en }: { ko: string; en: string }) {
    return (
        <div className="space-y-1">
            <p className="text-foreground/90">{ko}</p>
            <p className="text-muted-foreground/70 italic">{en}</p>
        </div>
    );
}
