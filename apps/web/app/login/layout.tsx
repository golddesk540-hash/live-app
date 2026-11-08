import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In to Popo Live | Connect, Stream and Enjoy Together',
  description:
    'Sign in to Popo Live to watch live streams, enter 9-seat party rooms, send gifts, and connect with creators.',
  openGraph: {
    title: 'Log In — Popo Live',
    description: 'Welcome to Popo Live. Connect, stream and enjoy together.',
    type: 'website',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
