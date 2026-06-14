import type { Metadata } from "next";
import { LegalPage, LegalSection, Bi } from "@/components/LegalPage";

export const metadata: Metadata = {
    title: "이용약관 / Terms of Service",
    description: "Trend Scouter 서비스 이용약관 (Terms of Service).",
    alternates: { canonical: "https://trend.gonsuit.com/terms" },
};

export default function TermsPage() {
    return (
        <LegalPage titleKo="이용약관" titleEn="Terms of Service" effectiveDate="2026-06-02">
            <LegalSection n={1} titleKo="목적" titleEn="Purpose">
                <Bi
                    ko="본 약관은 Trend Scouter(이하 '서비스')가 제공하는 트렌드 분석 및 AI 개발 브리프 콘텐츠의 이용 조건과 절차, 이용자와 서비스 제공자의 권리·의무를 규정합니다."
                    en="These Terms govern your use of Trend Scouter (the 'Service'), which provides trend analysis and AI development brief content, and define the rights and obligations of users and the provider."
                />
            </LegalSection>

            <LegalSection n={2} titleKo="서비스 내용" titleEn="Service Description">
                <Bi
                    ko="서비스는 공개 커뮤니티 데이터를 기반으로 한 통계 분석(PUFE 스코어), AI가 생성한 개발 브리프, 한국 시장 수요 검증 데이터를 제공합니다. 제공되는 정보는 참고용이며, 특정 사업의 성공이나 수익을 보장하지 않습니다."
                    en="The Service provides statistical analysis (PUFE score) based on public community data, AI-generated development briefs, and Korean market demand validation data. All information is for reference only and does not guarantee the success or profitability of any business."
                />
            </LegalSection>

            <LegalSection n={3} titleKo="계정 및 회원가입" titleEn="Accounts">
                <Bi
                    ko="일부 기능은 이메일 또는 소셜(Google) 로그인이 필요합니다. 이용자는 계정 정보를 정확히 제공하고 안전하게 관리할 책임이 있습니다."
                    en="Some features require email or social (Google) login. You are responsible for providing accurate account information and keeping your credentials secure."
                />
            </LegalSection>

            <LegalSection n={4} titleKo="결제 및 판매자(MoR)" titleEn="Payments & Merchant of Record">
                <Bi
                    ko="유료 콘텐츠 결제는 등록상인(Merchant of Record)인 Paddle.com Market Limited를 통해 처리됩니다. 결제, 세금, 환불 처리는 Paddle의 약관도 함께 적용됩니다."
                    en="Payments for paid content are processed by Paddle.com Market Limited, our Merchant of Record. Paddle's terms also apply to billing, taxes, and refunds."
                />
                <Bi
                    ko="가격 및 결제 수단은 결제 시점 화면에 표시됩니다. 환불은 별도의 환불 정책을 따릅니다."
                    en="Prices and payment methods are shown at checkout. Refunds are governed by our separate Refund Policy."
                />
            </LegalSection>

            <LegalSection n={5} titleKo="이용자의 의무" titleEn="User Obligations">
                <Bi
                    ko="이용자는 콘텐츠를 무단으로 복제·재판매·대량 추출(크롤링)하거나 서비스 운영을 방해하는 행위를 해서는 안 됩니다."
                    en="You may not copy, resell, or bulk-extract (scrape) content without authorization, nor interfere with the operation of the Service."
                />
            </LegalSection>

            <LegalSection n={6} titleKo="지식재산권" titleEn="Intellectual Property">
                <Bi
                    ko="서비스가 생성·제공하는 분석 결과, 브리프, UI 및 관련 자료의 권리는 서비스 제공자에게 있습니다. 구매한 이용자는 개인적·내부적 사용 목적의 라이선스를 부여받습니다."
                    en="All analysis, briefs, UI, and related materials are owned by the provider. Paying users receive a license for personal and internal use."
                />
            </LegalSection>

            <LegalSection n={7} titleKo="면책 및 책임의 한계" titleEn="Disclaimer & Limitation of Liability">
                <Bi
                    ko="서비스는 정보를 '있는 그대로' 제공하며, 정보의 정확성·완전성이나 이를 활용한 결과에 대해 보증하지 않습니다. 관련 법이 허용하는 범위에서 간접·부수적 손해에 대한 책임을 지지 않습니다."
                    en="The Service is provided 'as is' without warranty of accuracy or completeness, or of outcomes from its use. To the extent permitted by law, we are not liable for indirect or incidental damages."
                />
            </LegalSection>

            <LegalSection n={8} titleKo="서비스 변경 및 중단" titleEn="Modifications">
                <Bi
                    ko="서비스 제공자는 서비스 내용을 변경하거나 운영상·기술상 필요에 따라 전부 또는 일부를 중단할 수 있습니다."
                    en="We may modify the Service or suspend it in whole or in part for operational or technical reasons."
                />
            </LegalSection>

            <LegalSection n={9} titleKo="준거법 및 분쟁해결" titleEn="Governing Law">
                <Bi
                    ko="본 약관은 대한민국 법률에 따라 해석되며, 분쟁은 서비스 제공자 소재지 관할 법원을 1심 법원으로 합니다."
                    en="These Terms are governed by the laws of the Republic of Korea, and disputes shall be subject to the court having jurisdiction over the provider's location."
                />
            </LegalSection>

            <LegalSection n={10} titleKo="문의" titleEn="Contact">
                <Bi ko="문의: trend@gonsuit.com" en="Contact: trend@gonsuit.com" />
            </LegalSection>
        </LegalPage>
    );
}
