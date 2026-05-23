import { POST } from '../src/app/api/webhook/polar/route';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testDirectly() {
  try {
    console.log('1. Fetching a locked trend analysis for testing...');
    const { data: analysis, error } = await supabase
      .from('analysis')
      .select('trend_id, headline, is_unlocked')
      .eq('is_unlocked', false)
      .limit(1)
      .single();

    let targetTrendId = '';
    if (error || !analysis) {
      const { data: anyAnalysis } = await supabase
        .from('analysis')
        .select('trend_id, headline, is_unlocked')
        .limit(1)
        .single();
      
      if (!anyAnalysis) {
        console.error('No trend analyses records found in DB.');
        process.exit(1);
      }
      targetTrendId = anyAnalysis.trend_id;
      // Reset to locked
      await supabase.from('analysis').update({ is_unlocked: false }).eq('trend_id', targetTrendId);
    } else {
      targetTrendId = analysis.trend_id;
    }

    console.log(`Target Trend ID: ${targetTrendId}`);

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
      .single();
    const dummyUserId = profile?.id || 'd3e8e19c-0c15-4672-8874-98447814b1a4';

    // 2. Mock Request Object
    const mockOrderEvent = {
      type: 'order.created',
      id: `ev_direct_${crypto.randomBytes(8).toString('hex')}`,
      data: {
        id: `ord_direct_${crypto.randomBytes(8).toString('hex')}`,
        amount: 300,
        currency: 'usd',
        custom_metadata: {
          trend_id: targetTrendId,
          user_id: dummyUserId
        }
      }
    };

    const requestBody = JSON.stringify(mockOrderEvent);
    const webhookId = `msg_direct_${crypto.randomBytes(12).toString('hex')}`;
    const webhookTimestamp = Math.floor(Date.now() / 1000).toString();

    // Webhook Signature secret
    const secret = process.env.POLAR_WEBHOOK_SECRET || 'whsec_mocksecretkey1234567890abcdef';
    const toVerify = `${webhookId}.${webhookTimestamp}.${requestBody}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(toVerify);
    const signature = `v1,${hmac.digest('base64')}`;

    console.log('\n2. Creating mock Request and executing POST route handler directly...');
    
    // We create a standard Request object
    const requestHeaders = new Headers({
      'Content-Type': 'application/json',
      'webhook-id': webhookId,
      'webhook-timestamp': webhookTimestamp,
      'webhook-signature': signature
    });

    const mockRequest = new Request('http://localhost:3000/api/webhook/polar', {
      method: 'POST',
      headers: requestHeaders,
      body: requestBody
    });

    // Execute the POST handler function directly!
    const response = await POST(mockRequest);
    const result = await response.json();

    console.log('Direct Route Invocation Result Status:', response.status);
    console.log('Result Body:', result);

    if (response.status === 200 && result.success) {
      console.log('\n3. Route executed successfully! Checking DB updates...');
      
      const { data: updatedAnalysis } = await supabase
        .from('analysis')
        .select('is_unlocked')
        .eq('trend_id', targetTrendId)
        .single();
      
      console.log(`is_unlocked in DB: ${updatedAnalysis?.is_unlocked}`);

      const { data: paymentRecord } = await supabase
        .from('payments')
        .select('*')
        .eq('stripe_payment_id', `polar_order_${mockOrderEvent.data.id}`)
        .single();
      
      console.log('Payment recorded in DB:', paymentRecord ? 'SUCCESS' : 'NOT FOUND');

      if (updatedAnalysis?.is_unlocked) {
        console.log('\n🎉 SUCCESS: Webhook POST handler function works flawlessly end-to-end!');
      } else {
        console.error('\n❌ ERROR: Database was not updated.');
      }
    } else {
      console.error('\n❌ ERROR: Direct invocation failed.');
    }
  } catch (err) {
    console.error('Direct test crashed with error:', err);
  }
}

testDirectly();
