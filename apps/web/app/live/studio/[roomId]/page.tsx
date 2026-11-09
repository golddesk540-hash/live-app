import { Suspense } from 'react';
import { Metadata } from 'next';
import HostStudioScreen from '@/components/live/HostStudioScreen';

export const metadata: Metadata = {
  title: 'Host Studio Room | Popo Live',
  description: 'Live broadcast studio room for host broadcasting.',
};

export default function StudioRoomPage({ params }: { params: { roomId: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070814] flex items-center justify-center text-pink-500 font-bold">Loading Studio...</div>}>
      <HostStudioScreen initialRoomId={params.roomId} />
    </Suspense>
  );
}
