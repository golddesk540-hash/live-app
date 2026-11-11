import React, { Suspense } from 'react';
import HostEarningsDashboard from '@/components/earnings/HostEarningsDashboard';

export const dynamic = 'force-dynamic';

export default async function HostEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ hostUserId?: string; userId?: string; preview?: string }>;
}) {
  const params = await searchParams;
  const hostUserId = params.hostUserId || params.userId || undefined;
  const isPreviewDemo = params.preview === 'demo';

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0c031c] flex items-center justify-center text-white text-sm">
          Loading Host Earnings Dashboard...
        </div>
      }
    >
      <HostEarningsDashboard initialHostUserId={hostUserId} isPreviewDemo={isPreviewDemo} />
    </Suspense>
  );
}
