import { Suspense } from 'react';
import PKStartingBattleScreen from '@/components/pk/PKStartingBattleScreen';

export const metadata = {
  title: 'Starting a PK Battle (Invite / Random) - Popo Live',
  description: 'Invite live hosts or match randomly for a 1v1 PK battle in Popo Live.',
};

export default function PKStartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0718] flex items-center justify-center text-white">Loading...</div>}>
      <PKStartingBattleScreen />
    </Suspense>
  );
}
