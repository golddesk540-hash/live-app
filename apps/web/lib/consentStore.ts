import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export const CURRENT_TERMS_VERSION = 'v4.2.0';
export const CURRENT_PRIVACY_VERSION = 'v4.2.0';

export interface ConsentRecord {
  consentId: string;
  anonymousSessionId: string;
  userId?: string | null;
  termsVersion: string;
  privacyVersion: string;
  status: 'accepted' | 'declined';
  acceptedAt: string; // ISO 8601
  isAdultConfirmed: boolean;
  language: 'en' | 'ur';
  ipHash: string; // Salted SHA-256 hash of IP for privacy compliance
  userAgent: string;
}

export interface ConsentTokenPayload {
  consentId: string;
  anonymousSessionId: string;
  termsVersion: string;
  privacyVersion: string;
  status: 'accepted' | 'declined';
  timestamp: number;
}

const SECRET_KEY = process.env.CONSENT_SECRET_KEY || 'poppo-live-secure-consent-salt-2026-v4';
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'consents.json');

// Ensure data directory exists
function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Read all consent records
export function getAllConsents(): ConsentRecord[] {
  try {
    ensureDataFile();
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data) as ConsentRecord[];
  } catch (error) {
    console.error('Error reading consents file:', error);
    return [];
  }
}

// Find consent by anonymousSessionId
export function getConsentBySessionId(sessionId: string): ConsentRecord | null {
  const consents = getAllConsents();
  // Return the most recent consent record for this session
  const records = consents.filter((c) => c.anonymousSessionId === sessionId);
  if (records.length === 0) return null;
  return records[records.length - 1];
}

// Save a new consent record
export function saveConsentRecord(record: Omit<ConsentRecord, 'consentId'>): ConsentRecord {
  ensureDataFile();
  const consents = getAllConsents();
  const consentId = `cs_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  
  const fullRecord: ConsentRecord = {
    consentId,
    ...record,
  };

  consents.push(fullRecord);

  // Keep last 10,000 records for performance & storage limits
  const trimmed = consents.slice(-10000);
  fs.writeFileSync(DATA_FILE, JSON.stringify(trimmed, null, 2), 'utf-8');

  return fullRecord;
}

// Anonymize IP address (GDPR/privacy compliant one-way hash with salt)
export function hashIp(ip: string): string {
  if (!ip) return 'unknown';
  return crypto.createHmac('sha256', SECRET_KEY).update(ip).digest('hex').substring(0, 16);
}

// Create a cryptographically signed cookie token
export function createConsentToken(payload: ConsentTokenPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('base64url');
  return `${data}.${signature}`;
}

// Verify a signed cookie token
export function verifyConsentToken(token: string): { valid: boolean; payload: ConsentTokenPayload | null } {
  if (!token || typeof token !== 'string') {
    return { valid: false, payload: null };
  }

  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false, payload: null };
  }

  const [data, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(data).digest('base64url');

  if (signature !== expectedSignature) {
    return { valid: false, payload: null };
  }

  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as ConsentTokenPayload;
    return { valid: true, payload };
  } catch {
    return { valid: false, payload: null };
  }
}

// Check if a consent token meets current version requirements
export function isConsentCurrent(payload: ConsentTokenPayload | null): boolean {
  if (!payload) return false;
  return (
    payload.status === 'accepted' &&
    payload.termsVersion === CURRENT_TERMS_VERSION &&
    payload.privacyVersion === CURRENT_PRIVACY_VERSION
  );
}
