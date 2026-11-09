import React from 'react';
import OrderAndClosingScreen from '@/components/party/OrderAndClosingScreen';

export const metadata = {
  title: 'Order and Closing — Popo Live Party',
  description: 'Party Seat Order Management & Room Closing Lifecycle (Module 5.8)',
};

export default function PartyOrderClosingPage({
  searchParams,
}: {
  searchParams: { roomId?: string };
}) {
  const roomId = searchParams?.roomId || '7001';
  return <OrderAndClosingScreen roomId={roomId} isHost={true} />;
}
