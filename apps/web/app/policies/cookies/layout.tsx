import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookie Policy | Popo Live Privacy & Web Technologies',
  description:
    'Learn about essential session cookies, user preference storage, and browser controls utilized on Popo Live web applications.',
};

export default function CookiePolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
