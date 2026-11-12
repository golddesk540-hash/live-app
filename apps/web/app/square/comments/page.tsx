import React, { Suspense } from 'react';
import { CommentsAndReportsScreen } from '@/components/comments/CommentsAndReportsScreen';

export const metadata = {
  title: 'Comments & Reports | Popo Live Square',
  description: 'Engage respectfully with comments, replies, and local safety reporting on Popo Live Square.',
};

export default function SquareCommentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0D041C] text-purple-200 flex items-center justify-center text-sm font-semibold">
          Loading Comments &amp; Reports...
        </div>
      }
    >
      <CommentsAndReportsScreen />
    </Suspense>
  );
}
