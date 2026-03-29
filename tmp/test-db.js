const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../trend-scouter/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDB() {
    console.log("Checking 'trends' table...");
    const { data: trends, error: tError } = await supabase.from('trends').select('*').limit(1);
    if (tError) console.error("Trends Error:", tError);
    else console.log("Trends Sample:", JSON.stringify(trends, null, 2));

    console.log("\nChecking 'analysis' table...");
    const { data: analysis, error: aError } = await supabase.from('analysis').select('*').limit(1);
    if (aError) console.error("Analysis Error:", aError);
    else console.log("Analysis Sample:", JSON.stringify(analysis, null, 2));

    if (trends && trends.length > 0 && analysis && analysis.length > 0) {
        console.log("\nTesting manual join in script...");
        const { data: joined, error: jError } = await supabase
            .from('trends')
            .select('*, analysis(*)')
            .eq('id', trends[0].id);
        
        if (jError) {
            console.error("Join Failed as expected:", jError.message);
            console.log("Attempting with !hint...");
            const { data: joinedHint, error: jhError } = await supabase
                .from('trends')
                .select('*, analysis!trend_id(*)')
                .eq('id', trends[0].id);
            if (jhError) console.error("Hint Also Failed:", jhError.message);
            else console.log("Hint Succeeded!");
        } else {
            console.log("Join Succeeded without hint!");
        }
    }
}

testDB();
