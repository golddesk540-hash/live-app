import { NextRequest, NextResponse } from 'next/server';
import { resolveUserActor, registerAgency } from '@/lib/agencyRankings';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await resolveUserActor(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, description, contactEmail, contactPhone } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Agency name must be at least 3 characters long.' },
        { status: 400 }
      );
    }

    const agency = await registerAgency({
      userId: user.id,
      name,
      description,
      contactEmail,
      contactPhone,
    });

    return NextResponse.json({
      success: true,
      message: 'Agency registration submitted successfully. Status is pending administrator approval.',
      agency,
    });
  } catch (error: any) {
    console.error('Error registering agency:', error);
    const status = error.message.includes('ALREADY') ? 400 : 500;
    return NextResponse.json({ success: false, error: error.message || 'FAILED_TO_REGISTER_AGENCY' }, { status });
  }
}
