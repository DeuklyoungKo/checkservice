const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const analysisData = [
    {
        trend_id: "35694c34-f3e9-47e2-8289-151e770443b0",
        score_revenue: 65,
        score_difficulty: 70,
        score_korea_potential: 50,
        summary: "신규 공급업체가 미국 도매업체에 접근하는 현실적인 방법(콜드 이메일, 샘플 전달 등)에 대한 실제 경험 기반 가이드.",
        business_model: "유료 정보 커뮤니티 또는 수출 컨설팅 서비스",
        gtm_strategy: "LinkedIn 및 수출 관련 커뮤니티를 통한 타겟팅 광고",
        tech_stack_suggestion: "Notion/Substack 기반의 유료 뉴스레터",
        korea_localization_tips: "한국의 중소 제조업체가 해외 판로를 개척할 때 실질적으로 적용 가능한 체크리스트 위주로 현지화 필요",
        ai_model: "antigravity-internal"
    },
    {
        trend_id: "d3f6b2aa-94bb-4319-8c5f-9d6e3f7d231b",
        score_revenue: 30,
        score_difficulty: 20,
        score_korea_potential: 40,
        summary: "1년 동안 구축한 프로젝트 중 가장 자랑스러운 작업과 그 이유, 그리고 수익 규모와 상관없는 배움에 대한 회고.",
        business_model: "개발자 커뮤니티 콘텐츠 또는 퍼스널 브랜딩",
        gtm_strategy: "디스콰이엇, 벨로그 등 개발자 커뮤니티 공유",
        tech_stack_suggestion: "Static Site Generator (Next.js/Astro)",
        korea_localization_tips: "한국 1인 개발자들의 고충과 성공 사례를 엮은 스토리텔링 강조",
        ai_model: "antigravity-internal"
    },
    {
        trend_id: "42c99562-d2a4-4fab-9249-239be0cde20a",
        score_revenue: 45,
        score_difficulty: 60,
        score_korea_potential: 55,
        summary: "AI 래퍼(Wrapper) 서비스가 아닌 독창적인 아이디어와 기술로 승부하는 비-AI 프로젝트 홍보 및 피드백 공간.",
        business_model: "니치 마켓 타겟팅 유틸리티 또는 전통 소프트웨어 서비스",
        gtm_strategy: "Product Hunt 및 니치 커뮤니티 피드백 중심",
        tech_stack_suggestion: "React/Node.js 또는 Rust 기반 도구",
        korea_localization_tips: "AI 홍수 속에서 차별화된 사용성을 강조하는 마케팅 전략 필요",
        ai_model: "antigravity-internal"
    },
    {
        trend_id: "6e6e5b4e-70f8-4245-8178-e389e7b9e0ea",
        score_revenue: 85,
        score_difficulty: 80,
        score_korea_potential: 75,
        summary: "뚜껑을 돌리거나 뒤집어서 프로젝트별 시간을 측정하고 기존 툴(Toggle, Clockify 등)과 연동되는 오프라인 장치.",
        business_model: "하드웨어 판매 + 클라우드 구독 모델",
        gtm_strategy: "와디즈/텀블벅 펀딩을 통한 초기 시장 진입",
        tech_stack_suggestion: "ESP32, Arduino, React Web Dashboard",
        korea_localization_tips: "데스크테리어 열풍과 연계하여 심미적인 디자인 강조 및 국내 협업 툴(Jandi 등) 연동 고려",
        ai_model: "antigravity-internal"
    },
    {
        trend_id: "e0b03704-54c7-4340-9a3c-96b6379963e6",
        score_revenue: 90,
        score_difficulty: 50,
        score_korea_potential: 80,
        summary: "드래그 앤 드롭만으로 웹사이트를 즉시 배포할 수 있는 극강의 단순함을 무기로 성공한 웹 호스팅 비즈니스 사례 분석.",
        business_model: "프리미엄 구독 (고급 도메인, 트래픽 등)",
        gtm_strategy: "디자이너 및 학생 타겟 마케팅, SNS 바이럴",
        tech_stack_suggestion: "AWS S3/CloudFront 기반 정적 호스팅 엔진",
        korea_localization_tips: "카페24 등 복잡한 호스팅에 지친 한국 소상공인/개인을 위한 '3초 배포' 컨셉 강조",
        ai_model: "antigravity-internal"
    },
    {
        trend_id: "c37fda51-0912-40c1-8551-4aa7ca609dc2",
        score_revenue: 75,
        score_difficulty: 75,
        score_korea_potential: 70,
        summary: "로컬에서 실행되는 AI를 통해 브라우징 내용 전체를 맥락에 맞게 검색하고 기억할 수 있게 해주는 도구.",
        business_model: "설치형 앱 구독 서비스 (개인 정보 보호 강조)",
        gtm_strategy: "생산성 툴 인플루언서 협업 및 베타 테스터 모집",
        tech_stack_suggestion: "Electron, Local LLM (Llama 3 등), Vector DB",
        korea_localization_tips: "보안에 민감한 한국 기업 및 전문직 종사자를 위한 '내 컴퓨터 안의 AI 비서' 컨셉 제안",
        ai_model: "antigravity-internal"
    }
];

async function applyAnalysis() {
    console.log('📡 Applying Korean analysis data...');
    for (const item of analysisData) {
        // 기존 데이터 삭제 (중복 방지)
        await supabase
            .from('analysis')
            .delete()
            .eq('trend_id', item.trend_id);

        // 새 데이터 삽입
        const { error } = await supabase
            .from('analysis')
            .insert(item);

        if (error) {
            console.error(`❌ Error applying evaluation for ${item.trend_id}:`, error.message);
        } else {
            console.log(`✅ Applied analysis for ${item.trend_id}`);
        }
    }
    console.log('🎉 Done!');
}

applyAnalysis();
