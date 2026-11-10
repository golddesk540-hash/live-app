import React from 'react';
import PKBattleTypeScreen from '@/components/pk/PKBattleTypeScreen';

export const metadata = {
  title: 'Configure PK Battle — Popo Live',
  description: 'Select PK Battle Format for Room (Module 6.1)',
};

export default function RoomPKBattleTypesPage({
  params,
  searchParams,
}: {
  params: { roomId: string };
  searchParams: { hostId?: string };
}) {
  const roomNumber = params.roomId || '7001';
  const hostId = searchParams?.hostId || 'host_maria_7001';

  return (
    <div className="min-h-screen bg-[#06040f] flex items-center justify-center py-6 px-2">
      <PKBattleTypeScreen roomNumber={roomNumber} hostId={hostId} />
    </div>
  );
}
