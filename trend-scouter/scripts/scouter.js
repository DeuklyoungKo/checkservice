const { createClient } = require('@supabase/supabase-js');
const { fetchProductHuntTrends } = require('./scrapers/product_hunt');
const { fetchRedditTrends } = require('./scrapers/reddit');
require('dotenv').config({ path: '../.env.local' });

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
                allTrends.map(t => ({
                    ...t,
                    created_at: undefined, // Let DB handle creation time for new entries
                    // We can add logic to keep existing created_at if needed, but upsert handles it.
                })),
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
