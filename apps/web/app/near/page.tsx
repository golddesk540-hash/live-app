import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { DiscoveryShell } from '@/components/discovery/DiscoveryShell';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Near (Location) | Popo Live',
  description: 'Near location-based discovery feature for Popo Live. This feature is currently turned OFF by default.',
};

export default function NearPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080915] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <DiscoveryShell initialTab="near" />
    </Suspense>
  );
}
