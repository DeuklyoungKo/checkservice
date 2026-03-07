const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugQuery() {
    console.log('📡 Running debug query (same as page.tsx)...');
    const { data, error } = await supabase
        .from('trends')
        .select(`
            *,
            analysis (
                score_revenue,
                score_difficulty,
                score_korea_potential,
                summary
            )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('✅ TREND_LIST_START');
        data.forEach(t => console.log(`${t.id} || ${t.title}`));
        console.log('✅ TREND_LIST_END');
    }
}

debugQuery();
