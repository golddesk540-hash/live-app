import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Popo Live Legal Agreement',
  description:
    'Read the official Popo Live Terms of Service governing platform eligibility (18+), live streaming conduct, 9-seat party rooms, and virtual gift economy.',
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
