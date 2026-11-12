import React, { Suspense } from 'react';
import { FanClubScreen } from '@/components/fan-club/FanClubScreen';

export const metadata = {
  title: 'Fan Club | Popo Live',
  description: 'Discover, view, and join your favorite Popo Live host fan communities, badges, and updates.',
};

export default function FanClubPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D041C] text-purple-200 flex items-center justify-center text-sm font-semibold">
          Loading Fan Club...
        </div>
      }
    >
      <FanClubScreen />
    </Suspense>
  );
}
