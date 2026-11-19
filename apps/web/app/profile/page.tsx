import React, { Suspense } from 'react';
import { DiscoveryShell } from '@/components/discovery/DiscoveryShell';
import { Loader2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile & Creator Centers | Popo Live',
  description: 'View your Popo Live profile, coin wallet, points balance, VIP status, and creator features.',
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center text-gray-900">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF1A6C]" />
        </div>
      }
    >
      <DiscoveryShell initialTab="profile" />
    </Suspense>
  );
}
