import React, { Suspense } from 'react';
import { Metadata } from 'next';
import CreatePartyScreen from '@/components/party/CreatePartyScreen';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Create a Party | Popo Live',
  description: 'Popo Live Module 5.1 Create a Party - 9-Seat Voice Chat & Entertainment Rooms',
};

export default function CreatePartyPage() {
  return (
    <main className="min-h-screen bg-[#070817] flex items-center justify-center p-0 sm:py-6">
      <Suspense
        fallback={
          <div className="w-full max-w-sm mx-auto min-h-screen bg-[#070817] text-white flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        }
      >
        <CreatePartyScreen />
      </Suspense>
    </main>
  );
}
