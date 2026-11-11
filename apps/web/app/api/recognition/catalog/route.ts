import { NextResponse } from 'next/server';
import { getRecognitionCatalog } from '@/lib/recognition';
import { recognitionErrorJson } from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const catalog = await getRecognitionCatalog({ includeInactive: false });
    return NextResponse.json({
      success: true,
      module: '7.8',
      ...catalog,
    });
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to fetch recognition catalog.');
  }
}
