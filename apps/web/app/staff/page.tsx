import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import StaffPreviewTool from '@/components/staff/StaffPreviewTool';

export const metadata: Metadata = {
  title: 'Staff Preview (Test Rooms) | Popo Live',
  description: 'Internal testing and review tool for Popo Live authorized staff and QA engineers.',
};

export default function StaffPage() {
  return (
    <div className="min-h-screen bg-[#080915] text-white flex flex-col justify-start">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center text-white">
            <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
          </div>
        }
      >
        <StaffPreviewTool />
      </Suspense>
    </div>
  );
}
