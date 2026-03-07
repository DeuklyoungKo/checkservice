const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const localizedData = [
    {
        id: "35694c34-f3e9-47e2-8289-151e770443b0",
        title: "성공적인 미국 도매 공략법",
        summary: "신규 공급업체가 미국 도매업체에 접근하는 현실적인 방법(콜드 이메일, 샘플 전달 등)에 대한 실제 경험 기반 가이드.",
        score: 65, difficulty: 70, potential: 50
    },
    {
        id: "5e43b111-2a4e-4d8f-92bf-98a30ab67b2d",
        title: "개인 정보 보호 중심 식품 성분 분석기",
        summary: "데이터 수집 없이 식품 라벨의 성분을 분석해주는 iOS 앱 개발 사례.",
        score: 55, difficulty: 40, potential: 65
    },
    {
        id: "64189951-7936-49b6-bb7d-ca71eea2af93",
        title: "인디해커스 게시물로 첫 사용자 확보하기",
        summary: "인디해커스 커뮤니티 활동 3일 만에 첫 사용자를 유치한 실제 전략과 경험담.",
        score: 45, difficulty: 30, potential: 60
    },
    {
        id: "7869da98-2bab-4f24-b2ed-30620904f53f",
        title: "중독성 있는 캡차(CAPTCHA) 게임 개발기",
        summary: "사용자의 분노를 유발하지만 중독성 강한 캡차 기반 게임 제작 과정.",
        score: 40, difficulty: 45, potential: 55
    },
    {
        id: "10c31ee6-8c74-4aba-b7d5-6bf881eeec47",
        title: "오픈소스 음성 AI 플랫폼: Vapi 대안",
        summary: "워드프레스처럼 쉽게 AI 음성 에이전트를 구축할 수 있는 오픈소스 플랫폼 프로젝트.",
        score: 85, difficulty: 75, potential: 80
    },
    {
        id: "0e7e06b1-8afb-4b0c-88b5-f2cbadb8c083",
        title: "바이브 코딩으로 사이드 프로젝트 완성하기",
        summary: "기분대로 코딩하다 망할 뻔한 프로젝트를 명확한 스펙 정의로 살려낸 워크플로우 공유.",
        score: 35, difficulty: 25, potential: 45
    },
    {
        id: "ed12a649-7cc8-4da8-8860-a8a11cbd18bf",
        title: "AI 생성 앱 전용 소셜 플랫폼 런칭",
        summary: "AI가 만든 앱들을 공유하고 즐길 수 있는 새로운 개념의 소셜 플랫폼 개발기.",
        score: 75, difficulty: 65, potential: 70
    },
    {
        id: "ac11f78f-fd8e-4474-9de6-4b2689c20866",
        title: "무료 화이트 노이즈 iOS 앱: 박스팬",
        summary: "매달 나가는 구독료가 아까워 직접 만든 네이티브 화이트 노이즈 앱 개발 및 테스터 모집.",
        score: 50, difficulty: 35, potential: 60
    },
    {
        id: "c65603df-2a26-4d9c-adbb-ae64eee3822e",
        title: "전통적인 웹 호스팅 시장에서 틈새 성공 전략",
        summary: "JP 모건 퇴사 후 대기업들이 점유한 호스팅 시장에서 틈새 고객을 공략해 성공한 실전 분석.",
        score: 80, difficulty: 60, potential: 75
    },
    {
        id: "c37fda51-0912-40c1-8551-4aa7ca609dc2",
        title: "나만의 AI 브라우징 메모리: OCNO",
        summary: "로컬에서 실행되는 AI를 통해 브라우징 내용 전체를 맥락에 맞게 검색하고 기억하는 도구.",
        score: 75, difficulty: 75, potential: 70
    }
];

async function runLocalization() {
    console.log('📡 Starting full localization update...');

    for (const item of localizedData) {
        // 1. Update trends table (title)
        const { error: tError } = await supabase
            .from('trends')
            .update({ title: item.title })
            .eq('id', item.id);

        if (tError) {
            console.error(`❌ Error updating title for ${item.id}:`, tError.message);
            continue;
        }

        // 2. Clear old analysis and insert new one
        await supabase.from('analysis').delete().eq('trend_id', item.id);
        const { error: aError } = await supabase
            .from('analysis')
            .insert({
                trend_id: item.id,
                summary: item.summary,
                score_revenue: item.score,
                score_difficulty: item.difficulty,
                score_korea_potential: item.potential,
                ai_model: "antigravity-localizer"
            });

        if (aError) {
            console.error(`❌ Error applying analysis for ${item.id}:`, aError.message);
        } else {
            console.log(`✅ Fully localized: ${item.title} (${item.id})`);
        }
    }

    console.log('🎉 Localization update completed!');
}

runLocalization();
