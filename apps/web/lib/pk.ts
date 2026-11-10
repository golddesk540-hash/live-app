// ============================================================================
// Module 6.1: PK Battle Types Interfaces & Types
// Reference: 06_01_battle_types.png
// ============================================================================

export type PKBattleTypeId = '1v1' | '4_host';

export interface PKBattleType {
  id: PKBattleTypeId;
  name: string;
  nameUr: string;
  description: string;
  descriptionUr: string;
  maxHosts: number;
  isEnabled: boolean;
  isLocked: boolean;
  featureFlag: string;
  displayOrder: number;
  badgeText?: string | null;
  badgeTextUr?: string | null;
}

export interface PKBattleSession {
  id: string;
  roomNumber: string;
  hostId: string;
  battleType: PKBattleTypeId;
  language: 'en' | 'ur';
  status: 'configured' | 'matching' | 'active' | 'ended' | 'cancelled';
  configuredAt: string;
  updatedAt: string;
}

export interface SelectPKBattleTypeDto {
  roomNumber: string;
  hostId?: string;
  battleType: PKBattleTypeId;
  language?: 'en' | 'ur';
}

export interface PKBattleTypesResponse {
  success: boolean;
  battleTypes: PKBattleType[];
  defaultType: PKBattleTypeId;
  featureFlags: {
    pk1v1Enabled: boolean;
    pk4hostEnabled: boolean;
  };
}

export const CANONICAL_PK_BATTLE_TYPES: PKBattleType[] = [
  {
    id: '1v1',
    name: '1 vs 1',
    nameUr: '1 بمقابلہ 1',
    description: 'Two hosts compete in real-time with separate scores and battle areas.',
    descriptionUr: 'دو میزبان الگ الگ اسکور اور میدانِ مقابلہ کے ساتھ آمنے سامنے مقابلہ کرتے ہیں۔',
    maxHosts: 2,
    isEnabled: true,
    isLocked: false,
    featureFlag: 'pk_1v1_enabled',
    displayOrder: 1,
    badgeText: 'Active',
    badgeTextUr: 'فعال',
  },
  {
    id: '4_host',
    name: '4-Host Battle',
    nameUr: '4 میزبان جنگ',
    description: 'Four hosts battle simultaneously with multi-grid scores (Coming Soon).',
    descriptionUr: 'چار میزبان بیک وقت مقابلہ کریں گے (جلد آرہا ہے)۔',
    maxHosts: 4,
    isEnabled: false,
    isLocked: true,
    featureFlag: 'pk_4host_enabled',
    displayOrder: 2,
    badgeText: 'Locked',
    badgeTextUr: 'مقفل',
  },
];

// ============================================================================
// Module 6.2: PK Host Invitation & Random Matchmaking
// Reference: 06_02_starting_a_battle_invite_random.png
// ============================================================================

export interface LiveHost {
  id: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  country: string;
  countryCode: string;
  flagEmoji: string;
  roomNumber: string;
  viewerCount: number;
  isLive: boolean;
  inPkBattle: boolean;
  pkInvitesEnabled: boolean;
  isOnline: boolean;
  isEligibleForPk: boolean;
}

export type PKInvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export interface PKInvitation {
  id: string;
  senderHostId: string;
  senderRoomNumber: string;
  senderNickname: string;
  senderAvatar: string;
  receiverHostId: string;
  receiverRoomNumber: string;
  receiverNickname: string;
  receiverAvatar: string;
  battleType: PKBattleTypeId;
  status: PKInvitationStatus;
  rejectionReason?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  secondsRemaining?: number;
}

export type RandomMatchStatus =
  | 'idle'
  | 'finding_opponent'
  | 'opponent_found'
  | 'waiting_confirmation'
  | 'match_accepted'
  | 'match_cancelled'
  | 'no_opponent_available';

export interface PKMatchmakingStatusResponse {
  success: boolean;
  status: RandomMatchStatus;
  hostId: string;
  roomNumber: string;
  opponent?: Partial<LiveHost> | null;
  battleId?: string | null;
  message?: string;
  messageUr?: string;
}

export interface PKBattleRecord {
  id: string;
  battleType: PKBattleTypeId;
  hostAId: string;
  hostARoom: string;
  hostANickname: string;
  hostAAvatar: string;
  hostBId: string;
  hostBRoom: string;
  hostBNickname: string;
  hostBAvatar: string;
  matchMethod: 'invite' | 'random';
  status: 'confirmed' | 'starting' | 'active' | 'completed' | 'cancelled';
  createdAt: string;
  startedAt?: string | null;
}

// ============================================================================
// Module 6.3: PK Battle Score and Timer
// Reference: 06_03_score_and_timer.png
// ============================================================================

export type PKTimerVisualState = 'normal' | 'warning_60s' | 'warning_10s' | 'time_expired';

export interface PKScoreEvent {
  id: string;
  battleId: string;
  hostSide: 'host_a' | 'host_b';
  targetHostId: string;
  senderId: string;
  senderName: string;
  points: number;
  giftName?: string;
  idempotencyKey: string;
  createdAt: string;
}

export interface PKBattleComment {
  id: string;
  battleId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface PKHostScoreParticipant {
  id: string;
  poppoId: string;
  nickname: string;
  avatarUrl: string;
  roomNumber: string;
  score: number;
  viewerCount: number;
  country: string;
  countryCode: string;
  flagEmoji: string;
}

export interface PKBattleTimerState {
  durationSeconds: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  formattedTime: string; // 'MM:SS'
  status: PKTimerVisualState;
  serverTime: string;
  startedAt: string;
  expiresAt: string;
}

export interface PKBattleScoreTimerData {
  battleId: string;
  battleType: PKBattleTypeId;
  status: 'starting' | 'active' | 'time_expired' | 'completed' | 'cancelled';
  hostA: PKHostScoreParticipant;
  hostB: PKHostScoreParticipant;
  timer: PKBattleTimerState;
  leadingSide: 'host_a' | 'host_b' | 'tie';
  leadingHostId?: string | null;
  ratioA: number; // percentage (0-100)
  ratioB: number; // percentage (0-100)
  recentEvents: PKScoreEvent[];
  recentComments: PKBattleComment[];
}

export interface SendScoreDto {
  hostSide: 'host_a' | 'host_b';
  targetHostId: string;
  senderId: string;
  senderName: string;
  points: number;
  giftName?: string;
  idempotencyKey: string;
}

/**
 * Format seconds into authoritative MM:SS display
 */
export function formatPKTime(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Determine visual state based on remaining time
 */
export function determinePKTimerState(remainingSeconds: number): PKTimerVisualState {
  if (remainingSeconds <= 0) return 'time_expired';
  if (remainingSeconds <= 10) return 'warning_10s';
  if (remainingSeconds <= 60) return 'warning_60s';
  return 'normal';
}

/**
 * Calculate dynamic score bar ratios with safe boundaries so scores remain readable
 */
export function calculatePKScoreRatios(scoreA: number, scoreB: number): { ratioA: number; ratioB: number } {
  const safeA = Math.max(0, scoreA || 0);
  const safeB = Math.max(0, scoreB || 0);
  const total = safeA + safeB;

  if (total === 0) {
    return { ratioA: 50, ratioB: 50 };
  }

  // Raw percentage
  let rawA = (safeA / total) * 100;

  // Clamp between 15% and 85% for UI balance and legibility
  if (rawA < 15) rawA = 15;
  if (rawA > 85) rawA = 85;

  return {
    ratioA: Math.round(rawA * 10) / 10,
    ratioB: Math.round((100 - rawA) * 10) / 10,
  };
}

// ============================================================================
// Module 6.4: PK Battle Results and Winner Declaration
// Reference: 06_04_result.png
// ============================================================================

export type PKResultType = 'winner_declared' | 'draw' | 'cancelled';

export interface PKBattleResult {
  id: string;
  battleId: string;
  battleType: PKBattleTypeId;
  hostAId: string;
  hostANickname: string;
  hostAAvatar: string;
  hostAScore: number;
  hostBId: string;
  hostBNickname: string;
  hostBAvatar: string;
  hostBScore: number;
  resultType: PKResultType;
  winnerHostId: string | null;
  winnerNickname: string | null;
  winnerAvatar: string | null;
  winnerScore: number | null;
  loserHostId: string | null;
  loserNickname: string | null;
  loserAvatar: string | null;
  loserScore: number | null;
  scoreDiff: number;
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
  createdAt: string;
}

export interface PKBattleHistoryItem {
  battleId: string;
  opponentId: string;
  opponentName: string;
  opponentAvatar: string;
  myScore: number;
  opponentScore: number;
  outcome: 'win' | 'loss' | 'draw';
  battleDate: string;
  durationFormatted: string;
}

export function calculatePKBattleWinner(
  scoreA: number,
  scoreB: number,
  hostA: { id: string; nickname: string; avatarUrl: string },
  hostB: { id: string; nickname: string; avatarUrl: string }
): {
  resultType: PKResultType;
  winnerHostId: string | null;
  winnerNickname: string | null;
  winnerAvatar: string | null;
  winnerScore: number | null;
  loserHostId: string | null;
  loserNickname: string | null;
  loserAvatar: string | null;
  loserScore: number | null;
  scoreDiff: number;
} {
  const diff = Math.abs(scoreA - scoreB);
  if (scoreA > scoreB) {
    return {
      resultType: 'winner_declared',
      winnerHostId: hostA.id,
      winnerNickname: hostA.nickname,
      winnerAvatar: hostA.avatarUrl,
      winnerScore: scoreA,
      loserHostId: hostB.id,
      loserNickname: hostB.nickname,
      loserAvatar: hostB.avatarUrl,
      loserScore: scoreB,
      scoreDiff: diff,
    };
  } else if (scoreB > scoreA) {
    return {
      resultType: 'winner_declared',
      winnerHostId: hostB.id,
      winnerNickname: hostB.nickname,
      winnerAvatar: hostB.avatarUrl,
      winnerScore: scoreB,
      loserHostId: hostA.id,
      loserNickname: hostA.nickname,
      loserAvatar: hostA.avatarUrl,
      loserScore: scoreA,
      scoreDiff: diff,
    };
  } else {
    return {
      resultType: 'draw',
      winnerHostId: null,
      winnerNickname: null,
      winnerAvatar: null,
      winnerScore: null,
      loserHostId: null,
      loserNickname: null,
      loserAvatar: null,
      loserScore: null,
      scoreDiff: 0,
    };
  }
}



