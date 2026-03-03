const { createClient } = require('@supabase/supabase-js');
const { fetchProductHuntTrends } = require('./scrapers/product_hunt');
const { fetchRedditTrends } = require('./scrapers/reddit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role Key for backend scripts

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase credentials missing in .env.local.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runScouter() {
    console.log('🚀 Starting Scouter Sub-agent...');

    const allTrends = [];

    // 1. Fetch from Product Hunt
    console.log('📡 Fetching trends from Product Hunt...');
    const phTrends = await fetchProductHuntTrends();
    allTrends.push(...phTrends);

    // 2. Fetch from Reddit
    console.log('📡 Fetching trends from Reddit...');
    const redditTrends = await fetchRedditTrends();
    allTrends.push(...redditTrends);

    console.log(`📊 Total ${allTrends.length} trends collected.`);

    // 3. Save to Supabase
    if (allTrends.length > 0) {
        console.log('💾 Saving to Supabase...');
        const { error } = await supabase
            .from('trends')
            .upsert(
                allTrends.map(t => {
                    const { ...trend } = t;
                    // Remove created_at from the map if you want the DB default to ALWAYS work for new rows, 
                    // or keep it if you want to use the source's timestamp.
                    // Given the scrapers provide one, we should use it but ensure it's not null.
                    if (!trend.created_at) delete trend.created_at;
                    return trend;
                }),
                { onConflict: 'source,external_id' }
            );

        if (error) {
            console.error('❌ Error saving to Supabase:', error.message);
        } else {
            console.log('✅ Successfully saved all trends.');
        }
    }
}

runScouter().catch(err => {
    console.error('💥 Scouter failed:', err.message);
});
