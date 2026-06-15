import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - sitemap.xml / robots.txt / opengraph-image (공개 메타데이터 — 크롤러·SNS가
         *   비로그인으로 접근하므로 /login 리다이렉트 대상에서 제외)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
