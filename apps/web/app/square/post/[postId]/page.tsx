import type { Metadata } from 'next';
import { SquarePostDetailScreen } from '@/components/square/SquarePostDetailScreen';

export const metadata: Metadata = {
  title: 'Post Details | Popo Live Square Web',
  description:
    'View full Square post details, comments, creator summary, and related community posts on Popo Live Web.',
};

export default function SquarePostDetailPage({
  params,
}: {
  params: { postId: string };
}) {
  return <SquarePostDetailScreen postId={params.postId} />;
}
