'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  productId: string;
  trendId?: string;
  successPath?: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  children: React.ReactNode;
}

export function PolarCheckoutButton({
  productId,
  trendId,
  successPath,
  className,
  size = 'lg',
  variant = 'default',
  children,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/polar/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, trendId, successPath }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      window.location.href = data.url;
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert('결제 페이지를 여는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? '결제 페이지 로딩 중...' : children}
    </Button>
  );
}
