import React, { Suspense } from 'react';
import RecognitionCenterScreen from '@/components/recognition/RecognitionCenterScreen';

export const dynamic = 'force-dynamic';

export default function RecognitionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B031C] flex items-center justify-center text-white text-sm">
          Loading Wealth, Shining & Honor...
        </div>
      }
    >
      <RecognitionCenterScreen />
    </Suspense>
  );
}
