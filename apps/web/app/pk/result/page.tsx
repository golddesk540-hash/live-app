import { Suspense } from 'react';
import PKResultScreen from '@/components/pk/PKResultScreen';

export const metadata = {
  title: 'PK Battle Result and Winner Declaration - Popo Live',
  description: 'Official server-authoritative PK battle result screen with winner crown, laurel wreath, and final scores.',
};

export default function PKResultStandalonePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d081e] flex items-center justify-center text-white">
          <div className="w-8 h-8 border-2 border-[#ff2d78] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PKResultScreen battleId="00000000-0000-0000-0000-000000000604" />
    </Suspense>
  );
}
