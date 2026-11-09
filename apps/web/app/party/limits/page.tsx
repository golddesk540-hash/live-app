import React from 'react';
import RoomLimitsScreen from '@/components/party/RoomLimitsScreen';

export const metadata = {
  title: 'Room Limits & Protection — Popo Live Party',
  description: 'Party Capacity, Seat Limits, and Protection Controls (Module 5.9)',
};

export default function PartyLimitsPage({
  searchParams,
}: {
  searchParams: { roomId?: string };
}) {
  const roomId = searchParams?.roomId || '7001';
  return <RoomLimitsScreen roomId={roomId} isHost={true} />;
}
