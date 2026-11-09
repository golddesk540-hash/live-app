import React from 'react';
import WebPartyShowcaseScreen from '@/components/party/WebPartyShowcaseScreen';

export const metadata = {
  title: 'Web Party — Popo Live',
  description: 'Join Popo Live Party Rooms from any web browser or desktop device',
};

export default function WebPartyPage({
  searchParams,
}: {
  searchParams?: { roomId?: string };
}) {
  const roomId = searchParams?.roomId || '7001';

  return <WebPartyShowcaseScreen roomId={roomId} />;
}
