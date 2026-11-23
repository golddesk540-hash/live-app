import { NextRequest } from 'next/server';
import { GET as getCountriesHandler } from '@/app/api/discovery/countries/route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return getCountriesHandler(req);
}
