# Trend Scouter — 트렌드 수집 파이프라인 가이드

> 최종 업데이트: 2026-05-31

---

## 1. 전체 흐름 요약

```
GitHub Actions (매시간)
  └─ rss-collector.js 실행
       ├─ 7개 RSS 피드 수집 (글로벌 5 + 한국 2)
       ├─ 키워드 필터링 (임팩트 스코어 산정)
       ├─ 네이버 DataLab API 교차검증 (한국 검색 수요)
       ├─ Google Gemini AI 분석 (PUFE 스코어 + 브리프 생성)
       └─ Supabase DB 저장 (trends / analysis 테이블)
```

---

## 2. 수집 빈도

| 항목 | 내용 |
|------|------|
| **실행 주기** | **2시간마다** (GitHub Actions cron: `0 */2 * * *`) |
| **실행 방식** | 자동 (스케줄) + 수동 (GitHub Actions → workflow_dispatch) |
| **실행 환경** | GitHub Actions — `ubuntu-latest` / Node.js 24 |
| **로컬 수동 실행** | `cd trend-scouter && node scripts/rss-collector.js` |

---

## 3. 수집 소스

### 3-1. 글로벌 소스 (Tier 1)

| 소스명 | RSS URL | 특징 |
|--------|---------|------|
| **Indie Hackers** | `hnrss.org/newest?q=Indie+Hackers&points=20` | 업보트 20 이상 필터 |
| **Reddit r/sideproject** | `reddit.com/r/sideproject/.rss` | 사이드 프로젝트 커뮤니티 |
| **Product Hunt** | `producthunt.com/feed` | 신규 런칭 제품 |
| **Hacker News** | `hnrss.org/newest?q=SaaS+OR+Automation&points=20` | SaaS/자동화 키워드 필터 |
| **Dev.to** | `dev.to/feed` | 개발자 커뮤니티 아티클 |

### 3-2. 한국 소스 (Tier 2 — Korea Data Pipeline)

| 소스명 | RSS URL | 특징 |
|--------|---------|------|
| **GeekNews** | `news.hada.io/rss/news` | 한국 개발자 커뮤니티 인기 토픽 |
| **ZDNet Korea** | `zdnet.co.kr/feed` | 한국 IT 뉴스 |

> **한국 소스 필터 기준**: 글로벌(임팩트 스코어 ≥ 10) vs 한국(임팩트 스코어 ≥ 5) — 한국어 키워드 점수가 낮게 나오는 특성 반영

### 3-3. 필터링 키워드

글로벌 + 한국어 키워드 조합으로 임팩트 스코어를 산정합니다.

```
글로벌: AI, SaaS, Automation, Revenue, Startup, No-code, OpenAI, Gemini, ChatGPT
한국어: 자동화, 노코드, 수익화, AI, 스타트업, 창업, 서비스, 앱, 플랫폼, SaaS
```

---

## 4. 수집 → 분석 프로세스

```
1. RSS 피드 파싱
   └─ 아이템별 임팩트 스코어 계산 (키워드 매칭, 항목당 +10점)

2. 중복 체크 (Supabase — external_id 기준)
   └─ 기존 아이템의 impact_score보다 낮으면 스킵

3. 네이버 DataLab 교차검증 (선택적)
   └─ 10개 키워드 그룹의 최근 3개월 검색 지수(0~100) + 전월 성장률 조회
   └─ 1회 조회 후 캐시 — 실행당 API 호출 최소화

4. DeepSeek V3 AI 분석
   └─ 모델: deepseek-chat (DeepSeek V3, 2025년 3월 학습 기준)
   └─ JSON 출력 정확도·한국어 품질 최고 수준
   └─ 폴백: gemini-2.5-flash-lite (DeepSeek API 장애 시)
   └─ 출력: PUFE 스코어, 헤드라인, 요약, GTM 전략, 기술 스택, AI 브리프 등

5. Supabase 저장
   └─ trends 테이블: upsert (source + external_id 기준)
   └─ analysis 테이블: insert (trend_id 연결)
```

---

## 5. AI 분석 출력 항목

| 필드 | 설명 |
|------|------|
| `headline` | 한국어 비즈니스 헤드라인 |
| `pain_category` | Functional / Financial / Emotional |
| `pufe_p/u/f/e` | Pain·Urgency·Frequency·Existing (각 0~25점) |
| `pufe_total` | 종합 PUFE 점수 (최대 100점) |
| `reasoning` | 점수 부여 상세 근거 (한국어) |
| `summary` | 3문장 한국 시장 분석 요약 |
| `gtm_strategy` | 한국형 Go-to-Market 전략 |
| `tech_stack_suggestion` | 추천 기술 스택 리스트 |
| `korea_localization_tips` | 한국 시장 현지화 핵심 포인트 |
| `solution_wizard` | 해결 실행 단계 + 액션 체크리스트 |
| `ai_buildability_score` | AI 개발 난이도 (1=하루 ~ 5=1개월+) |
| `ai_brief` | AI 코딩 도구용 마크다운 개발 브리프 |

---

## 6. 예상 비용

### 6-1. DeepSeek API ← 현재 적용 예정

| 항목 | 내용 |
|------|------|
| **사용 모델** | `deepseek-chat` (DeepSeek V3) |
| **학습 데이터 기준** | 2025년 3월 (비교군 중 최신) |
| 입력 토큰 단가 | **$0.07 / 1M 토큰** (캐시 히트 시 $0.014) |
| 출력 토큰 단가 | **$1.10 / 1M 토큰** |
| 분석 건수 | 실행당 최대 20~50건 |
| 실행 횟수 | **12회/일** (2시간마다) |

**일간 예상 호출량**: 12회 × 평균 30건 = **약 360건/일**

**비용 추정**:

| 구분 | 토큰 수/일 | 단가 | 일 비용 |
|------|-----------|------|---------|
| 입력 | 360 × 1,250 = 450K 토큰 | $0.07/1M | **~$0.032** |
| 출력 | 360 × 650 = 234K 토큰 | $1.10/1M | **~$0.257** |
| **합계** | | | **~$0.29/일 (~₩400)** |
| **월 합계** | | | **~$8.70/월 (~₩12,000)** |

> 💡 프롬프트 캐싱 적용 시 입력 단가 $0.014/1M → **월 $5~6 수준**으로 절감 가능
> ⚠️ 폴백: DeepSeek API 장애 시 `gemini-2.5-flash-lite` (무료 티어)로 자동 전환

### 6-1-A. AI 모델 비교 (선택 배경)

| 모델 | 비용/월 | 한국어 품질 | JSON 정확도 | 비고 |
|------|---------|------------|------------|------|
| **DeepSeek V3** ✅ 선택 | ~$9 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 학습 기준 2025.03 |
| Gemini 2.5 Flash-Lite | $0 | ⭐⭐⭐⭐ | ⭐⭐⭐ | 무료, RPD 제한 있음 |
| Groq + Llama 3.3 70B | $0 | ⭐⭐⭐ | ⭐⭐⭐⭐ | 무료, 학습 기준 2023.12 |

### 6-2. 네이버 DataLab API

| 항목 | 내용 |
|------|------|
| 요금 | **무료** |
| 일 한도 | **1,000회/일** |
| 실제 사용 | 실행당 2~4회 (그룹 단위 캐시 활용) → 최대 **48회/일** |

### 6-3. GitHub Actions

| 항목 | 내용 |
|------|------|
| 요금 | Public 레포: **무료 무제한** / Private 레포: 무료 2,000분/월 |
| 실행 시간 | 실행당 약 **3~5분** |
| 월 사용량 | 12회/일 × 30일 × 4분 = **약 1,440분/월** |
| Private 레포 비용 | 무료 2,000분 이내 → **$0** |

> Public / Private 레포 모두 GitHub Actions 비용 0원

### 6-4. Supabase

| 항목 | 내용 |
|------|------|
| 현재 플랜 | Free 플랜 (DB 500MB, API 무제한) |
| 월 예상 DB 증가 | 트렌드 360건/일 × 약 2KB = **약 22MB/월** |
| Free 플랜 한도 | 500MB → **약 22개월 여유** |

### 6-5. 월 비용 총계

| 항목 | 월 비용 |
|------|---------|
| DeepSeek API | ~$9 (~₩12,000) |
| 네이버 DataLab | 무료 |
| GitHub Actions | 무료 |
| Supabase (Free) | 무료 |
| **합계** | **~$9/월 (~₩12,000)** |

---

## 7. 환경 변수 (GitHub Secrets)

GitHub Actions에서 사용하는 Secrets 목록:

```
NEXT_PUBLIC_SUPABASE_URL      # Supabase 프로젝트 URL
SUPABASE_SERVICE_ROLE_KEY     # Supabase 서비스 롤 키 (DB 쓰기 권한)
DEEPSEEK_API_KEY              # DeepSeek API 키 ← 신규 추가
GEMINI_API_KEY                # Google Gemini API 키 (폴백용, 유지)
NAVER_CLIENT_ID               # 네이버 DataLab 클라이언트 ID (선택)
NAVER_CLIENT_SECRET           # 네이버 DataLab 클라이언트 시크릿 (선택)
```

> GitHub 레포 → Settings → Secrets and variables → Actions → `trendscouter` Environment에 등록
> DeepSeek API 키 발급: [platform.deepseek.com](https://platform.deepseek.com)

---

## 8. 운영 참고사항

- **중복 방지**: `external_id` (RSS guid/link) 기준으로 upsert — 같은 트렌드가 재수집되어도 impact_score가 높을 때만 업데이트
- **분석 실패 처리**: AI 분석 실패 시 해당 아이템 스킵 (전체 중단 없음)
- **모델 폴백**: DeepSeek API 장애 시 자동으로 `gemini-2.5-flash-lite`로 전환
- **DataLab 캐시**: 실행 1회당 네이버 API를 1번만 호출하고 결과를 메모리에 캐시 → API 한도 절약
- **수동 실행**: GitHub Actions 탭 → `Trend Data Collection` → `Run workflow`로 즉시 실행 가능
