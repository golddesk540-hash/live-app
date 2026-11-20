import { NextRequest } from 'next/server';
import { POST as handlePaymentWebhook } from '../../payments/webhook/route';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return handlePaymentWebhook(req);
}
