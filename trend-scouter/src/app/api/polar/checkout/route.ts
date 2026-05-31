import { NextResponse } from 'next/server';
import { Polar } from '@polar-sh/sdk';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const { productId, trendId, successPath } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ loginRequired: true }, { status: 401 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const accessToken = process.env.POLAR_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json({ error: 'Polar access token not configured' }, { status: 500 });
    }

    const polar = new Polar({
      accessToken,
      server: process.env.NEXT_PUBLIC_POLAR_SANDBOX === 'true' ? 'sandbox' : 'production',
    });

    const metadata: Record<string, string> = {};
    if (user?.id) metadata.user_id = user.id;
    if (trendId) metadata.trend_id = trendId;

    const separator = successPath?.includes('?') ? '&' : '?';
    const successUrl = `${siteUrl}${successPath || '/'}${separator}checkout_id={CHECKOUT_ID}`;

    const checkout = await polar.checkouts.create({
      products: [productId],
      metadata,
      successUrl,
      ...(user?.email ? { customerEmail: user.email } : {}),
    });

    return NextResponse.json({ url: checkout.url });
  } catch (error: any) {
    console.error('Polar checkout creation failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to create checkout' }, { status: 500 });
  }
}
