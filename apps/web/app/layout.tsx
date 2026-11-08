import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Popo Live — Design System & Component Library',
  description: 'Official unified UI/UX design system for the Popo Live streaming platform.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-popo-dark-950 text-popo-text-primary antialiased selection:bg-popo-pink selection:text-white">
        {children}
      </body>
    </html>
  );
}
