import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { PolarCheckoutButton } from "@/components/PolarCheckoutButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  IconArrowLeft,
  IconCheck,
  IconCrown,
  IconRocket,
  IconSparkles,
  IconExternalLink,
  IconInfinity,
  IconBolt,
  IconCircleCheck,
} from "@tabler/icons-react";

interface PageProps {
  searchParams: Promise<{ subscribed?: string }>;
}

export default async function PremiumPage({ searchParams }: PageProps) {
  const { subscribed } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const productId9900 = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID_9900 || '';

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 transition-all duration-500 pb-20">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 rounded-full hover:bg-muted transition-all font-bold">
              <IconArrowLeft size={18} />
              대시보드로 돌아가기
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <IconCrown className="text-primary w-5 h-5" />
            <span className="font-black text-sm text-primary uppercase tracking-widest">Premium Membership</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-16 sm:py-24">
        {/* Success State */}
        {subscribed === 'true' && (
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700">

            {/* Hero */}
            <div className="relative text-center mb-12">
              {/* 배경 장식 */}
              <div className="absolute inset-0 -z-10 overflow-hidden rounded-[64px]">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
              </div>

              <div className="py-16 px-8 space-y-8">
                {/* 크라운 + 스파크 아이콘 조합 */}
                <div className="relative inline-flex items-center justify-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/5 rounded-[40px] flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10">
                    <IconCrown size={60} className="text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                    <IconCheck size={20} className="text-white" strokeWidth={3} />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-primary font-black text-xs uppercase tracking-[0.3em] opacity-70">Premium Activated</p>
                  <h1 className="text-6xl sm:text-7xl font-black tracking-tighter leading-[1.0]">
                    환영합니다,<br />
                    <span className="text-primary">Premium</span> 멤버!
                  </h1>
                  <p className="text-lg text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed pt-2">
                    이제 모든 트렌드 심층 리포트, GTM 전략, 실행 체크리스트에<br className="hidden sm:block" />
                    무제한으로 접근할 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 혜택 카드 3개 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {[
                { icon: "📊", title: "심층 리포트 무제한", desc: "모든 트렌드의 PUFE 분석, GTM 전략 전체 열람" },
                { icon: "⚡", title: "즉시 잠금 해제", desc: "결제 직후 자동 활성화, 새로고침 한 번이면 완료" },
                { icon: "🔄", title: "월간 갱신", desc: "매월 자동 갱신, Polar 대시보드에서 언제든 해지 가능" },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-card border border-muted rounded-[32px] p-6 text-center space-y-2 hover:border-primary/30 transition-colors">
                  <div className="text-3xl mb-3">{icon}</div>
                  <p className="font-black text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            {/* 다음 단계 */}
            <div className="bg-primary/5 border border-primary/15 rounded-[32px] p-8 mb-10 space-y-4">
              <p className="font-black text-xs uppercase tracking-[0.2em] text-primary/60 mb-4">다음 단계</p>
              {[
                { step: "1", text: user ? "트렌드 목록으로 이동해 바로 전체 리포트를 열람하세요" : "로그인 후 자동으로 프리미엄 권한이 적용됩니다" },
                { step: "2", text: "트렌드 상세 페이지에서 잠금 해제된 PUFE 분석, GTM 전략을 확인하세요" },
                { step: "3", text: "반영까지 최대 1분 소요 — 페이지 새로고침 후 이용 가능합니다" },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-4">
                  <div className="w-7 h-7 bg-primary/10 text-primary rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs mt-0.5">{step}</div>
                  <p className="text-sm font-medium text-foreground/80 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            {/* CTA 버튼 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/trends">
                <Button size="lg" className="h-16 px-12 rounded-2xl font-black text-base shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all gap-2">
                  <IconSparkles size={20} />
                  전체 트렌드 보러 가기
                </Button>
              </Link>
              {!user && (
                <Link href="/login">
                  <Button size="lg" variant="outline" className="h-16 px-12 rounded-2xl font-black text-base border-2 hover:scale-[1.02] transition-all">
                    로그인하기
                  </Button>
                </Link>
              )}
            </div>

          </div>
        )}

        {subscribed !== 'true' && (<>

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <Badge variant="secondary" className="bg-primary/10 text-primary px-4 py-1.5 text-xs font-black tracking-[0.2em] uppercase rounded-full">
            <IconSparkles size={14} className="mr-2" />
            Go to the Next Level
          </Badge>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-tight">
            압도적인 비즈니스<br />
            인사이트를 소유하세요
          </h1>
          <p className="text-xl text-muted-foreground font-medium leading-relaxed">
            무료 트렌드를 넘어, 실제 성공률을 높여주는 심층 리포트와<br className="hidden sm:block" />
            한국 시장 전용 GTM 전략을 무제한으로 이용할 수 있습니다.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-full text-xs font-bold text-muted-foreground">
              <IconBolt size={14} className="text-primary" />
              Polar 안전 결제 · 즉시 자동 활성화 · 언제든 해지 가능
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32 items-stretch max-w-4xl mx-auto">
          {/* Individual Report */}
          <Card className="relative group overflow-hidden rounded-[56px] border-2 border-muted hover:border-primary/30 transition-all duration-500 bg-card/50 backdrop-blur-sm flex flex-col">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] select-none pointer-events-none">
              <IconRocket size={160} className="transform rotate-12" />
            </div>
            <CardHeader className="p-12 pb-6">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-muted rounded-[24px] flex items-center justify-center font-black text-xl">1회</div>
              </div>
              <CardTitle className="text-3xl font-black tracking-tight mb-2">개별 리포트 구매</CardTitle>
              <CardDescription className="text-lg font-medium">원하는 아이디어의 분석 결과만 쏙쏙!</CardDescription>
            </CardHeader>
            <CardContent className="p-12 pt-0 flex-1">
              <div className="flex items-baseline gap-1 mb-10">
                <span className="text-5xl font-black tracking-tighter">3,900</span>
                <span className="text-xl font-bold text-muted-foreground">원</span>
              </div>
              <ul className="space-y-4 mb-10">
                {["해당 아이디어 심층 리포트 무제한 열람", "한국형 GTM 전략 & 마케팅 가이드", "추천 기술 스택 및 구현 로드맵", "수익화 모델 상세 분석"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-medium text-muted-foreground">
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <IconCheck size={14} className="text-primary" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-12 pt-0">
              <Link href="/trends" className="w-full">
                <Button size="lg" variant="outline" className="w-full h-16 rounded-3xl font-black text-lg gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all border-2">
                  <IconRocket size={20} />
                  트렌드 목록에서 구매하기
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Monthly Subscription */}
          <Card className="relative group overflow-hidden rounded-[56px] border-4 border-primary shadow-2xl shadow-primary/10 flex flex-col scale-105 z-10 bg-card">
            <div className="absolute top-0 right-0 p-8 opacity-[0.05] select-none pointer-events-none text-primary">
              <IconInfinity size={160} className="transform rotate-12" />
            </div>
            <div className="absolute top-8 right-8">
              <Badge className="bg-primary text-primary-foreground font-black px-4 py-1 rounded-full uppercase tracking-widest text-[10px]">Most Popular</Badge>
            </div>
            <CardHeader className="p-12 pb-6">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center font-black text-xl text-primary-foreground">All</div>
              </div>
              <CardTitle className="text-3xl font-black tracking-tight mb-2">프리미엄 구독 (월)</CardTitle>
              <CardDescription className="text-lg font-medium">제한 없는 성장을 위한 최고의 선택</CardDescription>
            </CardHeader>
            <CardContent className="p-12 pt-0 flex-1">
              <div className="flex items-baseline gap-1 mb-10">
                <span className="text-6xl font-black tracking-tighter text-primary">9,900</span>
                <span className="text-xl font-bold text-muted-foreground">원 / 월</span>
              </div>
              <ul className="space-y-4 mb-10">
                {["모든 트렌드 리포트 무제한 열람", "AI 분석 결과 실시간 업데이트 피드", "주간 트렌드 요약 뉴스레터 (Pro)", "전용 워크스페이스 보관함 무제한", "우선 순위 고객 지원"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <IconCheck size={14} className="text-primary-foreground" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="p-12 pt-0">
              <PolarCheckoutButton
                productId={productId9900}
                successPath="/premium?subscribed=true"
                className="w-full h-16 rounded-3xl font-black text-xl gap-3 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground border-none"
              >
                <IconExternalLink size={24} />
                Polar로 구독 시작하기
              </PolarCheckoutButton>
            </CardFooter>
          </Card>
        </div>

        {/* How it works */}
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tight">결제 흐름 안내</h2>
            <p className="text-lg text-muted-foreground font-medium">
              Polar를 통해 안전하게 결제하고 즉시 자동 활성화됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { step: "1", text: "위 버튼을 눌러 Polar 결제 페이지로 이동합니다." },
              { step: "2", text: "카드 정보를 입력하고 결제를 완료합니다." },
              { step: "3", text: "웹훅이 즉시 발동하여 계정에 프리미엄 권한이 부여됩니다." },
              { step: "4", text: "페이지를 새로고침하면 모든 리포트가 잠금 해제됩니다." },
            ].map(({ step, text }) => (
              <div key={step} className="p-8 rounded-[40px] bg-muted/30 border border-muted flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-lg">{step}</div>
                <p className="font-bold">{text}</p>
              </div>
            ))}
          </div>

          <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10 flex items-start gap-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <IconExternalLink size={24} className="text-primary" />
            </div>
            <div>
              <h4 className="font-black text-lg mb-2">문의 및 환불</h4>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                결제 문제 또는 환불 요청은 Polar 대시보드에서 직접 처리하거나{" "}
                <Link href="/contact" className="underline decoration-dotted hover:text-primary transition-colors">문의 페이지</Link>를 통해 연락해 주세요.
              </p>
            </div>
          </div>
        </div>
        </>)}
      </main>

      {/* Mini Footer */}
      <footer className="max-w-7xl mx-auto px-4 text-center py-10 opacity-30">
        <p className="text-xs font-black uppercase tracking-widest">© 2026 Trend Scouter. Built for Pioneers.</p>
      </footer>
    </div>
  );
}
