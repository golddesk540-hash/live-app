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
  const tab = (searchParams?.tab === 'following' || searchParams?.tab === 'new' || searchParams?.tab === 'pk')
    ? searchParams.tab
    : 'explore';

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080915] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
        </div>
      }
    >
      <DiscoveryShell initialTab={tab} />
    </Suspense>
  );
}
