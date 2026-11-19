import React, { Suspense } from 'react';
import { DiscoveryShell } from '@/components/discovery/DiscoveryShell';
import { Loader2 } from 'lucide-react';

export const metadata = {
  title: 'Popo Live - Discovery & Live Broadcasting',
  description: 'Watch live video streams, party rooms, and PK battles on Popo Live.',
};

export default function LivePage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const tab = (searchParams?.tab === 'following' || searchParams?.tab === 'new')
    ? (searchParams.tab as any)
    : 'explore';

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-gray-900">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF1A6C]" />
        </div>
      }
    >
      <DiscoveryShell initialTab={tab} />
    </Suspense>
  );
}
