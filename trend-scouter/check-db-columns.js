const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  console.log('📡 Checking columns for trends and analysis tables...');

  // 1. Check trends table
  const { data: trendCols, error: trendErr } = await supabase.rpc('get_column_names', { table_name: 'trends' });
  
  if (trendErr) {
    // If RPC doesn't exist, try a direct query (Supabase might allow this via certain views or we can use another method)
    console.log('--- Table: trends ---');
    const { data, error } = await supabase.from('trends').select('*').limit(1);
    if (error) console.error('Error fetching trends sample:', error);
    else console.log('Columns in trends:', Object.keys(data[0] || {}));
  } else {
    console.log('Columns in trends:', trendCols);
  }

  // 2. Check analysis table
  console.log('\n--- Table: analysis ---');
  const { data: analysisData, error: analysisErr } = await supabase.from('analysis').select('*').limit(1);
  if (analysisErr) console.error('Error fetching analysis sample:', analysisErr);
  else console.log('Columns in analysis:', Object.keys(analysisData[0] || {}));
}

checkColumns();
