import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Popo Live — Connect. Share. Stream. Celebrate.',
  description:
    'Popo Live is a social live streaming platform where people can connect with others, join live rooms, share moments and enjoy interactive entertainment.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
