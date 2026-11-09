import { Metadata } from 'next';
import GoLiveGatesScreen from '@/components/live/GoLiveGatesScreen';

export const metadata: Metadata = {
  title: 'Go Live Gates | Popo Live',
  description: 'Go-Live eligibility gates, face verification, cover image and wealth level check.',
};

export default function GoLivePage() {
  return <GoLiveGatesScreen />;
}
