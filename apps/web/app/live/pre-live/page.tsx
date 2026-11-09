import { Metadata } from 'next';
import PreLiveTitleCategoryScreen from '@/components/live/PreLiveTitleCategoryScreen';

export const metadata: Metadata = {
  title: 'Pre-Live Setup | Popo Live',
  description: 'Pre-live title, category selection, and cover image setup.',
};

export default function PreLivePage() {
  return <PreLiveTitleCategoryScreen />;
}
