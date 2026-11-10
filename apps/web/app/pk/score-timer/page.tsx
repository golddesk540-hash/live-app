import { Suspense } from 'react';
import PKScoreTimerScreen from '@/components/pk/PKScoreTimerScreen';

export const metadata = {
  title: '6.3 Battle Score & Timer - Popo Live',
  description: 'Module 6.3 Real-time 1v1 PK battle screen with split video, authoritative timer, and dynamic score comparison bar.',
};

export default function PKScoreTimerStandalonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d091a] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-[#ff2d78] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PKScoreTimerScreen battleId="00000000-0000-0000-0000-000000000603" />
    </Suspense>
  );
}
