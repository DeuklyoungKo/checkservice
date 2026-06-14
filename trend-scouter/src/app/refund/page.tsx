import type { Metadata } from "next";
import { LegalPage, LegalSection, Bi } from "@/components/LegalPage";

export const metadata: Metadata = {
    title: "환불 정책 / Refund Policy",
    description: "Trend Scouter 환불 정책 (Refund Policy).",
    alternates: { canonical: "https://trend.gonsuit.com/refund" },
};

export default function RefundPage() {
    return (
        <LegalPage titleKo="환불 정책" titleEn="Refund Policy" effectiveDate="2026-06-02">
            <LegalSection n={1} titleKo="디지털 상품의 특성" titleEn="Nature of Digital Goods">
                <Bi
                    ko="본 서비스가 판매하는 분석 리포트 및 AI 개발 브리프는 결제 즉시 제공되는 디지털 콘텐츠입니다. 콘텐츠 열람(잠금 해제)이 시작된 경우 「전자상거래법」에 따라 청약철회가 제한될 수 있습니다."
                    en="The analysis reports and AI development briefs sold by the Service are digital content delivered immediately upon payment. Once content has been accessed (unlocked), the right of withdrawal may be limited under applicable Korean e-commerce law."
                />
            </LegalSection>

            <LegalSection n={2} titleKo="환불 가능 조건" titleEn="Eligibility for Refund">
                <Bi
                    ko="다음의 경우 결제일로부터 7일 이내에 전액 환불을 요청할 수 있습니다: ① 결제 후 콘텐츠를 한 번도 열람하지 않은 경우, ② 기술적 오류로 콘텐츠가 제공되지 않은 경우, ③ 중복 결제된 경우."
                    en="You may request a full refund within 7 days of payment if: (1) the content has never been accessed after purchase, (2) the content was not delivered due to a technical error, or (3) the payment was duplicated."
                />
            </LegalSection>

            <LegalSection n={3} titleKo="환불 불가 사유" titleEn="Non-Refundable Cases">
                <Bi
                    ko="이미 콘텐츠를 열람·다운로드(복사)한 경우, 또는 결제일로부터 7일이 경과한 경우에는 원칙적으로 환불이 제한됩니다. 단, 명백한 서비스 하자가 있는 경우는 예외로 합니다."
                    en="Refunds are generally not available once content has been accessed or copied, or after 7 days from payment. Exceptions apply in cases of clear defects in the Service."
                />
            </LegalSection>

            <LegalSection n={4} titleKo="구독 결제" titleEn="Subscription Payments">
                <Bi
                    ko="월간 구독은 다음 결제일 이전에 언제든 해지할 수 있으며, 해지 시 다음 주기부터 청구가 중단됩니다. 이미 결제된 당월 구독료는 원칙적으로 환불되지 않습니다."
                    en="Monthly subscriptions can be cancelled anytime before the next billing date; cancellation stops charges from the next cycle. The current period's fee is generally non-refundable."
                />
            </LegalSection>

            <LegalSection n={5} titleKo="환불 요청 방법" titleEn="How to Request a Refund">
                <Bi
                    ko="환불 요청은 trend@gonsuit.com으로 결제 이메일, 주문번호, 사유와 함께 보내주십시오. 결제는 등록상인(Merchant of Record)인 Paddle을 통해 처리되므로, 승인된 환불은 Paddle을 통해 결제 수단으로 반환됩니다."
                    en="Email trend@gonsuit.com with your payment email, order ID, and reason. As payments are processed by Paddle (our Merchant of Record), approved refunds are returned to your payment method via Paddle."
                />
            </LegalSection>

            <LegalSection n={6} titleKo="처리 기간" titleEn="Processing Time">
                <Bi
                    ko="환불 요청은 영업일 기준 3~5일 이내에 검토·처리되며, 카드사·결제수단에 따라 실제 환급까지 추가 기간이 소요될 수 있습니다."
                    en="Refund requests are reviewed and processed within 3–5 business days; the actual refund may take additional time depending on your card issuer or payment method."
                />
            </LegalSection>

            <LegalSection n={7} titleKo="문의" titleEn="Contact">
                <Bi ko="문의: trend@gonsuit.com" en="Contact: trend@gonsuit.com" />
            </LegalSection>
        </LegalPage>
    );
}
