import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Popo Live News & Updates — Stay Connected. Stay Updated.',
  description:
    'Discover the latest platform updates, community announcements, creator activities and upcoming events from Popo Live.',
};

export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
