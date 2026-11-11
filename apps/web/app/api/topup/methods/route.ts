import { NextRequest, NextResponse } from 'next/server';
import { listPaymentProviders } from '@/lib/topup';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const platform = req.nextUrl.searchParams.get('platform') || undefined;
    const providers = await listPaymentProviders(platform);
    return NextResponse.json({
      success: true,
      module: '7.6',
      providers,
    });
  } catch (err: any) {
    console.error('GET /api/topup/methods error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to load payment methods.' },
      { status: 500 }
    );
  }
}
