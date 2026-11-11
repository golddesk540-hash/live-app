import React from 'react';
import AnimationsAndEntrancesScreen from '@/components/animations/AnimationsAndEntrancesScreen';

export const dynamic = 'force-dynamic';

export default function AnimationsPage({
  searchParams,
}: {
  searchParams?: { pkBattleId?: string; roomId?: string; preview?: string };
}) {
  return (
    <AnimationsAndEntrancesScreen
      initialPkBattleId={
        searchParams?.pkBattleId || '00000000-0000-0000-0000-000000000606'
      }
      initialRoomId={searchParams?.roomId || '880219'}
      previewDemo={searchParams?.preview !== '0'}
    />
  );
}
