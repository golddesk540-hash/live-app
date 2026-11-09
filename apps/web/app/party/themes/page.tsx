import React from 'react';
import PartyThemesScreen from '@/components/party/PartyThemesScreen';

export const metadata = {
  title: 'Party Themes — Popo Live',
  description: 'Customize and apply visual themes to Popo Live Party Rooms',
};

export default function PartyThemesPage({
  searchParams,
}: {
  searchParams?: { roomId?: string };
}) {
  const roomId = searchParams?.roomId || '7001';

  return <PartyThemesScreen roomId={roomId} isHost={true} />;
}
