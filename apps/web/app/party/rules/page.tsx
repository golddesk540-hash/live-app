import React from 'react';
import PartyRulesScreen from '@/components/party/PartyRulesScreen';

export const metadata = {
  title: 'Party Rules — Popo Live Party',
  description: 'Party Rules, Safety Policies, and Community Guidelines (Module 5.10)',
};

export default function PartyRulesPage({
  searchParams,
}: {
  searchParams: { roomId?: string; userId?: string; isHost?: string };
}) {
  const roomId = searchParams?.roomId || '7001';
  const userId = searchParams?.userId || 'viewer_demo_01';
  const isHost = searchParams?.isHost === 'true';

  return (
    <div className="min-h-screen bg-[#070514] flex items-center justify-center py-6 px-2">
      <PartyRulesScreen roomId={roomId} userId={userId} isHost={isHost} />
    </div>
  );
}
