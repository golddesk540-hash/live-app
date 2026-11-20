/**
 * POPO LIVE — WEB RUNTIME ADMIN DESK BRIDGE (P8-P10)
 * 
 * Bridges Next.js /api/admin/* routes to the backend Admin Desk Service.
 * Adheres to PHASE8_FLAGS.useRealAdmin feature flag.
 * Ensures strict isolation from user-facing public routes.
 */

import { PHASE8_FLAGS } from './phase8Flags';
import {
  adminDeskService,
  generateAdminToken,
  verifyAdminToken,
  verify2FACode,
  isIpWhitelisted,
  hasPermission,
  ROLE_PERMISSIONS,
  AdminUser,
  AdminRole,
  AdminJwtPayload,
  AdminAuditLog,
  ManagedUser,
  ManagedLiveRoom,
  ManagedPartyRoom,
  ReportedChatMessage,
  ManagedTransaction,
  ManagedVipMembership,
  ManagedStoreProduct,
  ManagedRedeemCode,
  ManagedKycSubmission,
  ManagedWithdrawal,
  ManagedSupportTicket,
  BusinessMetrics,
  AlertRule,
  AlertTrigger,
} from '../../../apps/api/src/adminDesk';

export function isRealAdminEnabled(): boolean {
  return PHASE8_FLAGS.useRealAdmin;
}

export {
  adminDeskService,
  generateAdminToken,
  verifyAdminToken,
  verify2FACode,
  isIpWhitelisted,
  hasPermission,
  ROLE_PERMISSIONS,
};

export type {
  AdminUser,
  AdminRole,
  AdminJwtPayload,
  AdminAuditLog,
  ManagedUser,
  ManagedLiveRoom,
  ManagedPartyRoom,
  ReportedChatMessage,
  ManagedTransaction,
  ManagedVipMembership,
  ManagedStoreProduct,
  ManagedRedeemCode,
  ManagedKycSubmission,
  ManagedWithdrawal,
  ManagedSupportTicket,
  BusinessMetrics,
  AlertRule,
  AlertTrigger,
};
