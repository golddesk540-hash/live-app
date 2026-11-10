import { Suspense } from 'react';
import PKResultScreen from '@/components/pk/PKResultScreen';

export const metadata = {
  title: 'PK Battle Result - Popo Live',
  description: 'Official PK battle result and winner declaration.',
};

export default function PKBattleResultPage({ params }: { params: { battleId: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d081e] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-[#ff2d78] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-white/60">Loading PK Battle Result...</span>
          </div>
        </div>
      }
    >
      <PKResultScreen battleId={params.battleId} />
    </Suspense>
  );
}
