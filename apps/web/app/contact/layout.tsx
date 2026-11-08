import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Popo Live — We Are Here to Help You',
  description:
    'Have a question, need support or want to work with Popo Live? Send us a message and our global support team will be happy to assist you.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
