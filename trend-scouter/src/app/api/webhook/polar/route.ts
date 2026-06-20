import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { createHmac } from 'crypto'

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('webhook-signature');
    const webhookId = request.headers.get('webhook-id');
    const webhookTimestamp = request.headers.get('webhook-timestamp');

    // 1. Signature Verification
    const secret = process.env.POLAR_WEBHOOK_SECRET;
    if (secret && secret !== 'whsec_mocksecretkey1234567890abcdef') {
      if (!signature || !webhookId || !webhookTimestamp) {
        console.error('Missing signature headers in Polar webhook');
        return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
      }

      const toVerify = `${webhookId}.${webhookTimestamp}.${rawBody}`;

      const signatures = signature.split(' ').map(s => {
        const parts = s.split(',');
        return parts.length === 2 && parts[0] === 'v1' ? parts[1] : '';
      }).filter(Boolean);

      const hmac = createHmac('sha256', secret);
      hmac.update(toVerify);
      const computedBase64 = hmac.digest('base64');

      const isSignatureValid = signatures.includes(computedBase64);

      if (!isSignatureValid) {
        console.error('Invalid Polar webhook signature. computed:', computedBase64, 'received:', signatures);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      console.log('Webhook signature verified OK');
    } else {
      console.warn('Skipping webhook signature verification (mock or missing secret)');
    }

    // 2. Parse Event
    const event = JSON.parse(rawBody);
    console.log('Received Polar Webhook event:', event.type);
    console.log('Polar Webhook full payload:', JSON.stringify(event, null, 2));

    const supabaseAdmin = createAdminClient();

    // 3a. Individual report purchase: 'order.created' or 'checkout.updated' (succeeded)
    const isOrderCreated = event.type === 'order.created';
    const isCheckoutSucceeded = event.type === 'checkout.updated' && event.data?.status === 'succeeded';

    if (isOrderCreated || isCheckoutSucceeded) {
      const orderData = event.data;
      const metadata = orderData?.custom_metadata || orderData?.metadata;
      const trendId = metadata?.trend_id;
      const userId = metadata?.user_id;
      const isRecurring = orderData?.product?.is_recurring === true;

      console.log(`Processing checkout — recurring: ${isRecurring}, Trend: ${trendId}, User: ${userId}`);

      if (isRecurring && userId && userId !== 'anonymous') {
        // UPDATE 시도 (select로 실제 반영된 행 확인)
        const { data: updated, error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({ is_premium: true })
          .eq('id', userId)
          .select('id');

        if (updateError) {
          console.error('Failed to update is_premium:', updateError);
          return NextResponse.json({ error: 'Failed to grant premium' }, { status: 500 });
        }

        // 업데이트된 행이 없으면 새로 INSERT
        if (!updated || updated.length === 0) {
          const email = orderData?.customer_email || '';
          const { error: insertError } = await supabaseAdmin
            .from('user_profiles')
            .insert({ id: userId, email, is_premium: true });

          if (insertError) {
            console.error('Failed to insert user_profile:', insertError);
            return NextResponse.json({ error: 'Failed to grant premium' }, { status: 500 });
          }
          console.log(`Created new user_profile with premium for user: ${userId}`);
        }

        console.log(`Premium granted via checkout to user: ${userId}`);
      } else if (!isRecurring && trendId) {
        // 개별 리포트 결제 완료 → 결제한 '본인에게만' 잠금 해제 (전역 플래그 금지).
        // user_id가 없으면 권한을 부여할 대상을 특정할 수 없으므로 거부 (결제 전 로그인 필수 정책).
        if (!userId || userId === 'anonymous') {
          console.error('개별 결제에 user_id가 없어 unlock을 부여할 수 없습니다.', { trendId });
          return NextResponse.json({ error: 'Missing user_id for unlock' }, { status: 400 });
        }

        // upsert로 웹훅 재시도 시 중복 INSERT 방지 (UNIQUE(user_id, trend_id))
        const { error: unlockError } = await supabaseAdmin
          .from('unlocks')
          .upsert({ user_id: userId, trend_id: trendId }, { onConflict: 'user_id,trend_id' });

        if (unlockError) {
          console.error('Error inserting unlock:', unlockError);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }
        console.log(`Unlocked trend ${trendId} for user ${userId}`);
      }

      if (userId && userId !== 'anonymous') {
        const { error: paymentError } = await supabaseAdmin
          .from('payments')
          .insert([{
            user_id: userId,
            stripe_payment_id: `polar_order_${orderData.id || event.id}`,
            amount: orderData.amount || 0,
            currency: orderData.currency || 'krw',
            status: 'succeeded',
          }]);

        if (paymentError) {
          console.error('Failed to log payment:', paymentError);
        }
      }
    }

    // 3b. Subscription activated
    const isSubscriptionActive =
      event.type === 'subscription.created' ||
      (event.type === 'subscription.updated' && event.data?.status === 'active');

    if (isSubscriptionActive) {
      const subData = event.data;
      const metadata = subData?.custom_metadata || subData?.metadata || subData?.checkout_metadata;
      const userId = metadata?.user_id;

      console.log(`Subscription activated — User: ${userId}`);

      if (userId && userId !== 'anonymous') {
        const { error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update({ is_premium: true })
          .eq('id', userId);

        if (updateError) {
          console.error('Failed to set is_premium:', updateError);
          return NextResponse.json({ error: 'Failed to grant premium' }, { status: 500 });
        }
        console.log(`Premium granted to user: ${userId}`);
      }
    }

    // 3c. Subscription canceled / revoked
    const isSubscriptionRevoked =
      event.type === 'subscription.canceled' ||
      event.type === 'subscription.revoked' ||
      (event.type === 'subscription.updated' && ['canceled', 'revoked'].includes(event.data?.status));

    if (isSubscriptionRevoked) {
      const subData = event.data;
      const metadata = subData?.custom_metadata || subData?.metadata || subData?.checkout_metadata;
      const userId = metadata?.user_id;

      console.log(`Subscription revoked — User: ${userId}`);

      if (userId && userId !== 'anonymous') {
        const { error } = await supabaseAdmin
          .from('user_profiles')
          .update({ is_premium: false })
          .eq('id', userId);

        if (error) {
          console.error('Failed to revoke premium:', error);
        } else {
          console.log(`Premium revoked from user: ${userId}`);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Polar Webhook Server Exception:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
