import React from 'react';
import PartyRulesScreen from '@/components/party/PartyRulesScreen';

export const metadata = {
  title: 'Party Room Rules — Popo Live Party',
  description: 'Party Rules & Safety Guidelines for Room (Module 5.10)',
};

export default function RoomRulesPage({
  params,
  searchParams,
}: {
  params: { roomId: string };
  searchParams: { userId?: string; isHost?: string };
}) {
  const roomId = params.roomId || '7001';
  const userId = searchParams?.userId || 'viewer_demo_01';
  const isHost = searchParams?.isHost === 'true';

  return (
    <div className="min-h-screen bg-[#070514] flex items-center justify-center py-6 px-2">
      <PartyRulesScreen roomId={roomId} userId={userId} isHost={isHost} />
    </div>
  );
}
