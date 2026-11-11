import { NextRequest, NextResponse } from 'next/server';
import { submitHonorRecognitionRequest } from '@/lib/recognition';
import {
  recognitionErrorJson,
  rejectTamperedRecognitionBody,
  resolveRecognitionUserScope,
} from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, errorCode: 'INVALID_BODY', error: 'JSON body required.' }, { status: 400 });
    }

    const tamperRes = rejectTamperedRecognitionBody(body);
    if (tamperRes) return tamperRes;

    const scope = await resolveRecognitionUserScope(req, body.userId);
    if (!scope.ok) return scope.response;

    if (!scope.actor.user) {
      return NextResponse.json(
        { success: false, errorCode: 'UNAUTHORIZED', error: 'Sign in required to submit Honor recognition request.' },
        { status: 401 }
      );
    }

    const reqRecord = await submitHonorRecognitionRequest({
      userId: scope.targetUserId,
      factorKey: String(body.factorKey || '').trim(),
      evidenceSummary: String(body.evidenceSummary || ''),
      submittedBy: scope.actor.actorId,
    });

    return NextResponse.json(
      {
        success: true,
        module: '7.8',
        message: 'Honor recognition request submitted for authorized admin verification.',
        request: reqRecord,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to submit Honor recognition request.');
  }
}
