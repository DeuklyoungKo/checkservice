const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
    // 최신 6개 트렌드
    const { data: trends } = await supabase
        .from('trends')
        .select('id, source, created_at')
        .order('created_at', { ascending: false })
        .limit(6);
    
    console.log("=== 최신 6개 트렌드 ===");
    trends?.forEach(t => console.log(`  ${t.source} | ${t.id} | ${t.created_at}`));

    const ids = trends?.map(t => t.id) || [];

    // 해당 트렌드들의 analysis
    const { data: analyses } = await supabase
        .from('analysis')
        .select('trend_id, headline')
        .in('trend_id', ids);
    
    console.log(`\n=== 매칭된 analysis (${analyses?.length || 0}개/6개) ===`);
    analyses?.forEach(a => console.log(`  ${a.trend_id}: ${a.headline}`));

    const unmapped = ids.filter(id => !analyses?.find(a => a.trend_id === id));
    console.log(`\n=== analysis 없는 트렌드 (${unmapped.length}개) ===`);
    unmapped.forEach(id => {
        const t = trends?.find(t => t.id === id);
        console.log(`  ${t?.source} | ${id}`);
    });
}

check();
