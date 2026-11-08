import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Your Popo Live Account | Sign Up (Strict 18+)',
  description:
    'Join Popo Live today. Create your account to start live streaming, join 9-seat party rooms, and connect with global creators.',
  openGraph: {
    title: 'Create Your Popo Live Account',
    description: 'Join the premier live streaming social community. Strict 18+ platform.',
    type: 'website',
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
