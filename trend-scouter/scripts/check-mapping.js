const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    // 1. trends 목록 확인
    const { data: trends } = await supabase
        .from('trends')
        .select('id, source, created_at')
        .limit(3);
    
    console.log("=== trends ===");
    trends?.forEach(t => console.log(`  id: ${t.id} | source: ${t.source}`));

    // 2. analysis 목록 확인
    const { data: analyses } = await supabase
        .from('analysis')
        .select('id, trend_id, headline, is_unlocked')
        .limit(3);
    
    console.log("\n=== analysis ===");
    analyses?.forEach(a => console.log(`  trend_id: ${a.trend_id} | headline: ${a.headline} | is_unlocked: ${a.is_unlocked}`));

    // 3. 직접 매핑 테스트
    if (trends?.length && analyses?.length) {
        const trendId = trends[0].id;
        const match = analyses.find(a => a.trend_id === trendId);
        console.log(`\n=== 매핑 테스트 ===`);
        console.log(`  trends[0].id: ${trendId}`);
        console.log(`  매핑된 analysis: ${match ? match.headline : "없음"}`);
        
        // in() 쿼리 테스트
        const ids = trends.map(t => t.id);
        const { data: inResult } = await supabase
            .from('analysis')
            .select('trend_id, headline')
            .in('trend_id', ids);
        console.log(`\n  in() 쿼리 결과 (${ids.length}개 ID): ${inResult?.length}개 매칭`);
        inResult?.forEach(r => console.log(`    -> ${r.trend_id}: ${r.headline}`));
    }
}

check();
