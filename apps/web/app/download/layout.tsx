import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Download Popo Live App | Android & iOS Live Streaming Community',
  description:
    'Download Popo Live and connect with people, join live streaming rooms, enjoy party rooms and discover social entertainment on Android and iOS.',
  openGraph: {
    title: 'Download Popo Live — Mobile App for Android & iOS',
    description:
      'Your live streaming community is just one tap away. Get Popo Live on Google Play and Apple App Store.',
    type: 'website',
  },
};

export default function DownloadLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
