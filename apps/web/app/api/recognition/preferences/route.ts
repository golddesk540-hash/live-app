import { NextRequest, NextResponse } from 'next/server';
import { updateUserRecognitionPreferences } from '@/lib/recognition';
import {
  recognitionErrorJson,
  rejectTamperedRecognitionBody,
  resolveRecognitionUserScope,
} from '@/lib/recognitionRouteHelpers';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, errorCode: 'INVALID_BODY', error: 'JSON body required.' }, { status: 400 });
    }

    const tamperRes = rejectTamperedRecognitionBody(body);
    if (tamperRes) return tamperRes;

    const scope = await resolveRecognitionUserScope(req);
    if (!scope.ok) return scope.response;

    const preferences = await updateUserRecognitionPreferences(scope.targetUserId, {
      animationsEnabled: body.animationsEnabled,
      soundEnabled: body.soundEnabled,
      hideWealthLeaderboard: body.hideWealthLeaderboard,
      hideShiningLeaderboard: body.hideShiningLeaderboard,
      hideHonorLeaderboard: body.hideHonorLeaderboard,
    });

    return NextResponse.json({
      success: true,
      module: '7.8',
      preferences,
    });
  } catch (err: any) {
    return recognitionErrorJson(err, 'Failed to update recognition preferences.');
  }
}
