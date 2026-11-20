import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { messageId, deviceToken, status, errorCode } = body;

    return NextResponse.json({
      success: true,
      received: true,
      receipt: {
        messageId: messageId || `receipt_${Date.now()}`,
        deviceToken: deviceToken || 'anonymous',
        status: status || 'delivered',
        errorCode,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process delivery receipt.' },
      { status: 500 }
    );
  }
}
