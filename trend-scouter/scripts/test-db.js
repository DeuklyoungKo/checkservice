const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// .env.local 읽기
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDB() {
    console.log("--- Supabase Schema Diagnosis ---");
    
    // 1. Trends Check
    console.log("[1] Checking 'trends' table...");
    const { data: trends, error: tError } = await supabase.from('trends').select('*').limit(1);
    if (tError) {
        console.error("Trends Error:", tError.message);
    } else {
        console.log("Trends Columns:", Object.keys(trends[0] || {}));
        console.log("Trends Sample ID:", trends[0]?.id);
    }

    // 2. Analysis Check
    console.log("\n[2] Checking 'analysis' table...");
    const { data: analyses, error: aError } = await supabase.from('analysis').select('*').limit(1);
    if (aError) {
        console.error("Analysis Error:", aError.message);
    } else {
        console.log("Analysis Columns:", Object.keys(analyses[0] || {}));
        console.log("Analysis Sample trend_id:", analyses[0]?.trend_id);
    }

    // 3. Join Attempt
    console.log("\n[3] Testing Join...");
    const { data: joined, error: jError } = await supabase
        .from('trends')
        .select('*, analysis(headline)')
        .limit(1);
    
    if (jError) {
        console.error("Standard Join Failed:", jError.message);
        console.log("Attempting Join with explicit column hint...");
        const { data: joinedHint, error: jhError } = await supabase
            .from('trends')
            .select('*, analysis!trend_id(headline)')
            .limit(1);
        if (jhError) {
            console.error("Hint Join Also Failed:", jhError.message);
            console.log("\n>>> SOLUTION: We must use manual client-side join.");
        } else {
            console.log("Hint Join Success!");
        }
    } else {
        console.log("Standard Join Success!");
    }
}

testDB();
