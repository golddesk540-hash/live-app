import React from 'react';
import OrderAndClosingScreen from '@/components/party/OrderAndClosingScreen';

export const metadata = {
  title: 'Room Controls & Closing — Popo Live Party',
  description: 'Party Seat Order Management & Room Closing Lifecycle (Module 5.8)',
};

export default function RoomOrderClosingPage({
  params,
}: {
  params: { roomId: string };
}) {
  return <OrderAndClosingScreen roomId={params.roomId} isHost={true} />;
}
