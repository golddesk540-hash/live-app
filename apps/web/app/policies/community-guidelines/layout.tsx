import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Guidelines | Popo Live Trust & Safety Standards',
  description:
    'Explore the Popo Live Community Guidelines promoting mutual respect, anti-harassment rules, strict 18+ safety standards, and zero-tolerance safety policies.',
};

export default function CommunityGuidelinesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
