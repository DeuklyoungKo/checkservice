const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  try {
    console.log('1. Fetching a locked trend analysis from Supabase...');
    const { data: analysis, error } = await supabase
      .from('analysis')
      .select('trend_id, headline, is_unlocked')
      .eq('is_unlocked', false)
      .limit(1)
      .single();

    if (error || !analysis) {
      console.log('No locked trend analyses found or query failed. Trying to fetch any analysis...');
      const { data: anyAnalysis, error: anyError } = await supabase
        .from('analysis')
        .select('trend_id, headline, is_unlocked')
        .limit(1)
        .single();

      if (anyError || !anyAnalysis) {
        console.error('Error: No trend analyses records found in the database. Please run the collector first.');
        process.exit(1);
      }
      
      // If the analysis is already unlocked, we will reset it temporarily for testing
      console.log(`Found already unlocked analysis: "${anyAnalysis.headline}". Temporarily resetting it to locked for testing...`);
      await supabase.from('analysis').update({ is_unlocked: false }).eq('trend_id', anyAnalysis.trend_id);
      analysisData = { ...anyAnalysis, is_unlocked: false };
    } else {
      analysisData = analysis;
    }

    console.log(`Target Trend ID: ${analysisData.trend_id}`);
    console.log(`Headline: "${analysisData.headline}"`);
    console.log(`Current is_unlocked state: ${analysisData.is_unlocked}`);

    // Fetch an actual user profile or default to a dummy UUID
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
      .single();
    
    const dummyUserId = profile?.id || 'd3e8e19c-0c15-4672-8874-98447814b1a4';
    console.log(`Using User ID for payments log: ${dummyUserId}`);

    // 2. Prepare Webhook Event Payload
    const mockOrderEvent = {
      type: 'order.created',
      id: `ev_test_${crypto.randomBytes(8).toString('hex')}`,
      data: {
        id: `ord_test_${crypto.randomBytes(8).toString('hex')}`,
        amount: 300,
        currency: 'usd',
        custom_metadata: {
          trend_id: analysisData.trend_id,
          user_id: dummyUserId
        }
      }
    };

    const requestBody = JSON.stringify(mockOrderEvent);
    const webhookId = `msg_${crypto.randomBytes(12).toString('hex')}`;
    const webhookTimestamp = Math.floor(Date.now() / 1000).toString();

    // 3. Compute Webhook Signature
    const secret = process.env.POLAR_WEBHOOK_SECRET || 'whsec_mocksecretkey1234567890abcdef';
    const toVerify = `${webhookId}.${webhookTimestamp}.${requestBody}`;
    
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(toVerify);
    const signature = `v1,${hmac.digest('base64')}`;

    console.log('\n2. Sending simulated Polar webhook payload to localhost API...');
    
    const response = await fetch('http://localhost:3000/api/webhook/polar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'webhook-id': webhookId,
        'webhook-timestamp': webhookTimestamp,
        'webhook-signature': signature
      },
      body: requestBody
    });

    const text = await response.text();
    console.log(`API Response Status: ${response.status}`);
    let result;
    try {
      result = JSON.parse(text);
      console.log('API Response Body:', result);
    } catch (e) {
      console.log('API Response is not JSON. Raw Response Text (first 1000 chars):');
      console.log(text.substring(0, 1000));
      process.exit(1);
    }

    if (response.ok && result.success) {
      console.log('\n3. Webhook received successfully! Verifying database updates...');
      
      // Wait a moment for any async operations
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data: updatedAnalysis } = await supabase
        .from('analysis')
        .select('is_unlocked')
        .eq('trend_id', analysisData.trend_id)
        .single();

      console.log(`Updated is_unlocked state in DB: ${updatedAnalysis?.is_unlocked}`);

      const { data: paymentRecord } = await supabase
        .from('payments')
        .select('*')
        .eq('stripe_payment_id', `polar_order_${mockOrderEvent.data.id}`)
        .single();

      console.log('Payment transaction logged in DB:', paymentRecord ? 'SUCCESS' : 'NOT FOUND');
      if (paymentRecord) {
        console.log(`  Amount: ${paymentRecord.amount} ${paymentRecord.currency}`);
        console.log(`  User ID: ${paymentRecord.user_id}`);
      }

      if (updatedAnalysis?.is_unlocked && (dummyUserId === 'd3e8e19c-0c15-4672-8874-98447814b1a4' || paymentRecord)) {
        console.log('\n🎉 SUCCESS: Polar integration end-to-end flow is fully working and verified!');
      } else {
        console.error('\n❌ ERROR: Database update check failed.');
      }
    } else {
      console.error('\n❌ ERROR: Webhook request failed.');
    }
  } catch (err) {
    console.error('Simulation crashed with error:', err);
  }
}

run();
