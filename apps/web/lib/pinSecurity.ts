import bcrypt from 'bcryptjs';
import { query } from './db';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export function validatePinFormat(pin: string): { valid: boolean; error?: string } {
  if (!pin || typeof pin !== 'string') {
    return { valid: false, error: 'Security PIN must be provided.' };
  }
  const trimmed = pin.trim();
  if (!/^\d{4,6}$/.test(trimmed)) {
    return { valid: false, error: 'Security PIN must be between 4 and 6 numeric digits.' };
  }
  return { valid: true };
}

export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin.trim(), salt);
}

export async function verifyPinAttempt(
  userId: string,
  enteredPin: string
): Promise<{ success: boolean; error?: string; remainingAttempts?: number }> {
  const rows = await query(
    `SELECT pin_hash, is_pin_enabled, pin_failed_attempts, pin_locked_until 
     FROM popolive.users WHERE id = $1`,
    [userId]
  );

  if (rows.length === 0) {
    return { success: false, error: 'User not found.' };
  }

  const user = rows[0];

  if (!user.is_pin_enabled || !user.pin_hash) {
    return { success: false, error: 'Security PIN is not enabled on this account.' };
  }

  // Check lockout
  const now = new Date();
  if (user.pin_locked_until && new Date(user.pin_locked_until) > now) {
    const unlockTime = new Date(user.pin_locked_until).toLocaleTimeString();
    return {
      success: false,
      error: `Too many failed PIN attempts. Account security is temporarily locked until ${unlockTime}.`,
    };
  }

  const match = await bcrypt.compare(enteredPin.trim(), user.pin_hash);

  if (!match) {
    const currentAttempts = (user.pin_failed_attempts || 0) + 1;
    let lockUntil: Date | null = null;

    if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
      lockUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
      await query(
        `UPDATE popolive.users 
         SET pin_failed_attempts = $1, pin_locked_until = $2 
         WHERE id = $3`,
        [currentAttempts, lockUntil, userId]
      );
      return {
        success: false,
        error: `Incorrect PIN. Maximum 5 attempts exceeded. Locked for ${LOCKOUT_MINUTES} minutes.`,
        remainingAttempts: 0,
      };
    } else {
      await query(
        `UPDATE popolive.users 
         SET pin_failed_attempts = $1 
         WHERE id = $2`,
        [currentAttempts, userId]
      );
      const remaining = MAX_FAILED_ATTEMPTS - currentAttempts;
      return {
        success: false,
        error: `Incorrect Security PIN. ${remaining} attempt(s) remaining before temporary lockout.`,
        remainingAttempts: remaining,
      };
    }
  }

  // Reset failed attempts on success
  await query(
    `UPDATE popolive.users 
     SET pin_failed_attempts = 0, pin_locked_until = NULL 
     WHERE id = $1`,
    [userId]
  );

  return { success: true };
}
