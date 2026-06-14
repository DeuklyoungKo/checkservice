"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { IconMail, IconCheck, IconLoader2 } from "@tabler/icons-react";
import { trackEvent } from "@/lib/analytics";

export function BetaEmailSignup() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setStatus("loading");

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: "베타 참여 신청",
                    email,
                    category: "beta",
                    subject: "[베타 신청] Trend Scouter 베타 참여 등록",
                    message: `베타 참여 신청 이메일: ${email}\n\n베타 기간 종료(2026-08-31) 후 유료 전환 안내를 받겠습니다.`,
                }),
            });

            if (res.ok) {
                setStatus("done");
                trackEvent("beta_email_signup");
            } else {
                setStatus("error");
            }
        } catch {
            setStatus("error");
        }
    };

    if (status === "done") {
        return (
            <div className="flex items-center justify-center gap-3 bg-green-500/10 border border-green-500/30 rounded-2xl px-6 py-4 text-green-600 dark:text-green-400 font-bold">
                <IconCheck size={20} />
                등록 완료! 베타 종료 시 안내 메일을 보내드립니다.
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full">
            <div className="relative flex-1">
                <IconMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="이메일 주소를 입력하세요"
                    required
                    className="w-full pl-10 pr-4 h-12 rounded-2xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
            </div>
            <Button
                type="submit"
                disabled={status === "loading"}
                className="h-12 px-6 rounded-2xl font-bold flex-shrink-0 gap-2"
            >
                {status === "loading" ? (
                    <IconLoader2 size={16} className="animate-spin" />
                ) : (
                    <IconMail size={16} />
                )}
                베타 참여 등록
            </Button>
            {status === "error" && (
                <p className="text-xs text-red-500 mt-1 text-center w-full">전송 실패. 다시 시도해 주세요.</p>
            )}
        </form>
    );
}
