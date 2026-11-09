import { Suspense } from 'react';
import { Metadata } from 'next';
import ViewerRoomScreen from '@/components/live/ViewerRoomScreen';

export const metadata: Metadata = {
  title: 'Viewer Room | Popo Live',
  description: 'Watch live broadcasts, interact with hosts, send reactions, and follow creators on Popo Live.',
};

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070814] text-white flex flex-col items-center justify-center p-6">
          <div className="w-16 h-16 rounded-full border-4 border-pink-500/20 border-t-pink-500 animate-spin mb-4" />
          <p className="text-zinc-400 text-sm font-medium animate-pulse">Connecting to Live Room...</p>
        </div>
      }
    >
      <ViewerRoomScreen roomId={params.roomId} />
    </Suspense>
  );
}
