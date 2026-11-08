import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Become a Popo Live Agency Partner | Build Your Team. Support Creators. Grow Together.',
  description:
    'Join the Popo Live agency program and help creators build their presence through live streaming, social interaction and community activities.',
  openGraph: {
    title: 'Become a Popo Live Agency Partner — Popo Live',
    description:
      'Manage and support creators, track real-time performance, and grow your talent agency with Popo Live.',
    type: 'website',
  },
};

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
