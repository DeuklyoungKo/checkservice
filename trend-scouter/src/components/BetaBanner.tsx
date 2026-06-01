import Link from "next/link";
import { IconFlask, IconArrowRight } from "@tabler/icons-react";

export function BetaBanner() {
    return (
        <div className="w-full bg-amber-500 text-amber-950 py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-bold z-50 relative">
            <IconFlask size={16} className="flex-shrink-0" />
            <span>
                🎉 베타 서비스 운영 중 — 2026년 8월 31일까지 모든 분석 데이터를{" "}
                <strong>무료</strong>로 이용하실 수 있습니다.
            </span>
            <Link
                href="/contact"
                className="hidden sm:flex items-center gap-1 underline underline-offset-2 hover:text-amber-900 transition-colors flex-shrink-0"
            >
                피드백 남기기
                <IconArrowRight size={14} />
            </Link>
        </div>
    );
}
