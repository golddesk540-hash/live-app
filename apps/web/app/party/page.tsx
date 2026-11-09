import React, { Suspense } from 'react';
import { DiscoveryShell } from '@/components/discovery/DiscoveryShell';
import { Loader2 } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Party Rooms & 9-Seat Voice Chat | Popo Live',
  description: 'Discover trending 9-seat party rooms, join voice chats, and hang out with friends on Popo Live.',
};

export default function PartyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080915] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#C026D3]" />
        </div>
      }
    >
      <DiscoveryShell initialTab="party" />
    </Suspense>
  );
}
