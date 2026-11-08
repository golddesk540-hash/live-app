import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reset Your Password | Popo Live Account Recovery',
  description:
    'Reset your Popo Live account password via email or verified mobile phone number.',
  openGraph: {
    title: 'Reset Your Password — Popo Live',
    description: 'Enter your email or phone number to recover access to your Popo Live account.',
    type: 'website',
  },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
