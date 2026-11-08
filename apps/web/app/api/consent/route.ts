import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  CURRENT_TERMS_VERSION,
  CURRENT_PRIVACY_VERSION,
  saveConsentRecord,
  getConsentBySessionId,
  createConsentToken,
  verifyConsentToken,
  isConsentCurrent,
  hashIp,
} from '@/lib/consentStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get('poppo_terms_consent')?.value;
    const url = new URL(request.url);
    const querySessionId = url.searchParams.get('sessionId');

    let hasAccepted = false;
    let status: 'accepted' | 'declined' | 'unvisited' = 'unvisited';
    let needsReacceptance = false;
    let storedRecord = null;

    if (cookieToken) {
      const verification = verifyConsentToken(cookieToken);
      if (verification.valid && verification.payload) {
        status = verification.payload.status;
        if (verification.payload.status === 'accepted') {
          if (
            verification.payload.termsVersion === CURRENT_TERMS_VERSION &&
            verification.payload.privacyVersion === CURRENT_PRIVACY_VERSION
          ) {
            hasAccepted = true;
          } else {
            // Version bump occurred! User must re-accept
            needsReacceptance = true;
          }
        }
      }
    }

    // Check backend store if sessionId is available
    const sessionId = querySessionId || (cookieToken ? verifyConsentToken(cookieToken).payload?.anonymousSessionId : null);
    if (sessionId) {
      storedRecord = getConsentBySessionId(sessionId);
      if (storedRecord && storedRecord.status === 'accepted') {
        if (
          storedRecord.termsVersion === CURRENT_TERMS_VERSION &&
          storedRecord.privacyVersion === CURRENT_PRIVACY_VERSION
        ) {
          hasAccepted = true;
          status = 'accepted';
        } else {
          needsReacceptance = true;
        }
      } else if (storedRecord && storedRecord.status === 'declined') {
        status = 'declined';
        hasAccepted = false;
      }
    }

    return NextResponse.json({
      hasAccepted,
      status,
      needsReacceptance,
      currentTermsVersion: CURRENT_TERMS_VERSION,
      currentPrivacyVersion: CURRENT_PRIVACY_VERSION,
      record: storedRecord
        ? {
            consentId: storedRecord.consentId,
            status: storedRecord.status,
            acceptedAt: storedRecord.acceptedAt,
            termsVersion: storedRecord.termsVersion,
            privacyVersion: storedRecord.privacyVersion,
            language: storedRecord.language,
          }
        : null,
    });
  } catch (error) {
    console.error('Error handling GET /api/consent:', error);
    return NextResponse.json(
      { error: 'Internal server error checking consent status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      action,
      termsAccepted,
      privacyAccepted,
      isAdultConfirmed,
      anonymousSessionId,
      language = 'en',
    } = body;

    // Extract client IP and User Agent
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ipHashed = hashIp(clientIp);

    const sessionId =
      anonymousSessionId && typeof anonymousSessionId === 'string' && anonymousSessionId.length > 5
        ? anonymousSessionId
        : `sess_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;

    if (action === 'decline') {
      // Record decline event in store
      const record = saveConsentRecord({
        anonymousSessionId: sessionId,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        status: 'declined',
        acceptedAt: new Date().toISOString(),
        isAdultConfirmed: false,
        language: language === 'ur' ? 'ur' : 'en',
        ipHash: ipHashed,
        userAgent,
      });

      const token = createConsentToken({
        consentId: record.consentId,
        anonymousSessionId: sessionId,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        status: 'declined',
        timestamp: Date.now(),
      });

      const response = NextResponse.json({
        success: true,
        status: 'declined',
        message: 'Terms declined. Restricted features are inaccessible until accepted.',
        anonymousSessionId: sessionId,
      });

      // Set cookie for 7 days
      response.cookies.set('poppo_terms_consent', token, {
        path: '/',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60,
        sameSite: 'lax',
      });

      return response;
    }

    if (action === 'accept') {
      // Strictly validate requirements
      if (!termsAccepted) {
        return NextResponse.json(
          { error: 'You must agree to the Terms of Service to continue.' },
          { status: 400 }
        );
      }
      if (!privacyAccepted) {
        return NextResponse.json(
          { error: 'You must agree to the Privacy Policy to continue.' },
          { status: 400 }
        );
      }
      if (!isAdultConfirmed) {
        return NextResponse.json(
          { error: 'You must confirm that you are at least 18 years of age.' },
          { status: 400 }
        );
      }

      // Persist verified consent record
      const record = saveConsentRecord({
        anonymousSessionId: sessionId,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        isAdultConfirmed: true,
        language: language === 'ur' ? 'ur' : 'en',
        ipHash: ipHashed,
        userAgent,
      });

      const token = createConsentToken({
        consentId: record.consentId,
        anonymousSessionId: sessionId,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        status: 'accepted',
        timestamp: Date.now(),
      });

      const response = NextResponse.json({
        success: true,
        status: 'accepted',
        termsVersion: CURRENT_TERMS_VERSION,
        privacyVersion: CURRENT_PRIVACY_VERSION,
        acceptedAt: record.acceptedAt,
        anonymousSessionId: sessionId,
        consentId: record.consentId,
        message: 'Consent recorded and verified successfully.',
      });

      // 1-year persistent secure HTTP-only cookie
      response.cookies.set('poppo_terms_consent', token, {
        path: '/',
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60,
        sameSite: 'lax',
      });

      return response;
    }

    return NextResponse.json(
      { error: 'Invalid action. Must be either "accept" or "decline".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error handling POST /api/consent:', error);
    return NextResponse.json(
      { error: 'Internal server error recording consent.' },
      { status: 500 }
    );
  }
}
