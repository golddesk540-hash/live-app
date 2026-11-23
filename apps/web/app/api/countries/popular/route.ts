import { NextRequest } from 'next/server';
import { GET as getPopularCountriesHandler } from '@/app/api/discovery/countries/popular/route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return getPopularCountriesHandler();
}
