import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Virtual Items Policy | Popo Live Virtual Economy Guidelines',
  description:
    'Review the draft operational guidelines governing virtual coin purchases, digital gifts, 70% host conversion, transaction inquiries, and account dispute processes on Popo Live.',
};

export default function RefundsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
