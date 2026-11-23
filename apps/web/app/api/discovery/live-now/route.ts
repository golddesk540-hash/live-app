import { NextRequest, NextResponse } from 'next/server';
import { GET as roomsGet } from '@/app/api/discovery/rooms/route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  url.searchParams.set('status', 'live');
  const modifiedReq = new NextRequest(url.toString(), req as any);
  return roomsGet(modifiedReq);
}
