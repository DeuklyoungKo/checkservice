import type { Metadata } from "next";
import { LegalPage, LegalSection, Bi } from "@/components/LegalPage";

export const metadata: Metadata = {
    title: "개인정보처리방침 / Privacy Policy",
    description: "Trend Scouter 개인정보처리방침 (Privacy Policy).",
    alternates: { canonical: "https://trend.gonsuit.com/privacy" },
};

export default function PrivacyPage() {
    return (
        <LegalPage titleKo="개인정보처리방침" titleEn="Privacy Policy" effectiveDate="2026-06-02">
            <LegalSection n={1} titleKo="수집하는 정보" titleEn="Information We Collect">
                <Bi
                    ko="① 계정 정보: 이메일 주소, Google 로그인 시 제공되는 프로필 정보(이름, 프로필 이미지). ② 이용 정보: 페이지 방문, 클릭, 기기·브라우저 정보 등. ③ 결제 정보: 결제는 Paddle을 통해 처리되며, 카드 전체 번호 등 민감 결제정보는 서비스가 직접 저장하지 않습니다."
                    en="(1) Account data: email address, and profile info (name, avatar) provided via Google login. (2) Usage data: page views, clicks, device/browser info. (3) Payment data: payments are processed by Paddle; we do not store full card numbers or sensitive payment details."
                />
            </LegalSection>

            <LegalSection n={2} titleKo="이용 목적" titleEn="How We Use Information">
                <Bi
                    ko="서비스 제공 및 계정 인증, 결제 및 콘텐츠 잠금 해제, 서비스 개선과 통계 분석, 고객 문의 응대, 법적 의무 이행을 위해 이용합니다."
                    en="To provide the Service and authenticate accounts, process payments and unlock content, improve the Service and run analytics, respond to inquiries, and comply with legal obligations."
                />
            </LegalSection>

            <LegalSection n={3} titleKo="제3자 처리위탁" titleEn="Third-Party Processors">
                <Bi
                    ko="서비스 운영을 위해 다음 사업자에 개인정보 처리를 위탁합니다: Supabase(데이터베이스·인증), Google(소셜 로그인·Google Analytics), Paddle(결제·세금), Vercel(호스팅·분석). 각 사업자는 자체 개인정보처리방침을 따릅니다."
                    en="We use the following processors to operate the Service: Supabase (database/auth), Google (social login, Google Analytics), Paddle (payments/tax), and Vercel (hosting/analytics). Each operates under its own privacy policy."
                />
            </LegalSection>

            <LegalSection n={4} titleKo="쿠키 및 분석" titleEn="Cookies & Analytics">
                <Bi
                    ko="서비스는 로그인 세션 유지 및 이용 통계 측정을 위해 쿠키와 분석 도구(Google Analytics, Vercel Analytics)를 사용합니다. 브라우저 설정에서 쿠키를 거부할 수 있으나 일부 기능이 제한될 수 있습니다."
                    en="We use cookies and analytics tools (Google Analytics, Vercel Analytics) to maintain login sessions and measure usage. You may disable cookies in your browser, though some features may be limited."
                />
            </LegalSection>

            <LegalSection n={5} titleKo="보유 및 파기" titleEn="Retention">
                <Bi
                    ko="개인정보는 수집 목적 달성 또는 회원 탈퇴 시까지 보유하며, 관련 법령에서 정한 경우 해당 기간 동안 보관 후 파기합니다."
                    en="We retain personal data until its purpose is fulfilled or you delete your account, except where law requires longer retention, after which it is destroyed."
                />
            </LegalSection>

            <LegalSection n={6} titleKo="이용자의 권리" titleEn="Your Rights">
                <Bi
                    ko="이용자는 자신의 개인정보에 대한 열람, 정정, 삭제, 처리정지를 요청할 수 있습니다. 요청은 trend@gonsuit.com으로 보내주시면 처리합니다."
                    en="You may request access to, correction of, deletion of, or restriction of processing of your personal data by emailing trend@gonsuit.com."
                />
            </LegalSection>

            <LegalSection n={7} titleKo="보안" titleEn="Security">
                <Bi
                    ko="서비스는 전송 구간 암호화(HTTPS) 및 접근 통제 등 합리적인 보호조치를 적용합니다."
                    en="We apply reasonable safeguards including encryption in transit (HTTPS) and access controls."
                />
            </LegalSection>

            <LegalSection n={8} titleKo="아동의 개인정보" titleEn="Children's Privacy">
                <Bi
                    ko="서비스는 만 14세 미만 아동을 대상으로 하지 않으며, 해당 아동의 개인정보를 고의로 수집하지 않습니다."
                    en="The Service is not directed to children under 14, and we do not knowingly collect their personal data."
                />
            </LegalSection>

            <LegalSection n={9} titleKo="개인정보 보호책임자" titleEn="Data Protection Contact">
                <Bi
                    ko="개인정보 관련 문의 및 권리 행사: trend@gonsuit.com"
                    en="For privacy inquiries and rights requests: trend@gonsuit.com"
                />
            </LegalSection>

            <LegalSection n={10} titleKo="방침의 변경" titleEn="Changes to This Policy">
                <Bi
                    ko="본 방침은 변경될 수 있으며, 중요한 변경 시 서비스 내 공지 또는 이메일로 안내합니다."
                    en="We may update this policy and will notify you of material changes via the Service or email."
                />
            </LegalSection>
        </LegalPage>
    );
}
