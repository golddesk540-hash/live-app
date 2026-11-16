import { NextRequest, NextResponse } from 'next/server';
import { resolveHostActor, getHostEarningIdentity, submitHostEarningIdentity } from '@/lib/hostTasks';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await resolveHostActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const identity = await getHostEarningIdentity(user.id);
    return NextResponse.json({
      success: true,
      identity,
      ...identity,
    });
  } catch (error: any) {
    console.error('Error fetching host identity:', error);
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_FETCH_IDENTITY' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await resolveHostActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { legalName, country, documentType, documentNumber } = body;

    if (!legalName || !documentNumber) {
      return NextResponse.json(
        { success: false, error: 'legalName and documentNumber are required.' },
        { status: 400 }
      );
    }

    const identity = await submitHostEarningIdentity({
      userId: user.id,
      legalName,
      country: country || 'Pakistan',
      documentType: documentType || 'national_id',
      documentNumber,
    });

    return NextResponse.json({
      success: true,
      identity,
      ...identity,
    });
  } catch (error: any) {
    console.error('Error submitting host identity:', error);
    const status = error.message.includes('REQUIRED') ? 400 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_SUBMIT_IDENTITY' }, { status });
  }
}
