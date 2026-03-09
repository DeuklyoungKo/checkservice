"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconLoader2, IconCircleCheck, IconCreditCard } from "@tabler/icons-react";

interface PaymentConfirmationFormProps {
  defaultPlan?: string;
  defaultAmount?: string;
}

export function PaymentConfirmationForm({ defaultPlan, defaultAmount }: PaymentConfirmationFormProps) {
  const [formData, setFormData] = useState({
    customer_name: "",
    contact_info: "",
    amount: defaultAmount || "",
    notes: defaultPlan ? `[신청 플랜: ${defaultPlan}]` : "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const { error } = await supabase.from("payment_requests").insert([
        {
          user_id: user?.id,
          customer_name: formData.customer_name,
          contact_info: formData.contact_info,
          amount: parseInt(formData.amount.replace(/[^0-9]/g, "")),
          notes: formData.notes,
        },
      ]);

      if (error) throw error;
      setStatus("success");
    } catch (error) {
      console.error("Payment confirmation error:", error);
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <Card className="border-primary/20 bg-primary/5 rounded-[32px] overflow-hidden">
        <CardContent className="pt-10 pb-10 text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <IconCircleCheck className="text-primary w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-black text-primary tracking-tighter">입금 확인 요청 완료!</CardTitle>
          <CardDescription className="text-base text-muted-foreground font-medium">
            입금 내역 확인 후 1~2시간 이내에 <br />
            프리미엄 권한이 부여됩니다. (최대 24시간 소요)
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-[40px] shadow-2xl border-muted/50 overflow-hidden">
      <CardHeader className="bg-muted/30 pb-8 pt-8">
        <div className="flex items-center gap-3 mb-2">
          <IconCreditCard className="text-primary" size={24} />
          <CardTitle className="text-xl font-black tracking-tight">입금 확인 요청</CardTitle>
        </div>
        <CardDescription className="font-medium">송금하신 후 아래 정보를 입력해 주세요.</CardDescription>
      </CardHeader>
      <CardContent className="pt-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="customer_name" className="font-bold text-xs uppercase tracking-widest opacity-60">입금자명</Label>
            <Input
              id="customer_name"
              name="customer_name"
              placeholder="예: 홍길동"
              required
              value={formData.customer_name}
              onChange={handleChange}
              className="h-12 rounded-xl bg-muted/20 border-transparent focus:bg-background transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_info" className="font-bold text-xs uppercase tracking-widest opacity-60">연락처 또는 이메일</Label>
            <Input
              id="contact_info"
              name="contact_info"
              placeholder="알림을 받으실 연락처"
              required
              value={formData.contact_info}
              onChange={handleChange}
              className="h-12 rounded-xl bg-muted/20 border-transparent focus:bg-background transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount" className="font-bold text-xs uppercase tracking-widest opacity-60">입금 금액</Label>
            <Input
              id="amount"
              name="amount"
              placeholder="예: 9,900"
              required
              value={formData.amount}
              onChange={handleChange}
              className="h-12 rounded-xl bg-muted/20 border-transparent focus:bg-background transition-all"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes" className="font-bold text-xs uppercase tracking-widest opacity-60">추가 메시지 (선택)</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="특이사항이 있다면 적어주세요."
              value={formData.notes}
              onChange={handleChange}
              className="min-h-[100px] rounded-xl bg-muted/20 border-transparent focus:bg-background transition-all resize-none"
            />
          </div>
          <Button 
            type="submit" 
            disabled={status === "loading"}
            className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {status === "loading" ? (
              <span className="flex items-center gap-2">
                <IconLoader2 className="animate-spin" size={20} />
                요청 중...
              </span>
            ) : (
              "입금 확인 요청하기"
            )}
          </Button>
          {status === "error" && (
            <p className="text-destructive text-xs font-bold text-center">
              오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
