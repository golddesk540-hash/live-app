import { NextRequest } from 'next/server';
import { handleVipOrderPost } from '@/lib/vipRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handleVipOrderPost(req, 'purchase');
}
