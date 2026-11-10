import React from 'react';
import PKBattleTypeScreen from '@/components/pk/PKBattleTypeScreen';

export const metadata = {
  title: 'PK Battle Types — Popo Live',
  description: 'Select PK Battle Format: 1v1 and Optional 4-Host (Module 6.1)',
};

export default function PKBattleTypesPage({
  searchParams,
}: {
  searchParams: { roomNumber?: string; hostId?: string };
}) {
  const roomNumber = searchParams?.roomNumber || '7001';
  const hostId = searchParams?.hostId || 'host_maria_7001';

  return (
    <div className="min-h-screen bg-[#06040f] flex items-center justify-center py-6 px-2">
      <PKBattleTypeScreen roomNumber={roomNumber} hostId={hostId} />
    </div>
  );
}
