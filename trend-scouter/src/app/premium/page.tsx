import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  IconArrowLeft,
  IconCheck,
  IconCrown,
  IconRocket,
  IconSparkles,
  IconQrcode,
  IconExternalLink,
  IconInfinity
} from "@tabler/icons-react";
import { PaymentConfirmationForm } from "@/components/PaymentConfirmationForm";

export default function PremiumPage() {
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
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32 items-stretch">
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
              <a href="https://qr.kakaopay.com/FYPQCzrBK79e01229" target="_blank" rel="noopener noreferrer" className="w-full">
                <Button size="lg" className="w-full h-16 rounded-3xl font-black text-xl gap-3 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all bg-yellow-400 text-black hover:bg-yellow-500 border-none">
                  <IconQrcode size={24} />
                  카카오페이 송금하기
                </Button>
              </a>
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
              <a href="https://qr.kakaopay.com/FYPQCzrBK135609116" target="_blank" rel="noopener noreferrer" className="w-full">
                <Button size="lg" className="w-full h-16 rounded-3xl font-black text-xl gap-3 shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary text-primary-foreground border-none">
                  <IconQrcode size={24} />
                  카카오페이 송금하기
                </Button>
              </a>
            </CardFooter>
          </Card>
        </div>

        {/* Payment Confirmation Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 items-start">
          <div className="lg:col-span-3 space-y-12">
            <div className="space-y-6">
              <h2 className="text-4xl font-black tracking-tight">결제 안내 및 절차</h2>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                현재 정식 결제 시스템 도입 전으로, **카카오페이 수동 송금**을 통해 권한을 부여해 드리고 있습니다. 불편을 드려 죄송하며, 더 나은 서비스로 보답하겠습니다!
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-8 rounded-[40px] bg-muted/30 border border-muted flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center font-black">1</div>
                <p className="font-bold">위의 카카오페이 버튼을 눌러 송금을 완료해 주세요.</p>
              </div>
              <div className="p-8 rounded-[40px] bg-muted/30 border border-muted flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center font-black">2</div>
                <p className="font-bold">송금 후 우측의 '입금 확인 요청' 폼을 작성해 주세요.</p>
              </div>
              <div className="p-8 rounded-[40px] bg-muted/30 border border-muted flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center font-black">3</div>
                <p className="font-bold">관리자가 입금 확인 후 1시간 내에 프리미엄 권한을 부여합니다.</p>
              </div>
              <div className="p-8 rounded-[40px] bg-muted/30 border border-muted flex flex-col items-center text-center space-y-4">
                <div className="w-12 h-12 bg-background rounded-2xl flex items-center justify-center font-black">4</div>
                <p className="font-bold">로그아웃 후 다시 로그인하시면 프리미엄 기능이 활성화됩니다.</p>
              </div>
            </div>

            <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10 flex items-start gap-6">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                <IconExternalLink size={24} className="text-primary" />
              </div>
              <div>
                <h4 className="font-black text-lg mb-2">도움이 필요하신가요?</h4>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  입금 확인이 늦어지거나 기타 문의사항은 하단 뉴스레터를 통해 문의해 주시면 신속하게 답변 드리겠습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <PaymentConfirmationForm />
          </div>
        </div>
      </main>

      {/* Mini Footer */}
      <footer className="max-w-7xl mx-auto px-4 text-center py-10 opacity-30">
        <p className="text-xs font-black uppercase tracking-widest">© 2026 Gonsuit Trend Intelligence. Built for Pioneers.</p>
      </footer>
    </div>
  );
}
