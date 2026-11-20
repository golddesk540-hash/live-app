/**
 * POPO LIVE — ADMIN DESK DOMAIN TYPES (P8-P10)
 * 
 * Strict separation:
 * - Admin Desk is an isolated administrative surface
 * - Separate RBAC roles: super-admin, moderator, support, finance
 * - Separate JWT audience: 'admin-desk'
 * - Tamper-evident immutable audit logs
 */

export type AdminRole = 'super-admin' | 'moderator' | 'support' | 'finance';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  twoFactorSecret: string;
  isTwoFactorEnabled: boolean;
  allowedIps?: string[];
  status: 'active' | 'suspended';
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminJwtPayload {
  sub: string;
  email: string;
  name: string;
  role: AdminRole;
  aud: 'admin-desk';
  iat: number;
  exp: number;
}

export interface AdminAuditLog {
  id: string;
  auditId: string;
  action: string;
  actorId: string;
  actorEmail: string;
  actorRole: AdminRole;
  targetId: string;
  targetType: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  reason?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface ManagedUser {
  id: string;
  poppoId: string;
  email: string | null;
  phone: string | null;
  nickname: string;
  avatarUrl: string;
  gender: string;
  status: 'active' | 'blocked' | 'closed';
  hostLevel: number;
  wealthLevel: number;
  createdAt: string;
  closedAt?: string | null;
  closeReason?: string | null;
  blockedAt?: string | null;
  blockReason?: string | null;
}

export interface ManagedLiveRoom {
  roomId: string;
  title: string;
  hostId: string;
  hostNickname: string;
  category: string;
  status: 'live' | 'ended';
  viewerCount: number;
  endedReason?: string | null;
  endedBy?: string | null;
  endedAt?: string | null;
}

export interface ManagedPartyRoom {
  roomId: string;
  title: string;
  hostId: string;
  status: 'active' | 'ended';
  seatedCount: number;
  endedReason?: string | null;
  endedBy?: string | null;
  endedAt?: string | null;
}

export interface ReportedChatMessage {
  id: string;
  channelId: string;
  channelType: 'live' | 'party' | 'dm';
  senderId: string;
  senderNickname: string;
  content: string;
  reportReason: string;
  reporterId: string;
  status: 'pending' | 'deleted' | 'dismissed';
  reportedAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
}

export interface ManagedTransaction {
  id: string;
  transactionRef: string;
  userId: string;
  userEmail: string;
  type: 'topup' | 'gift' | 'vip' | 'withdrawal' | 'refund';
  amountCoins: number;
  currencyAmount?: number;
  currency?: string;
  status: 'completed' | 'refunded' | 'failed';
  createdAt: string;
  refundedAt?: string | null;
  refundReason?: string | null;
  refundedBy?: string | null;
}

export interface ManagedVipMembership {
  id: string;
  userId: string;
  planId: string;
  tierName: string;
  status: 'active' | 'cancelled' | 'expired';
  expiresAt: string;
  cancelledAt?: string | null;
  cancelledBy?: string | null;
  cancelReason?: string | null;
}

export interface ManagedStoreProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceCoins: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedRedeemCode {
  id: string;
  code: string;
  coinReward: number;
  maxUses: number;
  usedCount: number;
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  revokedAt?: string | null;
  revokedBy?: string | null;
}

export interface ManagedKycSubmission {
  id: string;
  userId: string;
  userName: string;
  documentType: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
}

export interface ManagedWithdrawal {
  id: string;
  withdrawalRef: string;
  userId: string;
  amountPoints: number;
  payoutAmountUsd: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  createdAt: string;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
}

export interface ManagedSupportTicket {
  id: string;
  ticketRef: string;
  userId: string;
  subject: string;
  status: 'open' | 'pending' | 'replied' | 'closed';
  messages: Array<{
    id: string;
    senderType: 'user' | 'support';
    senderName: string;
    message: string;
    timestamp: string;
  }>;
  createdAt: string;
  closedAt?: string | null;
}

export interface BusinessMetrics {
  dau: number;
  activeLiveRooms: number;
  activePartyRooms: number;
  totalCoinsTransacted: number;
  pendingKycCount: number;
  pendingWithdrawalCount: number;
  errorRatePercent: number;
  apiLatencyP95Ms: number;
  dbConnectionsActive: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  severity: 'critical' | 'warning' | 'info';
  enabled: boolean;
}

export interface AlertTrigger {
  ruleId: string;
  ruleName: string;
  currentValue: number;
  threshold: number;
  severity: string;
  triggeredAt: string;
  message: string;
}
