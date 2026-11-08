import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    const requests = await query(
      `SELECT r.id, r.request_number, r.user_id, r.reason, r.additional_explanation,
              r.status, r.requested_date, r.reviewed_date, r.completed_date, r.cancelled_date,
              r.created_at, r.updated_at,
              u.poppo_id, u.nickname, u.email, u.avatar_url
       FROM popolive.account_closure_requests r
       JOIN popolive.users u ON r.user_id = u.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT 1`,
      [user.id]
    );

    if (requests.length === 0) {
      return NextResponse.json({
        success: true,
        hasRequest: false,
        message: 'No account closure request found.',
      });
    }

    const reqData = requests[0];
    const canCancel = ['pending', 'under_review'].includes(reqData.status);

    const statusDescriptions: Record<string, { en: string; ur: string }> = {
      pending: {
        en: 'Your account closure request has been registered and is queued for verification.',
        ur: 'آپ کی اکاؤنٹ بندش کی درخواست درج کر لی گئی ہے اور تصدیق کے لیے قطار میں ہے۔',
      },
      under_review: {
        en: 'Our trust and safety team is currently reviewing your account balances and closure request.',
        ur: 'ہماری ٹرسٹ اینڈ سیفٹی ٹیم آپ کے اکاؤنٹ بیلنس اور بندش کی درخواست کا جائزہ لے رہی ہے۔',
      },
      approved: {
        en: 'Your request has been approved. The 30-day grace deactivation process is currently underway.',
        ur: 'آپ کی درخواست منظور ہو گئی ہے۔ 30 روزہ ڈی ایکٹیویشن کا عمل جاری ہے۔',
      },
      rejected: {
        en: 'Your closure request could not be processed due to pending wallet balances or unresolved disputes.',
        ur: 'باقی ماندہ والٹ بیلنس یا نامکمل معاملات کی وجہ سے آپ کی درخواست مسترد کر دی گئی۔',
      },
      cancelled: {
        en: 'This account closure request was cancelled by you. Your account remains active and in good standing.',
        ur: 'یہ اکاؤنٹ بندش کی درخواست آپ کی طرف سے منسوخ کر دی گئی تھی۔ آپ کا اکاؤنٹ بدستور فعال ہے۔',
      },
      completed: {
        en: 'Account closure and data retention policies have been finalized.',
        ur: 'اکاؤنٹ کی بندش اور ڈیٹا پالیسیوں کا عمل مکمل ہو چکا ہے۔',
      },
    };

    return NextResponse.json({
      success: true,
      hasRequest: true,
      request: {
        id: reqData.id,
        requestNumber: reqData.request_number,
        poppoId: reqData.poppo_id,
        nickname: reqData.nickname,
        avatarUrl: reqData.avatar_url,
        reason: reqData.reason,
        additionalExplanation: reqData.additional_explanation,
        status: reqData.status,
        statusDescription: statusDescriptions[reqData.status] || statusDescriptions.pending,
        requestedDate: reqData.requested_date,
        reviewedDate: reqData.reviewed_date,
        completedDate: reqData.completed_date,
        cancelledDate: reqData.cancelled_date,
        canCancel,
      },
    });
  } catch (err: any) {
    console.error('Error in GET /api/account/closure/status:', err);
    return NextResponse.json({ error: 'Failed to retrieve closure status.' }, { status: 500 });
  }
}
