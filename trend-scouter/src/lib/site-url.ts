import { headers } from "next/headers";

/**
 * 현재 요청의 실제 도메인(origin)을 반환한다.
 *
 * `NEXT_PUBLIC_SITE_URL` 환경변수에 의존하지 않고 요청 헤더에서 호스트를 읽으므로,
 * 배포 도메인이 바뀌거나 환경변수를 깜빡해도 항상 올바른 도메인으로 동작한다.
 * (OAuth redirect가 옛 ngrok/로컬 주소로 가는 사고 방지용)
 *
 * 서버 컴포넌트 / 서버 액션 / 라우트 핸들러에서만 사용 가능.
 */
export async function getSiteUrl(): Promise<string> {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");

    if (host) {
        const proto =
            h.get("x-forwarded-proto") ??
            (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
        return `${proto}://${host}`;
    }

    // 폴백: 헤더를 못 얻은 예외 상황
    return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
