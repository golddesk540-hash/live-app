import { Suspense } from 'react';
import PKScoreTimerScreen from '@/components/pk/PKScoreTimerScreen';

export const metadata = {
  title: 'PK Battle Live Score & Timer - Popo Live',
  description: 'Real-time 1v1 PK battle screen with authoritative timer, synchronized scores, and live audience interaction.',
};

export default function PKBattlePage({ params }: { params: { battleId: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d091a] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-[#ff2d78] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-white/60">Connecting to PK Battle...</span>
          </div>
        </div>
      }
    >
      <PKScoreTimerScreen battleId={params.battleId} />
    </Suspense>
  );
}
