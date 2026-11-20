/**
 * POPO LIVE — PHASE 8 FEATURE FLAG CATALOG
 * 
 * Central registry of production service feature flags.
 * Every flag MUST strictly default to false.
 * When false, the system preserves 100% of Phase 7 mock / database behavior.
 * 
 * Only when client approval is granted and a provider is explicitly configured
 * will a flag be toggled to true.
 */

export interface Phase8FeatureFlags {
  useRealOtp: boolean;
  useRealStorage: boolean;
  useRealPosterGen: boolean;
  useRealWebsocket: boolean;
  useRealMedia: boolean;
  useRealPartyMedia: boolean;
  useRealPayments: boolean;
  useRealPush: boolean;
  useRealKyc: boolean;
  useRealPayout: boolean;
  useRealAdmin: boolean;
}

export function getPhase8Flags(): Phase8FeatureFlags {
  return {
    useRealOtp: process.env.USE_REAL_OTP === 'true',
    useRealStorage: process.env.USE_REAL_STORAGE === 'true',
    useRealPosterGen: process.env.USE_REAL_POSTER_GEN === 'true',
    useRealWebsocket: process.env.USE_REAL_WEBSOCKET === 'true',
    useRealMedia: process.env.USE_REAL_MEDIA === 'true',
    useRealPartyMedia: process.env.USE_REAL_PARTY_MEDIA === 'true',
    useRealPayments: process.env.USE_REAL_PAYMENTS === 'true',
    useRealPush: process.env.USE_REAL_PUSH === 'true',
    useRealKyc: process.env.USE_REAL_KYC === 'true',
    useRealPayout: process.env.USE_REAL_PAYOUT === 'true',
    useRealAdmin: process.env.USE_REAL_ADMIN === 'true',
  };
}

export const PHASE8_FLAGS = getPhase8Flags();
