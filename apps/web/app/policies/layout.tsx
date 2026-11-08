import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Popo Live Policies & Guidelines | Platform Rules, Privacy & Terms',
  description:
    'Learn about our platform policies, user responsibilities, privacy practices and community guidelines on Popo Live.',
  openGraph: {
    title: 'Popo Live Policies & Guidelines',
    description:
      'Explore official draft policies, privacy practices, terms of service, community standards, and virtual item guidelines.',
    type: 'website',
  },
};

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
