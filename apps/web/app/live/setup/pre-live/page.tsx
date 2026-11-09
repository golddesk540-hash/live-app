import { Metadata } from 'next';
import PreLiveTitleCategoryScreen from '@/components/live/PreLiveTitleCategoryScreen';

export const metadata: Metadata = {
  title: 'Pre-Live Title & Category | Popo Live',
  description: 'Configure your broadcast title, select category, and prepare cover image before hosting.',
};

export default function PreLiveSetupPage() {
  return <PreLiveTitleCategoryScreen />;
}
