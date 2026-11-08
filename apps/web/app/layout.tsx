import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/languageContext';
import PoppoTermsGate from '@/components/poppo/PoppoTermsGate';

export const metadata: Metadata = {
  title: 'Poppo Live — Live Streaming & Social Entertainment Hub',
  description:
    'Poppo Live official platform: Live broadcasting, 9-seat party audio lounges, PK battles, and global creator community.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased selection:bg-[#5653FE] selection:text-white">
        <LanguageProvider>
          <PoppoTermsGate />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
