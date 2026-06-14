/**
 * GA4 커스텀 이벤트 트래킹 헬퍼.
 *
 * `window.gtag`(layout.tsx에서 로드됨)로 이벤트를 전송한다.
 * 베타 기간(~2026-08-31) "데이터가 실제로 가치 있는가" 검증 지표 수집용.
 *
 * 측정 이벤트:
 * - brief_copied       : AI 개발 브리프 복사 (← 핵심 가치 지표)
 * - beta_email_signup  : 베타 이메일 등록 완료
 * - trend_detail_view  : 트렌드 상세 페이지 진입
 * - bookmark_added     : 북마크 추가
 */

type GtagFn = (
    command: "event",
    eventName: string,
    params?: Record<string, unknown>
) => void;

type EventParams = Record<string, string | number | boolean>;

export function trackEvent(name: string, params?: EventParams): void {
    if (typeof window === "undefined") return;
    const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
    if (typeof gtag === "function") {
        gtag("event", name, params);
    }
}
