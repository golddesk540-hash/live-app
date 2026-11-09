import { Suspense } from 'react';
import { Metadata } from 'next';
import HostStudioScreen from '@/components/live/HostStudioScreen';

export const metadata: Metadata = {
  title: 'Host Studio | Popo Live',
  description: 'Live broadcast studio with real-time camera controls, filters, effects, and Agora RTC streaming.',
};

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070814] flex items-center justify-center text-pink-500 font-bold">Loading Studio...</div>}>
      <HostStudioScreen />
    </Suspense>
  );
}
