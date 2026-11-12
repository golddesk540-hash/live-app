import type { Metadata } from 'next';
import { VideoCallDisabledScreen } from '@/components/video-call/VideoCallDisabledScreen';

export const metadata: Metadata = {
  title: '1-to-1 Video Calls (OFF) | Popo Live',
  description:
    '1-to-1 video calls are disabled by default on Popo Live until client approval.',
};

export default function VideoCallPage() {
  return <VideoCallDisabledScreen />;
}
