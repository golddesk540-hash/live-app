/**
 * POPO LIVE — CLIENT FEATURE FLAGS
 * Pure client-side constants with zero Node.js/database dependencies.
 */

export const USE_LIVE_API: boolean = process.env.NEXT_PUBLIC_USE_LIVE_API !== 'false';
export const USE_PARTY_API: boolean = process.env.NEXT_PUBLIC_USE_PARTY_API !== 'false';
export const USE_MESSAGE_API: boolean = process.env.NEXT_PUBLIC_USE_MESSAGE_API !== 'false';
export const USE_ECONOMY_API: boolean = process.env.NEXT_PUBLIC_USE_ECONOMY_API !== 'false';
export const USE_VIP_API: boolean = process.env.NEXT_PUBLIC_USE_VIP_API !== 'false';
export const USE_STORE_API: boolean = process.env.NEXT_PUBLIC_USE_STORE_API !== 'false';
export const USE_FINAL_API: boolean = process.env.NEXT_PUBLIC_USE_FINAL_API !== 'false';
