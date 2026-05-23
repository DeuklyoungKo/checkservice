import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { createHmac } from 'crypto'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('webhook-signature');
    const webhookId = request.headers.get('webhook-id');
    const webhookTimestamp = request.headers.get('webhook-timestamp');

    // 1. Signature Verification (If Webhook Secret is Configured)
    const secret = process.env.POLAR_WEBHOOK_SECRET;
    if (secret) {
      if (!signature || !webhookId || !webhookTimestamp) {
        console.error('Missing signature headers in Polar webhook');
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
      }

      // Concatenate for Svix/Standard Webhook format: msgId + "." + timestamp + "." + requestBodyString
      const toVerify = `${webhookId}.${webhookTimestamp}.${rawBody}`;
      
      // Svix/Standard Webhooks format:
      // The `webhook-signature` header contains space-separated signatures in the format: v1,base64_hash
      const signatures = signature.split(' ').map(s => {
        const parts = s.split(',');
        return parts.length === 2 && parts[0] === 'v1' ? parts[1] : '';
      }).filter(Boolean);

      // Base64 HMAC computation
      const hmacBase64 = createHmac('sha256', secret);
      hmacBase64.update(toVerify);
      const computedBase64 = hmacBase64.digest('base64');

      // Hex HMAC computation (generic signature fallback)
      const hmacHex = createHmac('sha256', secret);
      hmacHex.update(toVerify);
      const computedHex = hmacHex.digest('hex');

      const isSignatureValid = signatures.includes(computedBase64) || computedHex === signature;

      if (!isSignatureValid) {
        console.error('Invalid Polar webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    } else {
      console.warn('POLAR_WEBHOOK_SECRET is not configured. Skipping webhook signature verification.');
    }

    // 2. Parse Event
    const event = JSON.parse(rawBody);
    console.log('Received Polar Webhook event:', event.type);

    // 3. Process Success Events: 'order.created' or 'checkout.updated' (where status is succeeded)
    const isOrderCreated = event.type === 'order.created';
    const isCheckoutSucceeded = event.type === 'checkout.updated' && event.data?.status === 'succeeded';

    if (isOrderCreated || isCheckoutSucceeded) {
      const orderData = event.data;
      const metadata = orderData?.custom_metadata || orderData?.metadata;
      
      const trendId = metadata?.trend_id;
      const userId = metadata?.user_id;

      console.log(`Processing Polar payout for Trend ID: ${trendId}, User ID: ${userId}`);

      if (!trendId) {
        console.error('Missing trend_id in Polar order metadata');
        return NextResponse.json({ error: 'Missing trend_id in metadata' }, { status: 400 });
      }

      const supabaseAdmin = createAdminClient();

      // Update Trend Analysis is_unlocked status to globally unlock the report
      const { error: unlockError } = await supabaseAdmin
        .from('analysis')
        .update({ is_unlocked: true })
        .eq('trend_id', trendId);

      if (unlockError) {
        console.error('Error updating analysis unlocked state:', unlockError);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log(`Successfully unlocked trend analysis: ${trendId}`);

      // Record transaction if userId is present and not anonymous
      if (userId && userId !== 'anonymous') {
        const { error: paymentError } = await supabaseAdmin
          .from('payments')
          .insert([
            {
              user_id: userId,
              stripe_payment_id: `polar_order_${orderData.id || event.id}`,
              amount: orderData.amount || 300,
              currency: orderData.currency || 'usd',
              status: 'succeeded',
            },
          ]);

        if (paymentError) {
          console.error('Failed to log payment transaction:', paymentError);
          // Don't fail the request since the unlock was successful
        } else {
          console.log(`Log transaction successful for User ID: ${userId}`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Polar Webhook Server Exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
