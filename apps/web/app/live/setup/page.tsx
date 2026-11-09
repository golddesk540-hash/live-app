import { Metadata } from 'next';
import GoLiveGatesScreen from '@/components/live/GoLiveGatesScreen';

export const metadata: Metadata = {
  title: 'Go Live Setup | Popo Live',
  description: 'Go-Live eligibility gates, face verification, cover image and wealth level check for broadcasters.',
};

export default function GoLiveSetupPage() {
  return <GoLiveGatesScreen />;
}
