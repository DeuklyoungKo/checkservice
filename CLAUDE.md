# CLAUDE.md — Trend Scouter

바이브 코더(Vibe Coder)를 위한 수익형 사이드 프로젝트 아이디어 발굴 서비스.
Reddit·Product Hunt·GeekNews에서 실제 페인포인트를 PUFE 프레임워크로 분석하고,
AI 코딩 도구(Claude Code, ChatGPT, Gemini 등)에 바로 붙여넣을 수 있는 개발 브리프를 제공한다.

---

## 프로젝트 구조

```
260303_TrendScouter/
├── 1.PRD.md                    ← 제품 요구사항 문서 (전략·기능 정의)
├── 2.PDP.md                    ← 개발 로드맵 & 체크박스 진행 현황
├── trend-scouter/              ← Next.js 앱 루트 (여기서 개발)
│   ├── src/app/
│   │   ├── page.tsx            ← 홈 (랜딩)
│   │   ├── trends/             ← 트렌드 목록
│   │   ├── trend/[id]/         ← 트렌드 상세 (PUFE 시각화, AI Prompt Copy)
│   │   ├── workspace/          ← 북마크·저장 (개인 허브)
│   │   ├── wizard/             ← 아이디어 컨버터 (PHASE 2, 보류)
│   │   ├── premium/            ← 프리미엄 구독
│   │   └── api/
│   │       ├── polar/          ← Polar 결제 연동
│   │       └── webhook/        ← Polar 결제 완료 웹훅
│   ├── scripts/
│   │   ├── rss-collector.js    ← 핵심: 다중 소스 수집 + Gemini 분석 + DB 저장
│   │   ├── naver-datalab.js    ← 네이버 DataLab API 교차검증
│   │   └── automate_analysis.js← 배치 분석 스크립트
│   └── supabase/               ← DB 스키마 및 마이그레이션
└── .github/workflows/
    └── trend-collect.yml       ← GitHub Actions (1시간 cron)
```

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| Frontend | Next.js 16 (App Router) + Tailwind CSS v4 |
| UI 컴포넌트 | shadcn/ui + lucide-react + @tabler/icons-react |
| DB / Auth | Supabase (PostgreSQL + GoTrue) |
| AI 엔진 | Google Gemini API (`@google/generative-ai`) / DeepSeek V3 폴백 |
| 수집 워커 | Node.js (`rss-parser`) → GitHub Actions cron |
| 결제 | Polar (`@polar-sh/sdk`) — $3 단건, 웹훅으로 즉시 잠금 해제 |
| 배포 | Vercel (`trend.gonsuit.com`) |

---

## 핵심 개념

### PUFE 스코어 (0~100점)
각 항목 0~25점. AI가 커뮤니티 통계 데이터를 기반으로 산출.

| 항목 | 의미 |
|------|------|
| Pain | 사용자 결핍의 깊이 (기능적/재정적/감정적) |
| Urgency | 지금 당장 해결해야 하는 정도 |
| Frequency | 얼마나 자주 발생하는 문제인가 |
| Existing Solution | 현재 대안이 얼마나 불편하거나 비싼가 |

### AI Buildability Score (1~5)
AI 코딩 도구로 구현 시 예상 소요 시간.
1=하루, 2=2~3일, 3=1주, 4=2주, 5=1개월 이상

### Stats-Only 원칙
저작권·법적 안전성 확보를 위해 본문 전문 저장 금지.
`impact_score`, `stats_data` (언급 횟수·상승률·upvotes) 중심으로만 저장.

### 데이터 파이프라인
- **Tier 1 (글로벌)**: Reddit, Product Hunt, HN, Dev.to, GeekNews RSS → Gemini 분석 → Supabase
- **Tier 2 (한국)**: GeekNews(`isKorean: true`) + 네이버 DataLab API 교차검증 → `analysis.stats_data.korea_demand`

---

## 현재 개발 상태 (2026-06-01 기준)

**전체 공정률: ~85%** — PHASE 4 (검증·런칭) 진행 중

### 완료
- Stats-Only 수집 파이프라인 (GitHub Actions 1시간 cron)
- PUFE 스코어 분석 엔진 (Gemini API)
- GeekNews 한국 소스 연동
- Polar 결제 + 웹훅 잠금 해제
- 워크스페이스(북마크) 기능

### 최우선 진행 중
1. **네이버 DataLab API 실 연동** — API 키 발급 후 GitHub Secrets 등록 필요
2. **"AI Prompt Copy" 기능** — 트렌드 상세 페이지에 개발 브리프 생성·복사 버튼

### 다음 순서
3. AI Buildability Score DB 필드 추가 (`analysis.ai_buildability_score`) + UI
4. Polar 단건 결제 ($3) 상세 연동
5. 홈페이지 Hero 카피 업데이트 (새 포지셔닝 반영)
6. Vercel 프로덕션 배포

> 상세 체크박스: `2.PDP.md` 참조

---

## 개발 규칙

### 환경 변수 (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
GOOGLE_GEMINI_API_KEY
DEEPSEEK_API_KEY          # 발급 완료, 충전 후 자동 전환
NAVER_CLIENT_ID           # DataLab API (미등록)
NAVER_CLIENT_SECRET       # DataLab API (미등록)
POLAR_ACCESS_TOKEN
POLAR_WEBHOOK_SECRET
```

### 작업 완료 규칙
- **작업이 완료될 때마다 반드시 `2.PDP.md`의 해당 체크박스를 업데이트한다.**
  - 완료된 항목: `[ ]` → `[x]`
  - 새로운 항목이 추가된 경우 해당 섹션에 추가
  - 전체 공정률(%) 및 최우선 과제 문구도 현황에 맞게 갱신

### Git 커밋 규칙

> ⚠️ **Claude는 직접 `git commit` / `git push`를 실행하지 않는다.**

#### 배경
Vercel은 GitHub `main` 브랜치에 push가 발생하면 **자동으로 프로덕션 배포**를 트리거한다.
Claude가 작업 중간에 임의로 커밋·푸시하면 미완성 코드가 프로덕션에 즉시 반영될 수 있다.

#### 규칙
- Claude는 코드 작업 완료 후 **커밋 메시지만 제안**한다.
- 실제 `git add` / `git commit` / `git push`는 **사용자가 직접 실행**한다.
- 사용자가 명시적으로 "커밋해줘", "푸시해줘"라고 요청한 경우에만 예외적으로 실행한다.

#### 커밋 메시지 제안 형식
```
<type>: <제목 (한글 또는 영문)>

- 변경 내용 bullet 1
- 변경 내용 bullet 2

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

| type | 용도 |
|------|------|
| `feat` | 새 기능 추가 |
| `fix` | 버그 수정 |
| `docs` | 문서·주석 변경 |
| `style` | UI/CSS 변경 (기능 무관) |
| `refactor` | 리팩터링 |
| `chore` | 패키지·설정 변경 |

### SEO · AEO 준수 규칙

> 페이지를 새로 만들거나 수정할 때 아래 기준을 **항상** 확인한다.

#### 1. 메타데이터 필수 항목
모든 페이지(서버 컴포넌트)에 `metadata` 또는 `generateMetadata`를 선언한다.

```ts
// 정적 페이지
export const metadata: Metadata = {
  title: "페이지 제목 (55자 이내) — Trend Scouter",
  description: "핵심 가치 + 타겟 행동 유도 (120~160자)",
  openGraph: {
    title: "페이지 제목",
    description: "설명",
    url: "https://trend.gonsuit.com/[경로]",
    siteName: "Trend Scouter",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "페이지 제목",
    description: "설명",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://trend.gonsuit.com/[경로]" },
};

// 동적 페이지 (trend/[id] 등)
export async function generateMetadata({ params }) {
  // DB에서 데이터 가져와 title/description/og 동적 생성
}
```

#### 2. layout.tsx `metadataBase` 필수
```ts
export const metadata: Metadata = {
  metadataBase: new URL("https://trend.gonsuit.com"),
  // ...
};
```

#### 3. 구조화 데이터 (JSON-LD) — AEO 핵심
AI 답변 엔진(ChatGPT, Perplexity, Google AI Overview)이 콘텐츠를 이해할 수 있도록
상세 페이지에 JSON-LD를 삽입한다.

```tsx
// 트렌드 상세 페이지 예시
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": trend.title,
    "description": analysis.summary,
    "datePublished": trend.created_at,
    "publisher": { "@type": "Organization", "name": "Trend Scouter" },
  })}}
/>
```

홈페이지에는 `WebSite` + `SiteLinksSearchBox` 스키마 추가.

#### 4. sitemap.ts / robots.ts 필수 파일
- `src/app/sitemap.ts` — 트렌드 상세 페이지를 동적으로 포함
- `src/app/robots.ts` — `Allow: /`, `Disallow: /api/, /workspace, /login`

#### 5. AEO — Answer Engine Optimization 원칙
AI 검색 엔진(Perplexity, ChatGPT Search, Google AI Overview)에 인용되려면:

- **질문형 헤딩 사용**: "PUFE 스코어란?" 형태의 `<h2>` 포함
- **직접적 답변 먼저**: 본론을 첫 문장에 배치 (역피라미드 구조)
- **FAQ 섹션 추가**: 주요 페이지에 Q&A 블록 + `FAQPage` JSON-LD
- **수치 명시**: "PUFE 스코어 80점 이상", "AI 코딩 도구로 1일 구현" 등 구체적 숫자
- **출처 명시**: 데이터 기반 근거 ("Reddit 342회 언급", "네이버 월 검색량 8,900") 포함

#### 6. 타이틀·설명 작성 기준
| 항목 | 기준 |
|------|------|
| `title` | 55자 이내, 핵심 키워드 앞에 배치, `— Trend Scouter` 접미 |
| `description` | 120~160자, 사용자 행동 유도 포함, 중복 금지 |
| OG 이미지 | 1200×630px, 텍스트 포함, 페이지별 동적 생성 권장 |

#### 7. 미구현 항목 (구현 예정)
- [ ] `src/app/sitemap.ts` — 트렌드 상세 페이지 동적 포함
- [ ] `src/app/robots.ts` — 크롤 정책 설정
- [ ] `layout.tsx` `metadataBase` + 전체 OG 태그 추가
- [ ] 트렌드 상세 페이지 JSON-LD (`Article` 스키마)
- [ ] 홈페이지 JSON-LD (`WebSite` + `FAQPage` 스키마)
- [ ] `/public/og-image.png` 기본 OG 이미지 추가

### 코딩 원칙
- App Router 기반 — `"use client"` 최소화, 서버 컴포넌트 우선
- Supabase 클라이언트: 서버 측 `@supabase/ssr`, 클라이언트 측 `createBrowserClient`
- AI 호출은 `rss-collector.js`(수집 시) 또는 API Route(온디맨드)에서만 수행
- DB 변경 시 `supabase/` 하위에 마이그레이션 파일 작성

### 자주 쓰는 명령어
```bash
# 개발 서버
cd trend-scouter && npm run dev

# 수동 수집·분석 실행
node trend-scouter/scripts/rss-collector.js

# 배치 분석
node trend-scouter/scripts/automate_analysis.js

# 네이버 DataLab 테스트
node trend-scouter/test-datalab.js
```

---

## 비즈니스 컨텍스트

- **타겟**: AI 코딩 도구(Claude Code, ChatGPT, Gemini, Cursor 등) 사용 한국인 개발자·비개발자
- **포지셔닝**: "주말에 만들어볼 수 있는 수익형 사이드 프로젝트 아이디어"
- **수익 모델**: Polar 단건 결제 $3 (핵심) + 제휴 마케팅 (Vercel·Supabase·Polar)
- **배포 도메인**: `trend.gonsuit.com` → 지표 달성 후 `trendscouter.com` 스핀오프
- **PHASE 2 조건**: Polar 첫 결제 1건 달성 + MAU 300명 → 아이디어 컨버터 Wizard 고도화
