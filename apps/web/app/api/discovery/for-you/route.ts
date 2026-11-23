import { NextRequest, NextResponse } from 'next/server';
import { GET as exploreGet } from '@/app/api/discovery/explore/route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.searchParams.set('tab', 'for_you');
  const modifiedReq = new NextRequest(url.toString(), req as any);
  return exploreGet(modifiedReq);
}
