import React, { Suspense } from 'react';
import LiveChatScreen from '@/components/live/LiveChatScreen';

export const metadata = {
  title: 'Live Chat | Popo Live',
  description: 'Official Popo Live real-time live chat room module 4.5',
};

export default function LiveChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070814] flex items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-white/60">Loading Live Chat...</p>
          </div>
        </div>
      }
    >
      <LiveChatScreen />
    </Suspense>
  );
}
