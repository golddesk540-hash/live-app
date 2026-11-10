import { Suspense } from 'react';
import PKWinnerBoostScreen from '@/components/pk/PKWinnerBoostScreen';

export const metadata = {
  title: '6.5 Winner Boost System - Popo Live',
  description: 'Official server-authoritative PK winner boost screen with 30-minute point multiplier countdown and rocket highlight.',
};

export default function PKWinnerBoostStandalonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d081e] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-[#ff2d78] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PKWinnerBoostScreen battleId="00000000-0000-0000-0000-000000000604" />
    </Suspense>
  );
}
