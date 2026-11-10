import { Suspense } from 'react';
import PKStartingBattleScreen from '@/components/pk/PKStartingBattleScreen';

export const metadata = {
  title: 'Start PK Battle - Popo Live',
  description: 'Invite a live host or find an opponent through random matchmaking.',
};

export default function PKRoomStartPage({
  params,
}: {
  params: { roomId: string };
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0d0718] flex items-center justify-center text-white">Loading...</div>}>
      <PKStartingBattleScreen
        currentRoomNumber={params.roomId}
        currentHostNickname={`Host #${params.roomId}`}
      />
    </Suspense>
  );
}
