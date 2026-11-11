import React, { Suspense } from 'react';
import { TopupRechargeScreen } from '@/components/topup/TopupRechargeScreen';

export const dynamic = 'force-dynamic';

export default function RechargePage({
  searchParams,
}: {
  searchParams?: { preview?: string };
}) {
  const isPreview = searchParams?.preview === 'demo';
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0c0219]" />}>
      <TopupRechargeScreen previewMode={isPreview} />
    </Suspense>
  );
}
