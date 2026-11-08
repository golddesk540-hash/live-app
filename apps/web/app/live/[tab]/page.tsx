import React, { Suspense } from 'react';
import { DiscoveryShell, DiscoveryTab } from '@/components/discovery/DiscoveryShell';
import { Loader2 } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    { tab: 'explore' },
    { tab: 'following' },
    { tab: 'new' },
    { tab: 'pk' },
  ];
}

export function generateMetadata({ params }: { params: { tab: string } }) {
  const titles: Record<string, string> = {
    explore: 'Explore Live Streams | Popo Live',
    following: 'Followed Streamers | Popo Live',
    new: 'New Broadcasters | Popo Live',
    pk: 'Live PK Battles | Popo Live',
  };
  return {
    title: titles[params.tab] || 'Popo Live Discovery',
  };
}

export default function LiveTabRoute({ params }: { params: { tab: string } }) {
  const validTabs: DiscoveryTab[] = ['explore', 'following', 'new', 'pk'];
  if (!validTabs.includes(params.tab as DiscoveryTab)) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080915] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF2E74]" />
        </div>
      }
    >
      <DiscoveryShell initialTab={params.tab as DiscoveryTab} />
    </Suspense>
  );
}
