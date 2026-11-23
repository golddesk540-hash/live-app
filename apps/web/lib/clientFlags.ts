/**
 * POPO LIVE — CLIENT FEATURE FLAGS
 * Pure client-side constants with zero Node.js/database dependencies.
 * 
 * Master Plan Reference: POPO-LIVE-BACKEND-REALTIME-PLAN.pdf (Phase B0)
 * All module flags evaluate strictly to FALSE when unset or set to 'false'.
 * To enable during subsequent backend phases (B2–B12), set the corresponding
 * NEXT_PUBLIC_USE_* environment variable to 'true'.
 */

export const USE_LIVE_API: boolean = process.env.NEXT_PUBLIC_USE_LIVE_API === 'true';
export const USE_PARTY_API: boolean = process.env.NEXT_PUBLIC_USE_PARTY_API === 'true';
export const USE_MESSAGE_API: boolean = process.env.NEXT_PUBLIC_USE_MESSAGE_API === 'true';
export const USE_ECONOMY_API: boolean = process.env.NEXT_PUBLIC_USE_ECONOMY_API === 'true';
export const USE_VIP_API: boolean = process.env.NEXT_PUBLIC_USE_VIP_API === 'true';
export const USE_STORE_API: boolean = process.env.NEXT_PUBLIC_USE_STORE_API === 'true';
export const USE_COMMUNITY_API: boolean = process.env.NEXT_PUBLIC_USE_COMMUNITY_API === 'true';
export const USE_FINAL_API: boolean = process.env.NEXT_PUBLIC_USE_FINAL_API === 'true';
