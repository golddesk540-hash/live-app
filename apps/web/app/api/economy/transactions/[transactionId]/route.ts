import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { getTransactionDetail } from '@/lib/economyApiService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/economy/transactions/[transactionId]
 * Returns single transaction detail for financial audit.
 * Enforces:
 * - Authentication required (HTTP 401)
 * - Security & Privacy: User can only view their own transactions unless staff/admin (HTTP 403)
 * - 404 if transaction does not exist
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to inspect transactions.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const transactionId = params.transactionId;
    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required.', code: 'MISSING_TRANSACTION_ID' },
        { status: 400 }
      );
    }

    const detail = await getTransactionDetail(transactionId, user);
    if (!detail) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found.', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: detail,
    });
  } catch (err: any) {
    if (err.code === 'FORBIDDEN') {
      return NextResponse.json(
        { success: false, error: err.message, code: 'FORBIDDEN' },
        { status: 403 }
      );
    }
    console.error(`GET /api/economy/transactions/${params.transactionId} error:`, err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve transaction detail.' },
      { status: err.status || 500 }
    );
  }
}
