import React from 'react';
import RoomLimitsScreen from '@/components/party/RoomLimitsScreen';

export const metadata = {
  title: 'Room Limits & Protection — Popo Live Party',
  description: 'Party Capacity, Seat Limits, and Protection Controls (Module 5.9)',
};

export default function RoomLimitsPage({
  params,
}: {
  params: { roomId: string };
}) {
  return <RoomLimitsScreen roomId={params.roomId} isHost={true} />;
}
