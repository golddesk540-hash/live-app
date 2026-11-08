import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/languageContext';

export const metadata: Metadata = {
  title: 'Popo Live — Live Streaming & Social Entertainment Hub',
  description: 'Official Popo Live platform: Interactive live streaming, 9-seat voice lounges, and PK battles.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-popo-dark-950 text-popo-text-primary antialiased selection:bg-popo-pink selection:text-white">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
