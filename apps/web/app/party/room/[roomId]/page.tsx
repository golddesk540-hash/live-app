import React from 'react';
import { Metadata } from 'next';
import SeatGridScreen from '@/components/party/SeatGridScreen';

export const metadata: Metadata = {
  title: '05_05 Audience and Chat | Popo Live',
  description: 'Official Popo Live Audience and Chat matching 05_05_audience_and_chat.png',
};

async function getPartyRoom(roomId: string) {
  try {
    const res = await fetch(`http://localhost:3000/api/party/${roomId}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.room) {
        return data.room;
      }
    }
  } catch {}

  return {
    id: 'party-demo',
    roomNumber: roomId,
    title: 'Party Room',
    category: 'Chill & Chat',
    categoryId: 'chill_chat',
    roomType: 'public',
    isPrivate: false,
    hostNickname: 'Maria Live',
    hostAvatar: '/assets/studio/host_zara_avatar.png',
    maxSeats: 9,
    currentMembers: 1,
    status: 'live',
    createdAt: new Date().toISOString(),
  };
}

export default async function PartyRoomPage({
  params,
  searchParams,
}: {
  params: { roomId: string };
  searchParams: { preview?: string };
}) {
  const room = await getPartyRoom(params.roomId);

  return <SeatGridScreen roomId={params.roomId} initialRoom={room} />;
}
