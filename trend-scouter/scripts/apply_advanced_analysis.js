const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const advancedAnalysis = [
    {
        trend_id: "dbadc5f4-5f96-49ad-91c1-4534aaa84c70",
        title: "Nearly: 안드로이드 전용 초정밀 가족 위치 추적 서비스",
        summary: "부모와 자녀를 위한 고성능/저전력 위치 추적 앱입니다. iOS의 백그라운드 실행 제한을 회피하지 않고, 안드로이드의 강점인 백그라운드 서비스 최적화를 활용하여 배터리 소모를 획기적으로 줄인 것이 특징입니다.",
        score_revenue: 85,
        score_difficulty: 75,
        score_korea_potential: 90,
        reasoning: "가족 안전은 지불 의사가 매우 높은 유료 서비스 시장입니다. 기존 Life360 등이 무겁고 배터리 소모가 심하다는 페인 포인트를 정확히 타격했습니다. 안드로이드 점유율이 높은 한국 시장에서 특히 유리합니다.",
        gtm_strategy: "국내 맘카페 및 초등 학부모 커뮤니티를 중심으로 '배터리 걱정 없는 위치 추적' 키워드로 소구하십시오. 학원 버스 위치 알림 서비스나 자녀 안심 귀가 서비스와 결합한 로컬 파트너십이 유효합니다."
    },
    {
        trend_id: "3616d247-b1f3-469f-ba95-6c0c4c81846e",
        title: "AI Gut Health: 사진 기반 장 건강 데이터 분석기",
        summary: "식단 사진을 찍으면 AI가 성분을 분석하고 장 건강 상태(복부 팽만, 통증 등)와 매칭하여 개인화된 리포트를 제공하는 웰니스 앱입니다.",
        score_revenue: 70,
        score_difficulty: 60,
        score_korea_potential: 80,
        reasoning: "과민성 대장 증후군 등 현대인의 고질적인 장 문제를 타겟팅합니다. 수동 입력의 번거로움을 사진 촬영으로 해결하여 사용자 리텐션을 확보할 수 있는 구조입니다.",
        gtm_strategy: "국내 헬스케어 스타트업이 강세인 만큼, 단순 기록을 넘어 '한국인 식단 전문 AI'임을 강조하십시오. 보충제(유산균) 이커머스 업체와의 제휴를 통한 고도화된 타겟 마케팅이 가능합니다."
    },
    {
        trend_id: "c7d7c93a-1d70-4d3f-87cc-c07d264dd5fc",
        title: "Hintoku: 전략 전수형 에듀테인먼트 스도쿠",
        summary: "단순히 문제를 푸는 것이 아니라, 스도쿠의 고난도 전략(X-Wing, XY-Chain 등)을 단계별로 가르치고 연습시키는 교육적 접근의 퍼즐 앱입니다.",
        score_revenue: 60,
        score_difficulty: 50,
        score_korea_potential: 75,
        reasoning: "전통적인 퍼즐 게임 시장에서 '자기계발'과 '두뇌 훈련'이라는 교육적 가치를 추가했습니다. 광고 없는 프리미엄 모델이나 전략 팩 결제 시스템으로 마이크로 수익화가 용이합니다.",
        gtm_strategy: "두뇌 교육에 관심이 많은 국내 시니어 층과 수험생 층을 동시에 공략하십시오. '두뇌 노화 방지'와 '논리 사고력 향상'이라는 테마로 브랜딩하는 것이 효과적입니다."
    }
];

async function applyAnalysis() {
    console.log('🚀 Applying advanced AI analysis to Supabase...');

    for (const data of advancedAnalysis) {
        // 컬럼이 아직 없으므로 summary에 reasoning과 gtm_strategy를 통합하여 저장합니다.
        // 추후 DB 확장이 완료되면 개별 컬럼으로 마이그레이션 가능합니다.
        const combinedSummary = `${data.summary}\n\n### 💡 점수 부여 근거 (Reasoning)\n${data.reasoning}\n\n### 🇰🇷 한국형 진입 전략 (GTM)\n${data.gtm_strategy}`;

        // 1. Update title in trends table
        const { error: tError } = await supabase
            .from('trends')
            .update({ title: data.title })
            .eq('id', data.trend_id);

        if (tError) {
            console.error(`❌ Error updating title for ${data.trend_id}:`, tError.message);
            continue;
        }

        // 2. Upsert into analysis table
        // analysis 테이블의 제약조건 때문에 delete 후 insert 하거나 upsert 규칙에 따라 처리
        await supabase.from('analysis').delete().eq('trend_id', data.trend_id);

        const { error: aError } = await supabase
            .from('analysis')
            .insert({
                trend_id: data.trend_id,
                summary: combinedSummary,
                score_revenue: data.score_revenue,
                score_difficulty: data.score_difficulty,
                score_korea_potential: data.score_korea_potential,
                ai_model: "antigravity-advanced-v1"
            });

        if (aError) {
            console.error(`❌ Error inserting analysis for ${data.trend_id}:`, aError.message);
        } else {
            console.log(`✅ Advanced analysis applied: ${data.title}`);
        }
    }

    console.log('🎉 Advanced AI analysis completed!');
}

applyAnalysis();
