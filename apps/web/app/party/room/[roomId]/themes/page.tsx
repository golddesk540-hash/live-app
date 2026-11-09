import React from 'react';
import PartyThemesScreen from '@/components/party/PartyThemesScreen';

export const metadata = {
  title: 'Room Party Themes — Popo Live',
  description: 'Customize and apply visual themes to Popo Live Party Rooms',
};

export default function RoomPartyThemesPage({
  params,
}: {
  params: { roomId: string };
}) {
  return <PartyThemesScreen roomId={params.roomId} isHost={true} />;
}
