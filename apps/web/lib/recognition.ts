import crypto from 'crypto';
import { query, withTransaction } from '@/lib/db';
import { redisDel, redisGet, redisSetWithTtl } from '@/lib/redis';
import { DEFAULT_DEMO_WALLET_USER_ID, isAuthorizedFinanceAdmin } from '@/lib/wallet';

// =============================================================================
// Popo Live Phase 7 Module 7.8 — Wealth, Shining & Honor Recognition Engine
// Three strictly separate, backend-authoritative recognition systems:
//   1. Wealth  (verified paid coin spending activity)
//   2. Shining (verified successful gift sending activity)
//   3. Honor   (approved platform recognition & achievement rules)
// =============================================================================

export type RecognitionCategory = 'wealth' | 'shining' | 'honor';
export const RECOGNITION_CATEGORIES: readonly RecognitionCategory[] = ['wealth', 'shining', 'honor'];

export const RECOGNITION_FORBIDDEN_FIELDS = [
  'wealthLevel',
  'shiningLevel',
  'honorLevel',
  'wealthScore',
  'shiningScore',
  'honorScore',
  'currentScore',
  'current_score',
  'levelNumber',
  'level_number',
  'levelId',
  'level_id',
  'requiredThreshold',
  'required_threshold',
  'grantedBenefits',
  'benefitKeys',
  'forceLevelUp',
  'manualOverride',
];

const RECOGNITION_CATALOG_CACHE_KEY = 'recognition:catalog:v1';

export interface RecognitionSystemRules {
  allowPromoCoinsForWealth: boolean;
  wealthScorePerCoin: number;
  shiningScorePerCoin: number;
  autoAdjustOnReversal: boolean;
  fraudDailySpikeThreshold: number;
  leaderboardDefaultLimit: number;
}

export interface RecognitionBenefitItem {
  benefitKey: string;
  title: string;
  titleUr: string;
  category: string;
  description: string;
  descriptionUr: string;
  assetUrl: string | null;
  isFinancialReward: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface RecognitionLevelTier {
  levelId: string;
  category: RecognitionCategory;
  levelNumber: number;
  levelName: string;
  levelNameUr: string;
  requiredThreshold: number;
  badgeImageUrl: string;
  iconKey: string;
  wingStyle: string;
  borderColor: string;
  description: string;
  descriptionUr: string;
  benefitKeys: string[];
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HonorRecognitionFactor {
  factorKey: string;
  title: string;
  titleUr: string;
  description: string;
  defaultPoints: number;
  requiresAdminReview: boolean;
  isActive: boolean;
  displayOrder: number;
}

export interface CategoryProgressSummary {
  category: RecognitionCategory;
  currentScore: number;
  currentLevelNumber: number;
  currentLevelId: string;
  currentLevelName: string;
  currentLevelNameUr: string;
  badgeImageUrl: string;
  iconKey: string;
  wingStyle: string;
  borderColor: string;
  highestLevelNumber: number;
  nextLevelId: string | null;
  nextLevelNumber: number | null;
  nextLevelName: string | null;
  nextLevelNameUr: string | null;
  nextThreshold: number | null;
  remainingToNext: number;
  progressPercent: number;
  activatedAt: string;
  updatedAt: string;
  activeBenefitKeys: string[];
  approvedBenefits: RecognitionBenefitItem[];
  allTiers: RecognitionLevelTier[];
}

export interface RecognitionLevelUpEventRecord {
  eventId: string;
  userId: string;
  category: RecognitionCategory;
  newLevelId: string;
  newLevelNumber: number;
  newLevelName: string;
  badgeImageUrl: string;
  unlockedBenefits: string[];
  isAcknowledged: boolean;
  createdAt: string;
}

export interface UserRecognitionPreferences {
  animationsEnabled: boolean;
  soundEnabled: boolean;
  hideWealthLeaderboard: boolean;
  hideShiningLeaderboard: boolean;
  hideHonorLeaderboard: boolean;
}

export interface UserRecognitionSummary {
  userId: string;
  wealth: CategoryProgressSummary;
  shining: CategoryProgressSummary;
  honor: CategoryProgressSummary;
  preferences: UserRecognitionPreferences;
  unacknowledgedLevelUps: RecognitionLevelUpEventRecord[];
  rulesSnapshot: {
    allowPromoCoinsForWealth: boolean;
    vipCombinedAllowed: false;
  };
}

export function generateRecId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export function assertRecognitionCategory(input: unknown): RecognitionCategory {
  const clean = String(input || '').trim().toLowerCase();
  if (clean === 'wealth' || clean === 'shining' || clean === 'honor') {
    return clean;
  }
  if (clean === 'combined' || clean === 'all' || clean === 'vip') {
    throw Object.assign(
      new Error('Wealth, Shining, and Honor are strictly separate. Combined scores or categories are forbidden.'),
      { code: 'COMBINED_CATEGORY_FORBIDDEN', status: 400 }
    );
  }
  throw Object.assign(new Error(`Invalid recognition category '${clean}'. Must be wealth, shining, or honor.`), {
    code: 'INVALID_RECOGNITION_CATEGORY',
    status: 400,
  });
}

export function detectTamperedRecognitionKeys(body: Record<string, any> | null | undefined): string | null {
  if (!body || typeof body !== 'object') return null;
  for (const key of RECOGNITION_FORBIDDEN_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
      return key;
    }
  }
  return null;
}

function parseJsonArray(val: any): string[] {
  if (Array.isArray(val)) return val.map((x) => String(x));
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed.map((x) => String(x)) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapLevelRow(r: any): RecognitionLevelTier {
  return {
    levelId: String(r.level_id),
    category: assertRecognitionCategory(r.category),
    levelNumber: parseInt(String(r.level_number), 10),
    levelName: String(r.level_name),
    levelNameUr: String(r.level_name_ur || r.level_name),
    requiredThreshold: parseInt(String(r.required_threshold ?? '0'), 10),
    badgeImageUrl: String(r.badge_image_url || '/assets/gifts/07_08_wealth_shining_and_honor.png'),
    iconKey: String(r.icon_key || 'wings_gold'),
    wingStyle: String(r.wing_style || 'cosmic_bronze'),
    borderColor: String(r.border_color || '#EC248F'),
    description: String(r.description || ''),
    descriptionUr: String(r.description_ur || r.description || ''),
    benefitKeys: parseJsonArray(r.benefit_keys),
    displayOrder: parseInt(String(r.display_order ?? '1'), 10),
    isActive: Boolean(r.is_active),
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
    updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : '',
  };
}

function mapBenefitRow(r: any): RecognitionBenefitItem {
  return {
    benefitKey: String(r.benefit_key),
    title: String(r.title),
    titleUr: String(r.title_ur || r.title),
    category: String(r.category),
    description: String(r.description || ''),
    descriptionUr: String(r.description_ur || r.description || ''),
    assetUrl: r.asset_url ? String(r.asset_url) : null,
    isFinancialReward: false,
    isActive: Boolean(r.is_active),
    displayOrder: parseInt(String(r.display_order ?? '1'), 10),
  };
}

function mapFactorRow(r: any): HonorRecognitionFactor {
  return {
    factorKey: String(r.factor_key),
    title: String(r.title),
    titleUr: String(r.title_ur || r.title),
    description: String(r.description || ''),
    defaultPoints: parseInt(String(r.default_points ?? '100'), 10),
    requiresAdminReview: Boolean(r.requires_admin_review),
    isActive: Boolean(r.is_active),
    displayOrder: parseInt(String(r.display_order ?? '1'), 10),
  };
}

export async function invalidateRecognitionCaches(userId?: string): Promise<void> {
  await redisDel(RECOGNITION_CATALOG_CACHE_KEY);
  if (userId) {
    await redisDel(`recognition:summary:${userId}:private`);
    await redisDel(`recognition:summary:${userId}:public`);
  }
}

export async function getRecognitionSystemRules(dbClient?: any): Promise<RecognitionSystemRules> {
  const exec = dbClient
    ? (sql: string, params?: any[]) => dbClient.query(sql, params).then((r: any) => r.rows)
    : query;

  try {
    const rows = await exec(`SELECT rule_key, rule_value FROM popolive.recognition_system_rules`);
    const map: Record<string, string> = {};
    for (const r of rows) {
      map[String(r.rule_key)] = String(r.rule_value);
    }
    return {
      allowPromoCoinsForWealth: map.allow_promo_coins_for_wealth === 'true',
      wealthScorePerCoin: Math.max(0.1, parseFloat(map.wealth_score_per_coin || '1') || 1),
      shiningScorePerCoin: Math.max(0.1, parseFloat(map.shining_score_per_coin || '1') || 1),
      autoAdjustOnReversal: map.auto_adjust_on_reversal !== 'false',
      fraudDailySpikeThreshold: Math.max(1000, parseInt(map.fraud_daily_spike_threshold || '250000', 10) || 250000),
      leaderboardDefaultLimit: Math.min(50, Math.max(5, parseInt(map.leaderboard_default_limit || '20', 10) || 20)),
    };
  } catch {
    return {
      allowPromoCoinsForWealth: false,
      wealthScorePerCoin: 1,
      shiningScorePerCoin: 1,
      autoAdjustOnReversal: true,
      fraudDailySpikeThreshold: 250000,
      leaderboardDefaultLimit: 20,
    };
  }
}

export async function getRecognitionCatalog(options: { includeInactive?: boolean } = {}) {
  if (!options.includeInactive) {
    const cachedRaw = await redisGet(RECOGNITION_CATALOG_CACHE_KEY);
    if (cachedRaw) {
      try {
        return JSON.parse(cachedRaw);
      } catch {}
    }
  }

  const levelWhere = options.includeInactive ? '' : 'WHERE is_active = TRUE';
  const benefitWhere = options.includeInactive ? '' : 'WHERE is_active = TRUE';
  const factorWhere = options.includeInactive ? '' : 'WHERE is_active = TRUE';

  const [levelRows, benefitRows, factorRows, rules] = await Promise.all([
    query<any>(
      `SELECT * FROM popolive.recognition_levels ${levelWhere}
       ORDER BY category ASC, required_threshold ASC, level_number ASC, display_order ASC`
    ),
    query<any>(
      `SELECT * FROM popolive.recognition_benefits ${benefitWhere}
       ORDER BY display_order ASC, benefit_key ASC`
    ),
    query<any>(
      `SELECT * FROM popolive.honor_recognition_factors ${factorWhere}
       ORDER BY display_order ASC, factor_key ASC`
    ),
    getRecognitionSystemRules(),
  ]);

  const allLevels = levelRows.map(mapLevelRow);
  const levelsByCategory: Record<RecognitionCategory, RecognitionLevelTier[]> = {
    wealth: allLevels.filter((l) => l.category === 'wealth'),
    shining: allLevels.filter((l) => l.category === 'shining'),
    honor: allLevels.filter((l) => l.category === 'honor'),
  };
  const benefits = benefitRows.map(mapBenefitRow);
  const honorFactors = factorRows.map(mapFactorRow);

  const result = {
    categories: RECOGNITION_CATEGORIES,
    levelsByCategory,
    benefits,
    honorFactors,
    rules,
  };

  if (!options.includeInactive) {
    await redisSetWithTtl(RECOGNITION_CATALOG_CACHE_KEY, JSON.stringify(result), 60);
  }
  return result;
}

export async function emitRecognitionRealtimeEvent(
  clientOrNull: any | null,
  userId: string,
  eventName: string,
  payload: Record<string, any>
): Promise<void> {
  const exec = clientOrNull
    ? (sql: string, params: any[]) => clientOrNull.query(sql, params)
    : (sql: string, params: any[]) => query(sql, params);

  await exec(
    `INSERT INTO popolive.recognition_realtime_events (user_id, event_name, payload)
     VALUES ($1, $2, $3::jsonb)`,
    [userId, eventName, JSON.stringify({ ...payload, timestamp: new Date().toISOString() })]
  );
}

// =============================================================================
// Paid vs Promotional Coin Pool Tracking (Finance-Approved Wealth Rules)
// =============================================================================

async function ensureCoinPoolLocked(
  client: any,
  userId: string,
  legacyWalletCoinsHint?: number,
  excludeTxId?: string
) {
  const existing = (
    await client.query(`SELECT * FROM popolive.user_recognition_coin_pools WHERE user_id = $1 FOR UPDATE`, [userId])
  ).rows;
  if (existing.length > 0) return existing[0];

  const wRows = (
    await client.query(`SELECT coins FROM popolive.user_wallets WHERE user_id = $1`, [userId])
  ).rows;
  const currentWalletCoins =
    typeof legacyWalletCoinsHint === 'number' && legacyWalletCoinsHint >= 0
      ? legacyWalletCoinsHint
      : Math.max(0, parseInt(String(wRows[0]?.coins ?? '0'), 10));

  // Only treat legacy pre-existing balance as paid coins to the extent of verified top-ups / non-promo admin credits
  const histRows = (
    await client.query(
      `SELECT COALESCE(SUM(CASE WHEN direction = 'credit' AND (
         transaction_type = 'topup'
         OR (transaction_type = 'admin_credit' AND COALESCE((metadata->>'isPromotional')::boolean, FALSE) = FALSE)
       ) THEN coin_amount ELSE 0 END), 0)::bigint AS paid_credits
       FROM popolive.coin_transactions
       WHERE user_id = $1 AND status = 'completed' AND ($2::text IS NULL OR transaction_id <> $2)`,
      [userId, excludeTxId || null]
    )
  ).rows;
  const paidCredits = Math.max(0, parseInt(String(histRows[0]?.paid_credits ?? '0'), 10));
  const initialPaid = Math.min(currentWalletCoins, paidCredits);
  const initialPromo = Math.max(0, currentWalletCoins - initialPaid);

  const inserted = (
    await client.query(
      `INSERT INTO popolive.user_recognition_coin_pools (user_id, paid_coins, promo_coins, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [userId, initialPaid, initialPromo]
    )
  ).rows[0];
  return inserted;
}

export async function recordCoinPoolCreditInTx(
  client: any,
  params: {
    userId: string;
    paidCoins?: number;
    promoCoins?: number;
    walletCoinsBefore?: number;
    excludeTxId?: string;
  }
): Promise<void> {
  const paidAdd = Math.max(0, Math.floor(params.paidCoins || 0));
  const promoAdd = Math.max(0, Math.floor(params.promoCoins || 0));
  if (paidAdd === 0 && promoAdd === 0) return;

  const pool = await ensureCoinPoolLocked(client, params.userId, params.walletCoinsBefore, params.excludeTxId);
  const nextPaid = parseInt(String(pool.paid_coins ?? '0'), 10) + paidAdd;
  const nextPromo = parseInt(String(pool.promo_coins ?? '0'), 10) + promoAdd;

  await client.query(
    `UPDATE popolive.user_recognition_coin_pools
     SET paid_coins = $1, promo_coins = $2, updated_at = NOW()
     WHERE user_id = $3`,
    [nextPaid, nextPromo, params.userId]
  );
}

export async function consumeCoinsFromPoolInTx(
  client: any,
  params: {
    userId: string;
    totalSpendCoins: number;
    walletCoinsBeforeSpend?: number;
    excludeFromWealth?: boolean;
  }
): Promise<{ paidCoinsUsed: number; promoCoinsUsed: number; wealthEligibleCoins: number }> {
  const spend = Math.max(0, Math.floor(params.totalSpendCoins || 0));
  if (spend <= 0) {
    return { paidCoinsUsed: 0, promoCoinsUsed: 0, wealthEligibleCoins: 0 };
  }

  const rules = await getRecognitionSystemRules(client);
  const pool = await ensureCoinPoolLocked(client, params.userId, params.walletCoinsBeforeSpend);
  const paidAvail = Math.max(0, parseInt(String(pool.paid_coins ?? '0'), 10));
  const promoAvail = Math.max(0, parseInt(String(pool.promo_coins ?? '0'), 10));

  // Paid coins count when available; remainder comes from promo pool
  const paidUsed = Math.min(paidAvail, spend);
  const remainderAfterPaid = spend - paidUsed;
  const promoUsed = Math.min(promoAvail, remainderAfterPaid);

  await client.query(
    `UPDATE popolive.user_recognition_coin_pools
     SET paid_coins = $1, promo_coins = $2, updated_at = NOW()
     WHERE user_id = $3`,
    [paidAvail - paidUsed, promoAvail - promoUsed, params.userId]
  );

  let wealthEligibleCoins = 0;
  if (!params.excludeFromWealth) {
    wealthEligibleCoins = rules.allowPromoCoinsForWealth
      ? spend
      : Math.floor(paidUsed * rules.wealthScorePerCoin);
  }

  return {
    paidCoinsUsed: paidUsed,
    promoCoinsUsed: promoUsed,
    wealthEligibleCoins,
  };
}

export async function restoreCoinsToPoolInTx(
  client: any,
  params: { userId: string; paidCoinsRestore?: number; promoCoinsRestore?: number }
): Promise<void> {
  const paidRestore = Math.max(0, Math.floor(params.paidCoinsRestore || 0));
  const promoRestore = Math.max(0, Math.floor(params.promoCoinsRestore || 0));
  if (paidRestore === 0 && promoRestore === 0) return;

  const pool = await ensureCoinPoolLocked(client, params.userId, 0);
  const nextPaid = parseInt(String(pool.paid_coins ?? '0'), 10) + paidRestore;
  const nextPromo = parseInt(String(pool.promo_coins ?? '0'), 10) + promoRestore;

  await client.query(
    `UPDATE popolive.user_recognition_coin_pools
     SET paid_coins = $1, promo_coins = $2, updated_at = NOW()
     WHERE user_id = $3`,
    [nextPaid, nextPromo, params.userId]
  );
}

// =============================================================================
// Core Level Calculation & Progression Engine (Strictly Per Category)
// =============================================================================

async function computeLevelProgressForCategory(
  clientOrDb: any,
  category: RecognitionCategory,
  score: number
): Promise<{
  currentLevel: RecognitionLevelTier;
  nextLevel: RecognitionLevelTier | null;
  progressPercent: number;
  allTiers: RecognitionLevelTier[];
}> {
  const exec = (sql: string, params?: any[]) =>
    clientOrDb ? clientOrDb.query(sql, params).then((r: any) => r.rows) : query<any>(sql, params);

  const rows = await exec(
    `SELECT * FROM popolive.recognition_levels
     WHERE category = $1 AND is_active = TRUE
     ORDER BY required_threshold ASC, level_number ASC, display_order ASC`,
    [category]
  );

  if (!rows || rows.length === 0) {
    throw Object.assign(new Error(`No active ${category} levels configured in backend.`), {
      code: 'NO_ACTIVE_LEVELS',
      status: 500,
    });
  }

  const allTiers = rows.map(mapLevelRow);
  let currentLevel = allTiers[0];
  for (const tier of allTiers) {
    if (score >= tier.requiredThreshold) {
      currentLevel = tier;
    } else {
      break;
    }
  }

  const nextLevel = allTiers.find((t: RecognitionLevelTier) => t.requiredThreshold > currentLevel.requiredThreshold) || null;
  let progressPercent = 100;
  if (nextLevel) {
    const span = nextLevel.requiredThreshold - currentLevel.requiredThreshold;
    const earned = Math.max(0, score - currentLevel.requiredThreshold);
    progressPercent = span > 0 ? Math.min(99.99, Math.max(0, Number(((earned / span) * 100).toFixed(2)))) : 0;
  }

  return { currentLevel, nextLevel, progressPercent, allTiers };
}

async function ensureProgressRowLocked(
  client: any,
  userId: string,
  category: RecognitionCategory
) {
  const rows = (
    await client.query(
      `SELECT * FROM popolive.user_recognition_progress WHERE user_id = $1 AND category = $2 FOR UPDATE`,
      [userId, category]
    )
  ).rows;
  if (rows.length > 0) return rows[0];

  const calc = await computeLevelProgressForCategory(client, category, 0);
  const inserted = (
    await client.query(
      `INSERT INTO popolive.user_recognition_progress (
         user_id, category, current_score, current_level_id, current_level_number,
         highest_level_number, next_level_id, next_threshold, progress_percent, activated_at, updated_at
       ) VALUES ($1, $2, 0, $3, $4, $4, $5, $6, $7, NOW(), NOW())
       ON CONFLICT (user_id, category) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [
        userId,
        category,
        calc.currentLevel.levelId,
        calc.currentLevel.levelNumber,
        calc.nextLevel ? calc.nextLevel.levelId : null,
        calc.nextLevel ? calc.nextLevel.requiredThreshold : null,
        calc.progressPercent,
      ]
    )
  ).rows[0];
  return inserted;
}

export async function applyRecognitionDeltaInTx(
  client: any,
  params: {
    userId: string;
    category: RecognitionCategory;
    eventType: string;
    scoreDelta: number;
    sourceType: string;
    sourceTxId?: string | null;
    idempotencyKey?: string | null;
    isPromotional?: boolean;
    reason: string;
    createdBy: string;
    metadata?: Record<string, any>;
  }
): Promise<{
  applied: boolean;
  isDuplicate: boolean;
  leveledUp: boolean;
  category: RecognitionCategory;
  previousScore: number;
  newScore: number;
  previousLevelNumber: number;
  newLevelNumber: number;
  currentLevel: RecognitionLevelTier;
  nextLevel: RecognitionLevelTier | null;
  progressPercent: number;
  ledgerId: string | null;
}> {
  const category = assertRecognitionCategory(params.category);
  const cleanIdem = params.idempotencyKey ? String(params.idempotencyKey).trim() : null;
  const cleanSourceTx = params.sourceTxId ? String(params.sourceTxId).trim() : null;

  // Duplicate check #1: idempotency key
  if (cleanIdem) {
    const dup = (
      await client.query(`SELECT * FROM popolive.user_recognition_ledger WHERE idempotency_key = $1`, [cleanIdem])
    ).rows;
    if (dup.length > 0) {
      const progress = await ensureProgressRowLocked(client, params.userId, category);
      const calc = await computeLevelProgressForCategory(
        client,
        category,
        parseInt(String(progress.current_score ?? '0'), 10)
      );
      return {
        applied: false,
        isDuplicate: true,
        leveledUp: false,
        category,
        previousScore: parseInt(String(progress.current_score ?? '0'), 10),
        newScore: parseInt(String(progress.current_score ?? '0'), 10),
        previousLevelNumber: calc.currentLevel.levelNumber,
        newLevelNumber: calc.currentLevel.levelNumber,
        currentLevel: calc.currentLevel,
        nextLevel: calc.nextLevel,
        progressPercent: calc.progressPercent,
        ledgerId: dup[0].ledger_id,
      };
    }
  }

  // Duplicate check #2: same category + positive source_tx_id
  if (cleanSourceTx && params.scoreDelta > 0) {
    const dupSrc = (
      await client.query(
        `SELECT * FROM popolive.user_recognition_ledger
         WHERE category = $1 AND source_tx_id = $2 AND score_delta > 0`,
        [category, cleanSourceTx]
      )
    ).rows;
    if (dupSrc.length > 0) {
      const progress = await ensureProgressRowLocked(client, params.userId, category);
      const calc = await computeLevelProgressForCategory(
        client,
        category,
        parseInt(String(progress.current_score ?? '0'), 10)
      );
      return {
        applied: false,
        isDuplicate: true,
        leveledUp: false,
        category,
        previousScore: parseInt(String(progress.current_score ?? '0'), 10),
        newScore: parseInt(String(progress.current_score ?? '0'), 10),
        previousLevelNumber: calc.currentLevel.levelNumber,
        newLevelNumber: calc.currentLevel.levelNumber,
        currentLevel: calc.currentLevel,
        nextLevel: calc.nextLevel,
        progressPercent: calc.progressPercent,
        ledgerId: dupSrc[0].ledger_id,
      };
    }
  }

  const progRow = await ensureProgressRowLocked(client, params.userId, category);
  const prevScore = Math.max(0, parseInt(String(progRow.current_score ?? '0'), 10));
  const prevLevelNumber = parseInt(String(progRow.current_level_number ?? '1'), 10);
  const prevLevelId = String(progRow.current_level_id);
  const prevHighestLevel = parseInt(String(progRow.highest_level_number ?? prevLevelNumber), 10);

  const rawDelta = Math.trunc(params.scoreDelta || 0);
  const newScore = Math.max(0, prevScore + rawDelta);
  const effectiveDelta = newScore - prevScore;

  const ledgerId = generateRecId('REC_LDG');
  const statusVal = effectiveDelta === 0 && params.isPromotional ? 'ignored' : 'applied';

  await client.query(
    `INSERT INTO popolive.user_recognition_ledger (
       ledger_id, user_id, category, event_type, score_delta, balance_after,
       source_type, source_tx_id, idempotency_key, is_promotional, status, reason, created_by, metadata
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)`,
    [
      ledgerId,
      params.userId,
      category,
      params.eventType,
      effectiveDelta,
      newScore,
      params.sourceType,
      cleanSourceTx,
      cleanIdem,
      Boolean(params.isPromotional),
      statusVal,
      params.reason,
      params.createdBy,
      JSON.stringify(params.metadata || {}),
    ]
  );

  const calc = await computeLevelProgressForCategory(client, category, newScore);
  const nextHighest = Math.max(prevHighestLevel, calc.currentLevel.levelNumber);

  await client.query(
    `UPDATE popolive.user_recognition_progress
     SET current_score = $1,
         current_level_id = $2,
         current_level_number = $3,
         highest_level_number = $4,
         next_level_id = $5,
         next_threshold = $6,
         progress_percent = $7,
         updated_at = NOW()
     WHERE user_id = $8 AND category = $9`,
    [
      newScore,
      calc.currentLevel.levelId,
      calc.currentLevel.levelNumber,
      nextHighest,
      calc.nextLevel ? calc.nextLevel.levelId : null,
      calc.nextLevel ? calc.nextLevel.requiredThreshold : null,
      calc.progressPercent,
      params.userId,
      category,
    ]
  );

  // Sync legacy users.wealth_level cleanly if wealth changed and userId is a valid UUID
  if (category === 'wealth' && /^[0-9a-f-]{36}$/i.test(params.userId)) {
    await client.query(
      `UPDATE popolive.users SET wealth_level = $1, updated_at = NOW() WHERE id = $2::uuid`,
      [calc.currentLevel.levelNumber, params.userId]
    ).catch(() => {});
  }

  // Suspicious velocity check on large positive score bursts
  const rules = await getRecognitionSystemRules(client);
  if (effectiveDelta > 0) {
    const spikeRows = (
      await client.query(
        `SELECT COALESCE(SUM(score_delta), 0)::bigint AS sum_24h
         FROM popolive.user_recognition_ledger
         WHERE user_id = $1 AND category = $2 AND score_delta > 0 AND is_reversed = FALSE
           AND created_at > NOW() - INTERVAL '24 hours'`,
        [params.userId, category]
      )
    ).rows;
    const sum24h = parseInt(String(spikeRows[0]?.sum_24h ?? '0'), 10);
    if (sum24h >= rules.fraudDailySpikeThreshold) {
      const dayTag = new Date().toISOString().slice(0, 10);
      const alertAuditId = `RECALT_${category.toUpperCase()}_${params.userId.slice(0, 16)}_${dayTag}`;
      await client.query(
        `INSERT INTO popolive.recognition_admin_audit_logs (
           audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, after_data
         ) VALUES ($1, 'suspicious_velocity', $2, 'suspicious_activity_flagged', 'fraud_monitor', 'system', $3, $4::jsonb)
         ON CONFLICT (audit_id) DO NOTHING`,
        [
          alertAuditId,
          `${params.userId}:${category}`,
          `High 24h ${category} velocity (${sum24h} >= ${rules.fraudDailySpikeThreshold}) flagged for review`,
          JSON.stringify({ userId: params.userId, category, sum24h, threshold: rules.fraudDailySpikeThreshold, ledgerId }),
        ]
      );
    }
  }

  let leveledUp = false;
  if (calc.currentLevel.levelNumber !== prevLevelNumber) {
    await client.query(
      `INSERT INTO popolive.user_recognition_history (
         history_id, user_id, category, previous_level_id, previous_level_number,
         new_level_id, new_level_number, score_at_change, change_reason, source_ledger_id, activated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())`,
      [
        generateRecId('REC_HIS'),
        params.userId,
        category,
        prevLevelId,
        prevLevelNumber,
        calc.currentLevel.levelId,
        calc.currentLevel.levelNumber,
        newScore,
        params.eventType,
        ledgerId,
      ]
    );

    if (calc.currentLevel.levelNumber > prevLevelNumber) {
      const dedupKey = `${params.userId}:${category}:lv_${calc.currentLevel.levelNumber}`;
      const evtId = generateRecId('REC_LVLUP');
      const insEvt = await client.query(
        `INSERT INTO popolive.recognition_level_up_events (
           event_id, dedup_key, user_id, category, new_level_id, new_level_number,
           new_level_name, badge_image_url, unlocked_benefits, is_acknowledged
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,FALSE)
         ON CONFLICT (dedup_key) DO NOTHING
         RETURNING event_id`,
        [
          evtId,
          dedupKey,
          params.userId,
          category,
          calc.currentLevel.levelId,
          calc.currentLevel.levelNumber,
          calc.currentLevel.levelName,
          calc.currentLevel.badgeImageUrl,
          JSON.stringify(calc.currentLevel.benefitKeys),
        ]
      );

      if (insEvt.rows.length > 0) {
        leveledUp = true;
        await emitRecognitionRealtimeEvent(client, params.userId, 'levels:level_up', {
          eventId: evtId,
          userId: params.userId,
          category,
          previousLevelNumber: prevLevelNumber,
          newLevelNumber: calc.currentLevel.levelNumber,
          newLevelId: calc.currentLevel.levelId,
          newLevelName: calc.currentLevel.levelName,
          newLevelNameUr: calc.currentLevel.levelNameUr,
          badgeImageUrl: calc.currentLevel.badgeImageUrl,
          wingStyle: calc.currentLevel.wingStyle,
          unlockedBenefits: calc.currentLevel.benefitKeys,
          currentScore: newScore,
        });

        await emitRecognitionRealtimeEvent(client, params.userId, 'levels:benefits_updated', {
          userId: params.userId,
          category,
          levelNumber: calc.currentLevel.levelNumber,
          activeBenefitKeys: calc.currentLevel.benefitKeys,
        });
      }
    }
  }

  // Category-specific & progress events
  const catEvent =
    category === 'wealth'
      ? 'levels:wealth_updated'
      : category === 'shining'
      ? 'levels:shining_updated'
      : 'levels:honor_updated';

  const eventPayload = {
    userId: params.userId,
    category,
    scoreDelta: effectiveDelta,
    currentScore: newScore,
    currentLevelNumber: calc.currentLevel.levelNumber,
    currentLevelName: calc.currentLevel.levelName,
    nextLevelNumber: calc.nextLevel?.levelNumber || null,
    nextThreshold: calc.nextLevel?.requiredThreshold || null,
    progressPercent: calc.progressPercent,
    leveledUp,
    status: statusVal,
  };

  await emitRecognitionRealtimeEvent(client, params.userId, catEvent, eventPayload);
  await emitRecognitionRealtimeEvent(client, params.userId, 'levels:progress_updated', eventPayload);

  return {
    applied: effectiveDelta !== 0 || statusVal === 'ignored',
    isDuplicate: false,
    leveledUp,
    category,
    previousScore: prevScore,
    newScore,
    previousLevelNumber: prevLevelNumber,
    newLevelNumber: calc.currentLevel.levelNumber,
    currentLevel: calc.currentLevel,
    nextLevel: calc.nextLevel,
    progressPercent: calc.progressPercent,
    ledgerId,
  };
}

// =============================================================================
// Integrated Transactional Hooks for Gift Sending, Coin Spending & Reversals
// =============================================================================

export async function recordGiftRecognitionInTx(
  client: any,
  params: {
    senderUserId: string;
    totalGiftCoins: number;
    giftTransactionId: string;
    walletCoinsBeforeSpend?: number;
  }
): Promise<{
  wealthPaidCoinsUsed: number;
  wealthScoreAdded: number;
  shiningScoreAdded: number;
}> {
  const coins = Math.max(0, Math.floor(params.totalGiftCoins || 0));
  if (coins <= 0) {
    return { wealthPaidCoinsUsed: 0, wealthScoreAdded: 0, shiningScoreAdded: 0 };
  }

  const rules = await getRecognitionSystemRules(client);
  const poolConsume = await consumeCoinsFromPoolInTx(client, {
    userId: params.senderUserId,
    totalSpendCoins: coins,
    walletCoinsBeforeSpend: params.walletCoinsBeforeSpend,
    excludeFromWealth: false,
  });

  // 1. Wealth progression (ONLY paid coins unless promo spending explicitly approved in finance config)
  const wealthMeta = {
    giftTransactionId: params.giftTransactionId,
    paidCoinsUsed: poolConsume.paidCoinsUsed,
    promoCoinsUsed: poolConsume.promoCoinsUsed,
  };

  if (poolConsume.wealthEligibleCoins > 0) {
    await applyRecognitionDeltaInTx(client, {
      userId: params.senderUserId,
      category: 'wealth',
      eventType: 'verified_gift_coin_spend',
      scoreDelta: poolConsume.wealthEligibleCoins,
      sourceType: 'gift_transaction',
      sourceTxId: params.giftTransactionId,
      idempotencyKey: `wealth:${params.giftTransactionId}`,
      isPromotional: false,
      reason: `Eligible paid spend of ${poolConsume.wealthEligibleCoins} coins on gift ${params.giftTransactionId}`,
      createdBy: 'gift_service',
      metadata: wealthMeta,
    });
  } else {
    await applyRecognitionDeltaInTx(client, {
      userId: params.senderUserId,
      category: 'wealth',
      eventType: 'promotional_spend_excluded',
      scoreDelta: 0,
      sourceType: 'gift_transaction',
      sourceTxId: null,
      idempotencyKey: `wealth_promo_excl:${params.giftTransactionId}`,
      isPromotional: true,
      reason: `Promotional coins spend (${coins} coins) excluded per finance configuration`,
      createdBy: 'gift_service',
      metadata: wealthMeta,
    });
  }

  // 2. Shining progression (STRICTLY separate: tracks verified successful gift sending value)
  const shiningDelta = Math.max(1, Math.floor(coins * rules.shiningScorePerCoin));
  await applyRecognitionDeltaInTx(client, {
    userId: params.senderUserId,
    category: 'shining',
    eventType: 'verified_gift_sent',
    scoreDelta: shiningDelta,
    sourceType: 'gift_transaction',
    sourceTxId: params.giftTransactionId,
    idempotencyKey: `shining:${params.giftTransactionId}`,
    isPromotional: false,
    reason: `Verified successful gift (${coins} coins) via ${params.giftTransactionId}`,
    createdBy: 'gift_service',
    metadata: { giftTransactionId: params.giftTransactionId, giftCoins: coins },
  });

  return {
    wealthPaidCoinsUsed: poolConsume.paidCoinsUsed,
    wealthScoreAdded: poolConsume.wealthEligibleCoins,
    shiningScoreAdded: shiningDelta,
  };
}

export async function recordCoinSpendWealthInTx(
  client: any,
  params: {
    userId: string;
    coinsSpent: number;
    sourceType: string;
    sourceTxId: string;
    walletCoinsBeforeSpend?: number;
    excludeFromWealth?: boolean;
  }
): Promise<{ paidCoinsUsed: number; wealthScoreAdded: number }> {
  const spend = Math.max(0, Math.floor(params.coinsSpent || 0));
  if (spend <= 0) return { paidCoinsUsed: 0, wealthScoreAdded: 0 };

  const poolConsume = await consumeCoinsFromPoolInTx(client, {
    userId: params.userId,
    totalSpendCoins: spend,
    walletCoinsBeforeSpend: params.walletCoinsBeforeSpend,
    excludeFromWealth: Boolean(params.excludeFromWealth),
  });

  if (!params.excludeFromWealth && poolConsume.wealthEligibleCoins > 0) {
    await applyRecognitionDeltaInTx(client, {
      userId: params.userId,
      category: 'wealth',
      eventType: 'verified_feature_spend',
      scoreDelta: poolConsume.wealthEligibleCoins,
      sourceType: params.sourceType,
      sourceTxId: params.sourceTxId,
      idempotencyKey: `wealth:${params.sourceType}:${params.sourceTxId}`,
      isPromotional: false,
      reason: `Eligible coin spend (${poolConsume.wealthEligibleCoins} coins) via ${params.sourceType}`,
      createdBy: 'wallet_service',
      metadata: {
        sourceType: params.sourceType,
        paidCoinsUsed: poolConsume.paidCoinsUsed,
        promoCoinsUsed: poolConsume.promoCoinsUsed,
      },
    });
  }

  return {
    paidCoinsUsed: poolConsume.paidCoinsUsed,
    wealthScoreAdded: poolConsume.wealthEligibleCoins,
  };
}

export async function reverseRecognitionForSourceInTx(
  client: any,
  params: {
    sourceTxId: string;
    reversalReason: string;
    actorId: string;
  }
): Promise<{ reversedCount: number }> {
  const rules = await getRecognitionSystemRules(client);
  const origRows = (
    await client.query(
      `SELECT * FROM popolive.user_recognition_ledger
       WHERE source_tx_id = $1 AND is_reversed = FALSE AND score_delta > 0
       ORDER BY created_at ASC`,
      [params.sourceTxId]
    )
  ).rows;

  let reversedCount = 0;
  for (const orig of origRows) {
    const revIdem = `rev:${orig.ledger_id}`;
    const cat = assertRecognitionCategory(orig.category);
    const meta = typeof orig.metadata === 'object' && orig.metadata !== null ? orig.metadata : {};

    if (cat === 'wealth') {
      const paidUsed = Math.max(0, parseInt(String(meta.paidCoinsUsed ?? '0'), 10));
      const promoUsed = Math.max(0, parseInt(String(meta.promoCoinsUsed ?? '0'), 10));
      if (paidUsed > 0 || promoUsed > 0) {
        await restoreCoinsToPoolInTx(client, {
          userId: orig.user_id,
          paidCoinsRestore: paidUsed,
          promoCoinsRestore: promoUsed,
        });
      }
    }

    if (rules.autoAdjustOnReversal) {
      const res = await applyRecognitionDeltaInTx(client, {
        userId: orig.user_id,
        category: cat,
        eventType: 'transaction_reversed',
        scoreDelta: -Math.abs(parseInt(String(orig.score_delta), 10)),
        sourceType: 'reversal',
        sourceTxId: `REV:${params.sourceTxId}:${cat}`,
        idempotencyKey: revIdem,
        reason: `Reversal of ${orig.ledger_id} (${params.sourceTxId}): ${params.reversalReason}`,
        createdBy: params.actorId,
        metadata: { reversedLedgerId: orig.ledger_id, originalSourceTxId: params.sourceTxId },
      });

      await client.query(
        `UPDATE popolive.user_recognition_ledger
         SET is_reversed = TRUE, status = 'reversed', reversed_by_ledger_id = $1
         WHERE ledger_id = $2`,
        [res.ledgerId, orig.ledger_id]
      );
      reversedCount += 1;
    }
  }

  return { reversedCount };
}

// =============================================================================
// User Summary, Profile Projection, History & Preferences
// =============================================================================

async function loadUserPreferences(userId: string): Promise<UserRecognitionPreferences> {
  const rows = await query<any>(
    `SELECT * FROM popolive.user_recognition_preferences WHERE user_id = $1`,
    [userId]
  );
  if (rows.length === 0) {
    return {
      animationsEnabled: true,
      soundEnabled: true,
      hideWealthLeaderboard: false,
      hideShiningLeaderboard: false,
      hideHonorLeaderboard: false,
    };
  }
  const r = rows[0];
  return {
    animationsEnabled: Boolean(r.animations_enabled),
    soundEnabled: Boolean(r.sound_enabled),
    hideWealthLeaderboard: Boolean(r.hide_wealth_leaderboard),
    hideShiningLeaderboard: Boolean(r.hide_shining_leaderboard),
    hideHonorLeaderboard: Boolean(r.hide_honor_leaderboard),
  };
}

export async function getUserRecognitionSummary(
  userId: string,
  options: { includePrivate?: boolean; skipCache?: boolean } = {}
): Promise<UserRecognitionSummary> {
  const cleanUserId = String(userId || '').trim() || DEFAULT_DEMO_WALLET_USER_ID;
  const cacheKey = `recognition:summary:${cleanUserId}:${options.includePrivate ? 'private' : 'public'}`;
  if (!options.skipCache) {
    const cachedRaw = await redisGet(cacheKey);
    if (cachedRaw) {
      try {
        return JSON.parse(cachedRaw) as UserRecognitionSummary;
      } catch {}
    }
  }

  const catalog = await getRecognitionCatalog();
  const progRows = await query<any>(
    `SELECT * FROM popolive.user_recognition_progress WHERE user_id = $1`,
    [cleanUserId]
  );
  const progByCat = new Map<string, any>();
  for (const r of progRows) {
    progByCat.set(String(r.category), r);
  }

  const benefitMap = new Map<string, RecognitionBenefitItem>();
  for (const b of catalog.benefits as RecognitionBenefitItem[]) {
    benefitMap.set(b.benefitKey, b);
  }

  const buildCategorySummary = async (cat: RecognitionCategory): Promise<CategoryProgressSummary> => {
    const row = progByCat.get(cat);
    const score = Math.max(0, parseInt(String(row?.current_score ?? '0'), 10));
    const calc = await computeLevelProgressForCategory(null, cat, score);
    const highest = Math.max(
      calc.currentLevel.levelNumber,
      parseInt(String(row?.highest_level_number ?? '1'), 10)
    );
    const remainingToNext = calc.nextLevel ? Math.max(0, calc.nextLevel.requiredThreshold - score) : 0;
    const activeBenefitKeys = calc.currentLevel.benefitKeys;
    const approvedBenefits = activeBenefitKeys
      .map((k) => benefitMap.get(k))
      .filter(Boolean) as RecognitionBenefitItem[];

    return {
      category: cat,
      currentScore: score,
      currentLevelNumber: calc.currentLevel.levelNumber,
      currentLevelId: calc.currentLevel.levelId,
      currentLevelName: calc.currentLevel.levelName,
      currentLevelNameUr: calc.currentLevel.levelNameUr,
      badgeImageUrl: calc.currentLevel.badgeImageUrl,
      iconKey: calc.currentLevel.iconKey,
      wingStyle: calc.currentLevel.wingStyle,
      borderColor: calc.currentLevel.borderColor,
      highestLevelNumber: highest,
      nextLevelId: calc.nextLevel?.levelId || null,
      nextLevelNumber: calc.nextLevel?.levelNumber || null,
      nextLevelName: calc.nextLevel?.levelName || null,
      nextLevelNameUr: calc.nextLevel?.levelNameUr || null,
      nextThreshold: calc.nextLevel?.requiredThreshold ?? null,
      remainingToNext,
      progressPercent: calc.progressPercent,
      activatedAt: row?.activated_at ? new Date(row.activated_at).toISOString() : new Date().toISOString(),
      updatedAt: row?.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      activeBenefitKeys,
      approvedBenefits,
      allTiers: calc.allTiers,
    };
  };

  const [wealth, shining, honor, preferences] = await Promise.all([
    buildCategorySummary('wealth'),
    buildCategorySummary('shining'),
    buildCategorySummary('honor'),
    loadUserPreferences(cleanUserId),
  ]);

  let unacknowledgedLevelUps: RecognitionLevelUpEventRecord[] = [];
  if (options.includePrivate) {
    const evtRows = await query<any>(
      `SELECT * FROM popolive.recognition_level_up_events
       WHERE user_id = $1 AND is_acknowledged = FALSE
       ORDER BY created_at DESC LIMIT 10`,
      [cleanUserId]
    );
    unacknowledgedLevelUps = evtRows.map((e: any) => ({
      eventId: String(e.event_id),
      userId: String(e.user_id),
      category: assertRecognitionCategory(e.category),
      newLevelId: String(e.new_level_id),
      newLevelNumber: parseInt(String(e.new_level_number), 10),
      newLevelName: String(e.new_level_name),
      badgeImageUrl: String(e.badge_image_url),
      unlockedBenefits: parseJsonArray(e.unlocked_benefits),
      isAcknowledged: Boolean(e.is_acknowledged),
      createdAt: e.created_at ? new Date(e.created_at).toISOString() : '',
    }));
  }

  const summary: UserRecognitionSummary = {
    userId: cleanUserId,
    wealth,
    shining,
    honor,
    preferences,
    unacknowledgedLevelUps,
    rulesSnapshot: {
      allowPromoCoinsForWealth: Boolean(catalog.rules?.allowPromoCoinsForWealth),
      vipCombinedAllowed: false,
    },
  };

  await redisSetWithTtl(cacheKey, JSON.stringify(summary), 20);
  return summary;
}

export async function getUserRecognitionHistory(
  userId: string,
  options: { category?: string | null; limit?: number } = {}
) {
  const limit = Math.min(100, Math.max(1, options.limit || 40));
  const filterCat = options.category ? assertRecognitionCategory(options.category) : null;

  const historyParams: any[] = [userId];
  let historyWhere = 'WHERE h.user_id = $1';
  if (filterCat) {
    historyParams.push(filterCat);
    historyWhere += ` AND h.category = $${historyParams.length}`;
  }
  historyParams.push(limit);

  const ledgerParams: any[] = [userId];
  let ledgerWhere = 'WHERE user_id = $1';
  if (filterCat) {
    ledgerParams.push(filterCat);
    ledgerWhere += ` AND category = $${ledgerParams.length}`;
  }
  ledgerParams.push(limit);

  const [levelHistoryRows, ledgerRows, honorRequestRows] = await Promise.all([
    query<any>(
      `SELECT h.*, prev_l.level_name AS previous_level_name, new_l.level_name AS new_level_name, new_l.badge_image_url
       FROM popolive.user_recognition_history h
       LEFT JOIN popolive.recognition_levels prev_l ON prev_l.level_id = h.previous_level_id
       LEFT JOIN popolive.recognition_levels new_l ON new_l.level_id = h.new_level_id
       ${historyWhere}
       ORDER BY h.created_at DESC LIMIT $${historyParams.length}`,
      historyParams
    ),
    query<any>(
      `SELECT * FROM popolive.user_recognition_ledger
       ${ledgerWhere}
       ORDER BY created_at DESC LIMIT $${ledgerParams.length}`,
      ledgerParams
    ),
    query<any>(
      `SELECT r.*, f.title AS factor_title, f.title_ur AS factor_title_ur
       FROM popolive.honor_recognition_requests r
       LEFT JOIN popolive.honor_recognition_factors f ON f.factor_key = r.factor_key
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC LIMIT 25`,
      [userId]
    ),
  ]);

  return {
    levelHistory: levelHistoryRows.map((r: any) => ({
      historyId: r.history_id,
      userId: r.user_id,
      category: r.category,
      previousLevelId: r.previous_level_id,
      previousLevelNumber: parseInt(String(r.previous_level_number ?? '1'), 10),
      previousLevelName: r.previous_level_name || `Lv.${r.previous_level_number}`,
      newLevelId: r.new_level_id,
      newLevelNumber: parseInt(String(r.new_level_number ?? '1'), 10),
      newLevelName: r.new_level_name || `Lv.${r.new_level_number}`,
      badgeImageUrl: r.badge_image_url,
      scoreAtChange: parseInt(String(r.score_at_change ?? '0'), 10),
      changeReason: r.change_reason,
      activatedAt: r.activated_at ? new Date(r.activated_at).toISOString() : '',
    })),
    activityLedger: ledgerRows.map((l: any) => ({
      ledgerId: l.ledger_id,
      category: l.category,
      eventType: l.event_type,
      scoreDelta: parseInt(String(l.score_delta ?? '0'), 10),
      balanceAfter: parseInt(String(l.balance_after ?? '0'), 10),
      sourceType: l.source_type,
      sourceTxId: l.source_tx_id,
      isPromotional: Boolean(l.is_promotional),
      isReversed: Boolean(l.is_reversed),
      status: l.status,
      reason: l.reason,
      createdAt: l.created_at ? new Date(l.created_at).toISOString() : '',
    })),
    honorRequests: honorRequestRows.map((hr: any) => ({
      requestId: hr.request_id,
      factorKey: hr.factor_key,
      factorTitle: hr.factor_title || hr.factor_key,
      factorTitleUr: hr.factor_title_ur || hr.factor_title || hr.factor_key,
      pointsRequested: parseInt(String(hr.points_requested ?? '0'), 10),
      evidenceSummary: hr.evidence_summary,
      status: hr.status,
      reviewReason: hr.review_reason || null,
      reviewedAt: hr.reviewed_at ? new Date(hr.reviewed_at).toISOString() : null,
      createdAt: hr.created_at ? new Date(hr.created_at).toISOString() : '',
    })),
  };
}

export async function acknowledgeLevelUpEvents(userId: string, eventIds?: string[]) {
  const updated = eventIds && eventIds.length > 0
    ? await query<any>(
        `UPDATE popolive.recognition_level_up_events
         SET is_acknowledged = TRUE, acknowledged_at = NOW()
         WHERE user_id = $1 AND event_id = ANY($2) AND is_acknowledged = FALSE
         RETURNING event_id`,
        [userId, eventIds]
      )
    : await query<any>(
        `UPDATE popolive.recognition_level_up_events
         SET is_acknowledged = TRUE, acknowledged_at = NOW()
         WHERE user_id = $1 AND is_acknowledged = FALSE
         RETURNING event_id`,
        [userId]
      );

  await invalidateRecognitionCaches(userId);
  return { acknowledgedCount: updated.length };
}

export async function updateUserRecognitionPreferences(
  userId: string,
  prefs: Partial<UserRecognitionPreferences>
): Promise<UserRecognitionPreferences> {
  const curr = await loadUserPreferences(userId);
  const next: UserRecognitionPreferences = {
    animationsEnabled: prefs.animationsEnabled !== undefined ? Boolean(prefs.animationsEnabled) : curr.animationsEnabled,
    soundEnabled: prefs.soundEnabled !== undefined ? Boolean(prefs.soundEnabled) : curr.soundEnabled,
    hideWealthLeaderboard: prefs.hideWealthLeaderboard !== undefined ? Boolean(prefs.hideWealthLeaderboard) : curr.hideWealthLeaderboard,
    hideShiningLeaderboard: prefs.hideShiningLeaderboard !== undefined ? Boolean(prefs.hideShiningLeaderboard) : curr.hideShiningLeaderboard,
    hideHonorLeaderboard: prefs.hideHonorLeaderboard !== undefined ? Boolean(prefs.hideHonorLeaderboard) : curr.hideHonorLeaderboard,
  };

  await query(
    `INSERT INTO popolive.user_recognition_preferences (
       user_id, animations_enabled, sound_enabled,
       hide_wealth_leaderboard, hide_shining_leaderboard, hide_honor_leaderboard, updated_at
     ) VALUES ($1,$2,$3,$4,$5,$6,NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       animations_enabled = EXCLUDED.animations_enabled,
       sound_enabled = EXCLUDED.sound_enabled,
       hide_wealth_leaderboard = EXCLUDED.hide_wealth_leaderboard,
       hide_shining_leaderboard = EXCLUDED.hide_shining_leaderboard,
       hide_honor_leaderboard = EXCLUDED.hide_honor_leaderboard,
       updated_at = NOW()`,
    [
      userId,
      next.animationsEnabled,
      next.soundEnabled,
      next.hideWealthLeaderboard,
      next.hideShiningLeaderboard,
      next.hideHonorLeaderboard,
    ]
  );

  await invalidateRecognitionCaches(userId);
  return next;
}

// =============================================================================
// Separate Leaderboards (Wealth vs Shining vs Honor, Privacy-Enforced)
// =============================================================================

export async function getRecognitionLeaderboard(params: {
  category: string;
  page?: number;
  limit?: number;
}) {
  const category = assertRecognitionCategory(params.category);
  const rules = await getRecognitionSystemRules();
  const page = Math.max(1, Math.floor(params.page || 1));
  const limit = Math.min(50, Math.max(1, Math.floor(params.limit || rules.leaderboardDefaultLimit)));
  const offset = (page - 1) * limit;

  const hideCol =
    category === 'wealth'
      ? 'hide_wealth_leaderboard'
      : category === 'shining'
      ? 'hide_shining_leaderboard'
      : 'hide_honor_leaderboard';

  // Privacy: exclude users with profile_visibility='only_me' OR explicit category hide preference; NEVER expose private coins/email/phone
  const [rows, countRows] = await Promise.all([
    query<any>(
      `SELECT
         p.user_id,
         p.category,
         p.current_score,
         p.current_level_number,
         l.level_name,
         l.level_name_ur,
         l.badge_image_url,
         l.wing_style,
         l.border_color,
         COALESCE(u.poppo_id, p.user_id) AS poppo_id,
         COALESCE(u.nickname, CASE WHEN p.user_id = 'user_wallet_demo_701' THEN 'Demo Viewer' ELSE 'Popo User' END) AS nickname,
         COALESCE(u.avatar_url, '/avatars/default.png') AS avatar_url
       FROM popolive.user_recognition_progress p
       JOIN popolive.recognition_levels l ON l.level_id = p.current_level_id
       LEFT JOIN popolive.users u ON u.id::text = p.user_id
       LEFT JOIN popolive.user_privacy_settings ups ON ups.user_id::text = p.user_id
       LEFT JOIN popolive.user_recognition_preferences rp ON rp.user_id = p.user_id
       WHERE p.category = $1
         AND COALESCE(ups.profile_visibility, 'everyone') <> 'only_me'
         AND COALESCE(rp.${hideCol}, FALSE) = FALSE
         AND COALESCE(u.status, 'active') = 'active'
       ORDER BY p.current_score DESC, p.current_level_number DESC, p.updated_at ASC
       LIMIT $2 OFFSET $3`,
      [category, limit, offset]
    ),
    query<any>(
      `SELECT COUNT(*)::int AS total
       FROM popolive.user_recognition_progress p
       LEFT JOIN popolive.users u ON u.id::text = p.user_id
       LEFT JOIN popolive.user_privacy_settings ups ON ups.user_id::text = p.user_id
       LEFT JOIN popolive.user_recognition_preferences rp ON rp.user_id = p.user_id
       WHERE p.category = $1
         AND COALESCE(ups.profile_visibility, 'everyone') <> 'only_me'
         AND COALESCE(rp.${hideCol}, FALSE) = FALSE
         AND COALESCE(u.status, 'active') = 'active'`,
      [category]
    ),
  ]);

  const total = parseInt(String(countRows[0]?.total ?? '0'), 10);

  return {
    category,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    entries: rows.map((r: any, idx: number) => ({
      rank: offset + idx + 1,
      userId: String(r.user_id),
      poppoId: String(r.poppo_id),
      nickname: String(r.nickname),
      avatarUrl: String(r.avatar_url),
      category,
      score: parseInt(String(r.current_score ?? '0'), 10),
      levelNumber: parseInt(String(r.current_level_number ?? '1'), 10),
      levelName: String(r.level_name),
      levelNameUr: String(r.level_name_ur || r.level_name),
      badgeImageUrl: String(r.badge_image_url),
      wingStyle: String(r.wing_style),
      borderColor: String(r.border_color),
    })),
  };
}

// =============================================================================
// Honor Recognition Workflows (Strict Admin Verification, Never Unverified Self-Grant)
// =============================================================================

export async function submitHonorRecognitionRequest(params: {
  userId: string;
  factorKey: string;
  evidenceSummary: string;
  submittedBy: string;
}) {
  const cleanEvidence = String(params.evidenceSummary || '').trim();
  if (cleanEvidence.length < 8) {
    throw Object.assign(new Error('Please provide verified recognition details (at least 8 characters).'), {
      code: 'EVIDENCE_REQUIRED',
      status: 400,
    });
  }

  const factorRows = await query<any>(
    `SELECT * FROM popolive.honor_recognition_factors WHERE factor_key = $1 AND is_active = TRUE`,
    [params.factorKey]
  );
  if (factorRows.length === 0) {
    throw Object.assign(new Error('Selected Honor recognition factor is not active or does not exist.'), {
      code: 'HONOR_FACTOR_NOT_FOUND',
      status: 404,
    });
  }
  const factor = mapFactorRow(factorRows[0]);
  const requestId = generateRecId('HON_REQ');

  const inserted = (
    await query<any>(
      `INSERT INTO popolive.honor_recognition_requests (
         request_id, user_id, factor_key, points_requested, evidence_summary, status, submitted_by
       ) VALUES ($1, $2, $3, $4, $5, 'pending', $6)
       RETURNING *`,
      [requestId, params.userId, factor.factorKey, factor.defaultPoints, cleanEvidence, params.submittedBy]
    )
  )[0];

  return {
    requestId: inserted.request_id,
    userId: inserted.user_id,
    factorKey: inserted.factor_key,
    factorTitle: factor.title,
    pointsRequested: factor.defaultPoints,
    evidenceSummary: inserted.evidence_summary,
    status: inserted.status,
    createdAt: new Date(inserted.created_at).toISOString(),
  };
}

export async function adminReviewHonorRequest(params: {
  requestId: string;
  decision: 'approved' | 'rejected';
  actorId: string;
  actorRole: string;
  reason: string;
  overridePoints?: number;
  ipAddress?: string | null;
}) {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw Object.assign(new Error('Forbidden: Only authorized administrators can review Honor recognition requests.'), {
      code: 'RECOGNITION_ADMIN_REQUIRED',
      status: 403,
    });
  }
  const cleanReason = String(params.reason || '').trim();
  if (cleanReason.length < 5) {
    throw Object.assign(new Error('Review reason (minimum 5 characters) is mandatory.'), {
      code: 'REASON_REQUIRED',
      status: 400,
    });
  }

  const out = await withTransaction(async (client) => {
    const reqRows = (
      await client.query(`SELECT * FROM popolive.honor_recognition_requests WHERE request_id = $1 FOR UPDATE`, [
        params.requestId,
      ])
    ).rows;
    if (reqRows.length === 0) {
      throw Object.assign(new Error('Honor recognition request not found.'), {
        code: 'HONOR_REQUEST_NOT_FOUND',
        status: 404,
      });
    }
    const reqRow = reqRows[0];
    if (reqRow.status !== 'pending') {
      throw Object.assign(new Error(`Honor request has already been ${reqRow.status}.`), {
        code: 'HONOR_REQUEST_ALREADY_REVIEWED',
        status: 400,
      });
    }

    let ledgerId: string | null = null;
    let progressResult: any = null;
    const finalPoints =
      typeof params.overridePoints === 'number' && params.overridePoints > 0
        ? Math.floor(params.overridePoints)
        : parseInt(String(reqRow.points_requested), 10);

    if (params.decision === 'approved') {
      progressResult = await applyRecognitionDeltaInTx(client, {
        userId: reqRow.user_id,
        category: 'honor',
        eventType: `honor_approved:${reqRow.factor_key}`,
        scoreDelta: finalPoints,
        sourceType: 'honor_recognition_request',
        sourceTxId: reqRow.request_id,
        idempotencyKey: `honor_req:${reqRow.request_id}`,
        reason: `${cleanReason} (Factor: ${reqRow.factor_key})`,
        createdBy: params.actorId,
        metadata: { requestId: reqRow.request_id, factorKey: reqRow.factor_key, approvedPoints: finalPoints },
      });
      ledgerId = progressResult.ledgerId;
    }

    const updatedReq = (
      await client.query(
        `UPDATE popolive.honor_recognition_requests
         SET status = $1::text,
             reviewed_by = $2,
             review_reason = $3,
             reviewed_at = NOW(),
             ledger_id = $4,
             updated_at = NOW()
         WHERE request_id = $5
         RETURNING *`,
        [params.decision, params.actorId, cleanReason, ledgerId, params.requestId]
      )
    ).rows[0];

    await client.query(
      `INSERT INTO popolive.recognition_admin_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, before_data, after_data, ip_address
       ) VALUES ($1, 'honor_request', $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)`,
      [
        generateRecId('RECAUD'),
        params.requestId,
        `honor_request_${params.decision}`,
        params.actorId,
        params.actorRole,
        cleanReason,
        JSON.stringify({ status: reqRow.status, pointsRequested: reqRow.points_requested }),
        JSON.stringify({ status: updatedReq.status, approvedPoints: params.decision === 'approved' ? finalPoints : 0, ledgerId }),
        params.ipAddress || null,
      ]
    );

    return {
      userId: String(reqRow.user_id),
      request: updatedReq,
      progress: progressResult,
    };
  });

  await invalidateRecognitionCaches(out.userId);
  return out;
}

export async function adminDirectAwardHonor(params: {
  targetUserId: string;
  factorKey: string;
  points: number;
  reason: string;
  idempotencyKey?: string;
  actorId: string;
  actorRole: string;
  ipAddress?: string | null;
}) {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw Object.assign(new Error('Forbidden: Only authorized administrators can grant official Honor points.'), {
      code: 'RECOGNITION_ADMIN_REQUIRED',
      status: 403,
    });
  }
  const cleanReason = String(params.reason || '').trim();
  if (cleanReason.length < 5) {
    throw Object.assign(new Error('Audit reason (minimum 5 characters) is mandatory.'), {
      code: 'REASON_REQUIRED',
      status: 400,
    });
  }
  const pts = Math.floor(params.points || 0);
  if (!Number.isFinite(pts) || pts <= 0 || pts > 100000) {
    throw Object.assign(new Error('Honor award points must be between 1 and 100,000.'), {
      code: 'INVALID_HONOR_POINTS',
      status: 400,
    });
  }

  const out = await withTransaction(async (client) => {
    const fRows = (
      await client.query(`SELECT factor_key FROM popolive.honor_recognition_factors WHERE factor_key = $1`, [
        params.factorKey,
      ])
    ).rows;
    if (fRows.length === 0) {
      throw Object.assign(new Error(`Invalid Honor recognition factor '${params.factorKey}'.`), {
        code: 'HONOR_FACTOR_NOT_FOUND',
        status: 404,
      });
    }

    const idemKey = params.idempotencyKey?.trim() || generateRecId('HON_AWD_IDEM');
    const sourceTx = generateRecId('HON_AWD');
    const prog = await applyRecognitionDeltaInTx(client, {
      userId: params.targetUserId,
      category: 'honor',
      eventType: `official_award:${params.factorKey}`,
      scoreDelta: pts,
      sourceType: 'admin_official_honor',
      sourceTxId: sourceTx,
      idempotencyKey: idemKey,
      reason: `${cleanReason} (Factor: ${params.factorKey})`,
      createdBy: params.actorId,
      metadata: { factorKey: params.factorKey, actorId: params.actorId },
    });

    await client.query(
      `INSERT INTO popolive.recognition_admin_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, after_data, ip_address
       ) VALUES ($1, 'user_honor', $2, 'direct_honor_award', $3, $4, $5, $6::jsonb, $7)`,
      [
        generateRecId('RECAUD'),
        params.targetUserId,
        params.actorId,
        params.actorRole,
        cleanReason,
        JSON.stringify({ factorKey: params.factorKey, points: pts, newScore: prog.newScore, newLevel: prog.newLevelNumber }),
        params.ipAddress || null,
      ]
    );

    return prog;
  });

  await invalidateRecognitionCaches(params.targetUserId);
  return out;
}

// =============================================================================
// Admin Level Configuration, Rules & Analytics
// =============================================================================

export async function adminUpsertRecognitionLevel(params: {
  levelId: string;
  category: string;
  levelNumber: number;
  levelName: string;
  levelNameUr?: string;
  requiredThreshold: number;
  badgeImageUrl?: string;
  iconKey?: string;
  wingStyle?: string;
  borderColor?: string;
  description?: string;
  descriptionUr?: string;
  benefitKeys?: string[];
  displayOrder?: number;
  isActive?: boolean;
  actorId: string;
  actorRole: string;
  reason?: string;
  ipAddress?: string | null;
}) {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw Object.assign(new Error('Forbidden: Only authorized administrators can modify level configurations.'), {
      code: 'RECOGNITION_ADMIN_REQUIRED',
      status: 403,
    });
  }

  const category = assertRecognitionCategory(params.category);
  const cleanId = String(params.levelId || '').trim();
  const lvlNum = Math.floor(params.levelNumber);
  const threshold = Math.floor(params.requiredThreshold);

  if (!cleanId || !/^[a-z0-9_]+$/i.test(cleanId)) {
    throw Object.assign(new Error('Level ID must be alphanumeric/underscore.'), {
      code: 'INVALID_LEVEL_ID',
      status: 400,
    });
  }
  if (!Number.isInteger(lvlNum) || lvlNum < 1 || lvlNum > 200) {
    throw Object.assign(new Error('Level number must be an integer between 1 and 200.'), {
      code: 'INVALID_LEVEL_NUMBER',
      status: 400,
    });
  }
  if (!Number.isFinite(threshold) || threshold < 0) {
    throw Object.assign(new Error('Required threshold must be >= 0.'), {
      code: 'INVALID_THRESHOLD',
      status: 400,
    });
  }

  const levelName = String(params.levelName || '').trim();
  if (!levelName) {
    throw Object.assign(new Error('Level name is required.'), { code: 'LEVEL_NAME_REQUIRED', status: 400 });
  }

  const tier = await withTransaction(async (client) => {
    const existingRows = (
      await client.query(`SELECT * FROM popolive.recognition_levels WHERE level_id = $1 FOR UPDATE`, [cleanId])
    ).rows;
    const before = existingRows[0] || null;

    // Ensure any assigned benefit keys exist and are non-financial
    const cleanBenefits = Array.isArray(params.benefitKeys)
      ? params.benefitKeys.map((k) => String(k).trim()).filter(Boolean)
      : before
      ? parseJsonArray(before.benefit_keys)
      : ['rec_special_profile_badge'];

    if (cleanBenefits.length > 0) {
      const validRows = (
        await client.query(
          `SELECT benefit_key FROM popolive.recognition_benefits
           WHERE benefit_key = ANY($1) AND is_financial_reward = FALSE`,
          [cleanBenefits]
        )
      ).rows;
      if (validRows.length !== cleanBenefits.length) {
        throw Object.assign(
          new Error('One or more assigned benefits are invalid or disallowed.'),
          { code: 'INVALID_BENEFIT_KEYS', status: 400 }
        );
      }
    }

    const row = (
      await client.query(
        `INSERT INTO popolive.recognition_levels (
           level_id, category, level_number, level_name, level_name_ur, required_threshold,
           badge_image_url, icon_key, wing_style, border_color, description, description_ur,
           benefit_keys, display_order, is_active, created_by, updated_by, created_at, updated_at
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14,$15,$16,$16,NOW(),NOW())
         ON CONFLICT (level_id) DO UPDATE SET
           level_number = EXCLUDED.level_number,
           level_name = EXCLUDED.level_name,
           level_name_ur = EXCLUDED.level_name_ur,
           required_threshold = EXCLUDED.required_threshold,
           badge_image_url = EXCLUDED.badge_image_url,
           icon_key = EXCLUDED.icon_key,
           wing_style = EXCLUDED.wing_style,
           border_color = EXCLUDED.border_color,
           description = EXCLUDED.description,
           description_ur = EXCLUDED.description_ur,
           benefit_keys = EXCLUDED.benefit_keys,
           display_order = EXCLUDED.display_order,
           is_active = EXCLUDED.is_active,
           updated_by = EXCLUDED.updated_by,
           updated_at = NOW()
         RETURNING *`,
        [
          cleanId,
          category,
          lvlNum,
          levelName,
          String(params.levelNameUr || before?.level_name_ur || levelName),
          threshold,
          String(params.badgeImageUrl || before?.badge_image_url || '/assets/gifts/07_08_wealth_shining_and_honor.png'),
          String(params.iconKey || before?.icon_key || 'wings_gold'),
          String(params.wingStyle || before?.wing_style || 'cosmic_bronze'),
          String(params.borderColor || before?.border_color || '#EC248F'),
          String(params.description ?? before?.description ?? ''),
          String(params.descriptionUr ?? before?.description_ur ?? params.description ?? ''),
          JSON.stringify(cleanBenefits),
          params.displayOrder !== undefined ? Math.floor(params.displayOrder) : before?.display_order ?? lvlNum,
          params.isActive !== undefined ? Boolean(params.isActive) : before ? Boolean(before.is_active) : true,
          params.actorId,
        ]
      )
    ).rows[0];

    await client.query(
      `INSERT INTO popolive.recognition_admin_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, before_data, after_data, ip_address
       ) VALUES ($1, 'recognition_level', $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9)`,
      [
        generateRecId('RECAUD'),
        cleanId,
        before ? 'update_recognition_level' : 'create_recognition_level',
        params.actorId,
        params.actorRole,
        params.reason?.trim() || `Configured ${category} level ${levelName} (Lv.${lvlNum} @ ${threshold})`,
        before ? JSON.stringify(before) : null,
        JSON.stringify(row),
        params.ipAddress || null,
      ]
    );

    return mapLevelRow(row);
  });

  await invalidateRecognitionCaches();
  return tier;
}

export async function adminUpdateRecognitionRules(params: {
  allowPromoCoinsForWealth?: boolean;
  wealthScorePerCoin?: number;
  shiningScorePerCoin?: number;
  autoAdjustOnReversal?: boolean;
  fraudDailySpikeThreshold?: number;
  actorId: string;
  actorRole: string;
  reason?: string;
  ipAddress?: string | null;
}) {
  if (!isAuthorizedFinanceAdmin(params.actorRole)) {
    throw Object.assign(new Error('Forbidden: Only finance administrators can change recognition finance rules.'), {
      code: 'FINANCE_ADMIN_REQUIRED',
      status: 403,
    });
  }

  const updates: Array<[string, string]> = [];
  if (params.allowPromoCoinsForWealth !== undefined) {
    updates.push(['allow_promo_coins_for_wealth', params.allowPromoCoinsForWealth ? 'true' : 'false']);
  }
  if (params.wealthScorePerCoin !== undefined && Number(params.wealthScorePerCoin) > 0) {
    updates.push(['wealth_score_per_coin', String(Number(params.wealthScorePerCoin))]);
  }
  if (params.shiningScorePerCoin !== undefined && Number(params.shiningScorePerCoin) > 0) {
    updates.push(['shining_score_per_coin', String(Number(params.shiningScorePerCoin))]);
  }
  if (params.autoAdjustOnReversal !== undefined) {
    updates.push(['auto_adjust_on_reversal', params.autoAdjustOnReversal ? 'true' : 'false']);
  }
  if (params.fraudDailySpikeThreshold !== undefined && Number(params.fraudDailySpikeThreshold) >= 1000) {
    updates.push(['fraud_daily_spike_threshold', String(Math.floor(Number(params.fraudDailySpikeThreshold)))]);
  }

  const before = await getRecognitionSystemRules();
  await withTransaction(async (client) => {
    for (const [k, v] of updates) {
      await client.query(
        `UPDATE popolive.recognition_system_rules
         SET rule_value = $1, updated_by = $2, updated_at = NOW()
         WHERE rule_key = $3`,
        [v, params.actorId, k]
      );
    }

    await client.query(
      `INSERT INTO popolive.recognition_admin_audit_logs (
         audit_id, target_type, target_id, action_type, actor_id, actor_role, reason, before_data, after_data, ip_address
       ) VALUES ($1, 'recognition_rules', 'global', 'update_recognition_rules', $2, $3, $4, $5::jsonb, $6::jsonb, $7)`,
      [
        generateRecId('RECAUD'),
        params.actorId,
        params.actorRole,
        params.reason?.trim() || 'Updated recognition financial/scoring rules',
        JSON.stringify(before),
        JSON.stringify(Object.fromEntries(updates)),
        params.ipAddress || null,
      ]
    );
  });

  await invalidateRecognitionCaches();
  return getRecognitionSystemRules();
}

export async function adminGetRecognitionOverview(search: string = '') {
  const [catalog, pendingHonor, recentHistory, suspiciousLogs, auditLogs, statsRows] = await Promise.all([
    getRecognitionCatalog({ includeInactive: true }),
    query<any>(
      `SELECT r.*, f.title AS factor_title, COALESCE(u.nickname, r.user_id) AS nickname
       FROM popolive.honor_recognition_requests r
       LEFT JOIN popolive.honor_recognition_factors f ON f.factor_key = r.factor_key
       LEFT JOIN popolive.users u ON u.id::text = r.user_id
       ORDER BY CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END, r.created_at DESC
       LIMIT 50`
    ),
    query<any>(
      `SELECT h.*, prev_l.level_name AS previous_level_name, new_l.level_name AS new_level_name,
              COALESCE(u.nickname, h.user_id) AS nickname
       FROM popolive.user_recognition_history h
       LEFT JOIN popolive.recognition_levels prev_l ON prev_l.level_id = h.previous_level_id
       LEFT JOIN popolive.recognition_levels new_l ON new_l.level_id = h.new_level_id
       LEFT JOIN popolive.users u ON u.id::text = h.user_id
       WHERE ($1 = '' OR h.user_id ILIKE $2 OR COALESCE(u.nickname, '') ILIKE $2)
       ORDER BY h.created_at DESC
       LIMIT 40`,
      [search.trim(), `%${search.trim()}%`]
    ),
    query<any>(
      `SELECT * FROM popolive.recognition_admin_audit_logs
       WHERE action_type = 'suspicious_activity_flagged'
       ORDER BY created_at DESC LIMIT 25`
    ),
    query<any>(
      `SELECT * FROM popolive.recognition_admin_audit_logs
       ORDER BY created_at DESC LIMIT 40`
    ),
    query<any>(
      `SELECT category,
              COUNT(*)::int AS total_users,
              MAX(current_level_number)::int AS top_level,
              COALESCE(SUM(current_score), 0)::bigint AS total_score,
              COUNT(*) FILTER (WHERE current_level_number >= 2)::int AS leveled_users
       FROM popolive.user_recognition_progress
       GROUP BY category`
    ),
  ]);

  const stats: Record<string, any> = {};
  for (const s of statsRows) {
    stats[String(s.category)] = {
      totalUsers: parseInt(String(s.total_users ?? '0'), 10),
      topLevel: parseInt(String(s.top_level ?? '1'), 10),
      totalScore: parseInt(String(s.total_score ?? '0'), 10),
      leveledUsers: parseInt(String(s.leveled_users ?? '0'), 10),
    };
  }

  return {
    catalog,
    stats,
    honorRequests: pendingHonor.map((r: any) => ({
      requestId: r.request_id,
      userId: r.user_id,
      nickname: r.nickname,
      factorKey: r.factor_key,
      factorTitle: r.factor_title || r.factor_key,
      pointsRequested: parseInt(String(r.points_requested ?? '0'), 10),
      evidenceSummary: r.evidence_summary,
      status: r.status,
      submittedBy: r.submitted_by,
      reviewedBy: r.reviewed_by,
      reviewReason: r.review_reason,
      createdAt: r.created_at ? new Date(r.created_at).toISOString() : '',
    })),
    recentTransitions: recentHistory.map((h: any) => ({
      historyId: h.history_id,
      userId: h.user_id,
      nickname: h.nickname,
      category: h.category,
      previousLevelNumber: parseInt(String(h.previous_level_number ?? '1'), 10),
      previousLevelName: h.previous_level_name || `Lv.${h.previous_level_number}`,
      newLevelNumber: parseInt(String(h.new_level_number ?? '1'), 10),
      newLevelName: h.new_level_name || `Lv.${h.new_level_number}`,
      scoreAtChange: parseInt(String(h.score_at_change ?? '0'), 10),
      changeReason: h.change_reason,
      activatedAt: h.activated_at ? new Date(h.activated_at).toISOString() : '',
    })),
    suspiciousAlerts: suspiciousLogs,
    auditLogs,
  };
}
