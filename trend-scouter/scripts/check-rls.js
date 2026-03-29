const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ANON KEY로 테스트 (실제 앱과 동일 조건)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // anon key 사용
);

async function check() {
    console.log("=== ANON KEY로 테스트 ===");
    
    const { data: trends, error: te } = await supabase
        .from('trends')
        .select('id, source')
        .limit(3);
    if (te) console.error("trends 오류:", te.message);
    else console.log(`trends: ${trends?.length}개 조회됨`);

    const { data: analyses, error: ae } = await supabase
        .from('analysis')
        .select('id, trend_id, headline')
        .limit(3);
    if (ae) console.error("analysis 오류:", ae.message, ae.code);
    else console.log(`analysis: ${analyses?.length}개 조회됨`);
    analyses?.forEach(a => console.log(`  -> ${a.headline}`));
}

check();
