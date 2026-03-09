"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconMail, IconLoader2, IconCircleCheck } from "@tabler/icons-react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    const supabase = createClient();

    try {
      const { error: supabaseError } = await supabase
        .from("newsletter_subscribers")
        .insert([{ email }]);

      if (supabaseError) {
        if (supabaseError.code === "23505") {
          setStatus("success");
          setMessage("이미 구독 중인 이메일입니다!");
        } else {
          // 상세 에러 로깅
          console.error("Supabase Error Details:", {
            code: supabaseError.code,
            message: supabaseError.message,
            details: supabaseError.details,
            hint: supabaseError.hint
          });
          throw new Error(supabaseError.message || "데이터베이스 오류가 발생했습니다.");
        }
      } else {
        setStatus("success");
        setMessage("성공적으로 구독되었습니다. 감사합니다!");
        setEmail("");
      }
    } catch (err: any) {
      console.error("Newsletter subscription error:", err);
      setStatus("error");
      setMessage(err.message || "오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {status === "success" ? (
        <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-primary/5 border border-primary/20 rounded-3xl animate-in fade-in zoom-in duration-500">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <IconCircleCheck className="text-primary w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-primary">구독 완료!</h3>
          <p className="text-center text-muted-foreground text-sm leading-relaxed px-4">
            {message}
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setStatus("idle")}
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            다른 이메일로 구독하기
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
              <IconMail size={18} />
            </div>
            <Input
              type="email"
              placeholder="이메일 주소를 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === "loading"}
              className="pl-12 h-14 bg-background/50 border-muted-foreground/20 rounded-2xl focus:ring-primary/30 transition-all text-base"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={status === "loading" || !email}
            className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {status === "loading" ? (
              <span className="flex items-center gap-2">
                <IconLoader2 className="animate-spin" size={20} />
                처리 중...
              </span>
            ) : (
              "지금 무료 구독하기"
            )}
          </Button>
          
          {status === "error" && (
            <p className="text-destructive text-xs font-bold text-center animate-shake">
              {message}
            </p>
          )}
          
          <p className="text-[10px] text-center text-muted-foreground font-medium opacity-60">
            * 언제든 구독을 취소하실 수 있습니다. 스팸 메일은 보내지 않습니다.
          </p>
        </form>
      )}
    </div>
  );
}
