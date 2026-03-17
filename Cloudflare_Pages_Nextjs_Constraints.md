# Cloudflare Pages로 Next.js 프론트엔드 이전 시 고려사항 및 제약점

현재 **Vercel** 호스팅 기반으로 구축된 Next.js 14 (App Router) 프론트엔드 프로젝트를 **Cloudflare Pages**로 이전하려고 할 때 발생할 수 있는 주요 기술적 마찰(Friction)과 제약사항들을 정리한 문서입니다.

---

## 1. Node.js 런타임 미지원 (Edge Runtime 강제)
Vercel은 전통적인 강력한 Node.js 서버 환경을 지원하지만, Cloudflare Pages는 가볍고 빠른 **V8 Edge Worker (Isolates)** 기반으로 백엔드 로직을 실행합니다.
- **문제점:** Next.js의 API Route나 Server Actions에서 `fs`(파일 시스템 접근), `child_process`, `crypto` 등 **Node.js 전용 내장 모듈을 직접 호출하는 코드가 있다면 호환성 오류가 발생하며 앱이 죽게 됩니다.**
- **해결책:** 모든 서버 사이드 코드가 Edge 런타임에서 동작하도록 리팩토링 및 검증해야 합니다. (`next.config.ts` 및 라우팅 설정 파일 단위로 설정 필요)

## 2. 데이터베이스 드라이버 연결 제약 (e.g., `pg` 모듈)
Cloudflare의 Edge 환경은 기본적으로 Node.js의 네이티브 TCP 소켓 통신을 완벽히 지원하지 않습니다.
- **문제점:** 기존 `package.json`에 명시된 일반적인 RDBMS 드라이버 호환 패키지 모델(예: `"pg"`)이 작동하지 않을 가능성이 매우 높습니다.
- **현황 구제:** 다행히 현재 프로젝트 아키텍처는 REST API 기반으로 HTTP 통신을 수행하는 **Supabase 클라이언트 (`@supabase/supabase-js`)** 를 주력으로 사용하므로 이 부분에 있어서는 치명적인 문제가 덜합니다. 그러나 TCP 레벨의 ORM(Prisma 등)을 추후 도입한다면 Connection Pooler(e.g., Supavisor) 등 추가 세팅이 복잡하게 요구됩니다.

## 3. Next.js 내장 이미지 최적화 (`next/image`) 제약
- **문제점:** Vercel은 `<Image />` 컴포넌트 사용 시 글로벌 CDN 레벨에서 이미지 압축과 WebP 호환 변환을 자동으로 무상 지원해 줍니다. 반면, **Cloudflare Pages에서는 이 Vercel 고유의 이미지 최적화 엔진을 그대로 가져다 쓸 수 없습니다.**
- **해결책:** Cloudflare의 강력한 전용 유료 서비스인 **Cloudflare Images**를 연동하기 위해 수동으로 Custom Image Loader를 Next.js 프로젝트 설정 내에 별도 구현해야 합니다.

## 4. ISR (Incremental Static Regeneration) 캐싱 제약
- **문제점:** 백그라운드에서 주기적으로 캐시를 갱신해 정적 페이지처럼 빠르게 서빙하는 ISR 기능(`revalidate` 속성 등)은 Vercel 인프라에 깊게 맞물려 설계되어 있습니다.
- **결과:** Cloudflare Pages로 배포하기 위해 래핑을 거칠 경우(`@cloudflare/next-on-pages`), Next.js 고유의 ISR 캐시 메커니즘을 동일한 수준으로 통제하거나 무효화(Purge)하는 데 있어 Vercel보다 복잡도가 올라가고 지원 범위를 별도로 체크해야 합니다.

## 5. 빌드 및 배포 파이프라인의 복잡성
- **문제점:** Vercel 환경에서는 깃허브 푸시 시 `next build` 명령어로 간편하게 무결점 배포가 이뤄지지만, Cloudflare Pages에서는 반드시 **`@cloudflare/next-on-pages` 라는 별도의 CLI 변환 툴(Adapter)**을 거쳐야 합니다.
- **결과:** 빌드 시간이 길어질 수 있고, Vercel에서는 일어나지 않던 번들링 실패 에러나 엣지 호환성 툴링 에러를 디버깅해야 하는 추가적인 개발 오버헤드가 발생합니다.

---

### 💡 권장 아키텍처 전략 (결론)
Next.js 14 App Router는 설계상 탄생지인 **Vercel 생태계**에 가장 강력하게 최적화되어 있습니다. 기존에 Vercel이 암묵적으로 퍼포먼스를 쥐어짜주던 이미지 최적화, ISR 캐싱, Node.js 패키지 호환성 문제를 Cloudflare Pages에서 일일이 우회(Polyfill, Adapter, Custom Loader)하여 구축하는 것은 **"과도한 기술 부채 및 유지보수 비용"**을 낳습니다.

**프론트엔드 및 기본 Backend API는 현행대로 Vercel로 호스팅을 유지**하고, 크론 잡 기반의 무거운 데이터 수집 작업(Scraping) 엔진만 **Cloudflare Workers**로 완전히 분리해 구축하는 **'하이브리드 아키텍처'**가 비용과 생산성 측면에서 가장 이상적인 선택입니다.
