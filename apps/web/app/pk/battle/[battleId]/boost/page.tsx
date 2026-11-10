import { Suspense } from 'react';
import PKWinnerBoostScreen from '@/components/pk/PKWinnerBoostScreen';

export const metadata = {
  title: 'PK Winner Boost - Popo Live',
  description: 'Active PK Winner Boost reward screen.',
};

export default function PKBattleBoostPage({ params }: { params: { battleId: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d081e] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-[#ff2d78] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-white/60">Loading Winner Boost...</span>
          </div>
        </div>
      }
    >
      <PKWinnerBoostScreen battleId={params.battleId} />
    </Suspense>
  );
}
