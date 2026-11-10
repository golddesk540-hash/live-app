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
