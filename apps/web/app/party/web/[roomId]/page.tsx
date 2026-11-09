import React from 'react';
import WebPartyRoomScreen from '@/components/party/WebPartyRoomScreen';

export const metadata = {
  title: 'Web Party Room — Popo Live',
  description: 'Nine-Seat Web Voice Chat and Video Party on Popo Live',
};

export default function WebPartyRoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  return <WebPartyRoomScreen roomId={params.roomId} />;
}
