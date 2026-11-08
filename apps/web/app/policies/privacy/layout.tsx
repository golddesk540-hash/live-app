import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Popo Live Legal & Platform Governance',
  description:
    'Read the Popo Live Privacy Policy regarding personal data collection, account security, profile information, user rights, and strict 18+ age verification.',
};

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
