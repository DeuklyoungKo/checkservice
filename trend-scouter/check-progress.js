const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, './.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProgress() {
    const { count: totalTrends } = await supabase.from('trends').select('*', { count: 'exact', head: true });
    const { count: analyzedTrends } = await supabase.from('analysis').select('*', { count: 'exact', head: true });

    console.log(`📊 Progress: ${analyzedTrends}/${totalTrends} analyzed.`);
}

checkProgress();
