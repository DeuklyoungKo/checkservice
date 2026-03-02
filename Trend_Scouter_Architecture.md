# 첫 번째 수익화 프로젝트: Trend Scouter (트렌드 스카우터) 구성안

**Trend Scouter**는 전 세계의 비즈니스 트렌드와 성공 사례를 실시간으로 수집/분석하여, 1인 창업가나 소규모 팀에게 바로 실행 가능한(Actionable) 기회 리포트를 제공하는 SaaS 서비스입니다.

---

## 1. 핵심 가치 (Value Proposition)
- **시간 절약**: 매일 수백 개의 커뮤니티와 스토어를 모니터링할 필요가 없습니다.
- **데이터 기반 의존**: 감이 아닌, 업보트(Upvote), 트래픽, 결제 데이터 기반의 기회를 제안합니다.
- **실행 가이드 제공**: 단순 정보 전달을 넘어, "한국 시장에서는 어떻게 구현해야 하는가"에 대한 AI 전략을 동봉합니다.

---

## 2. 주요 기능 (Core Features)

### A. 실시간 트렌드 대시보드
- **글로벌 소스 통합**: Product Hunt, Indie Hackers, Reddit (r/sideproject), X (Trending tags).
- **AI 스코어링**: 각 아이디어에 대해 **[수익성 / 난이도 / 한국 내 경쟁력]**을 0~100점으로 산출.

### B. 프리미엄 '딥 다이브' 리포트 (유료 모델)
- 유망한 아이디어를 선정하여 상세 분석 제공:
    - 예상 수익 모델 (광고 vs 구독 vs 건당 결제).
    - 초기 유저 획득(GTM) 전략.
    - 필요한 기술 스택 제안.

### C. 맞춤형 알림 서비스
- 사용자가 설정한 키워드나 태그(예: AI, Productivity, Health)에 맞는 기회가 포착되면 이메일/Push 발송.

---

## 3. 수익 모델 (Monetization)

1.  **Freemium**: 대시보드의 일부 정보만 공개 (무료).
2.  **Premium Subscription (월 $19~$29)**: 모든 아이디어 상세 분석 및 매주 발행되는 'Top 3 수익 기회' 리포트 제공.
3.  **One-time Report ($9)**: 특정 아이디어에 대한 심층 마켓 리서치 보고서 단건 구매.

---

## 4. 기술 아키텍처 (Technical Stack - 0원 루틴)

- **Frontend**: **Next.js 14** (App Router) + **Tailwind CSS** (Vercel 호스팅)
- **Database/Auth**: **Supabase** (PostgreSQL & GoTrue)
- **Worker (Scraper)**: **Cloudflare Workers** or **GitHub Actions** (Scheduled Jobs)
- **AI Engine**: **OpenAI API (GPT-4o)** or **Claude-3.5-Sonnet**
- **Payments**: **Stripe** or **PortOne (토스/카카오)**

---

## 5. 실행 로드맵 (Phase 1 MVP)

1.  **1주차**: 핵심 데이터 소스(Product Hunt, Reddit) 스크래퍼 구축 및 Supabase 연동.
2.  **2주차**: AI 분석 엔진(Prompts) 개발 및 아이디어 스코어링 자동화.
3.  **3주차**: 서비스 랜딩 페이지 및 대시보드 UI 개발.
4.  **4주차**: 결제 연동 및 초기 사용자(베타 테스터) 모집 시작.

---

> [!IMPORTANT]
> 이 서비스 자체가 곧 우리가 앞으로 만들 수많은 서비스들의 **'나침반'** 역할을 하게 됩니다. 우리 스스로 이 서비스를 사용하여 다음 MVP 아이디어를 선별하는 선순환 구조를 만드는 것이 목표입니다.
