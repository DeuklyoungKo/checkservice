const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
    // 1. analysis 현재 개수
    const { data: rows, error: countErr } = await sb.from('analysis').select('trend_id');
    console.log('analysis 현재 개수:', rows?.length, '| 에러:', countErr?.message || 'none');

    // 2. 아무 trend id 가져오기
    const { data: trend, error: tErr } = await sb.from('trends').select('id').limit(1).single();
    console.log('테스트 trend_id:', trend?.id, '| 에러:', tErr?.message || 'none');

    if (!trend) return;

    // 3. analysis upsert 시도
    const { data, error } = await sb.from('analysis').upsert({
        trend_id: trend.id,
        headline: '테스트 헤드라인',
        pufe_total: 50,
        pain_category: 'Test',
        summary: '테스트 요약',
        ai_model: 'test'
    }, { onConflict: 'trend_id' });

    console.log('upsert data:', data);
    console.log('upsert error:', error?.message || 'none', error?.details || '');
    console.log('upsert error code:', error?.code || 'none');
}

test().catch(e => console.error('Fatal:', e.message));
