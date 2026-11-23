import { query } from '@/lib/db';
import { AuthUser, calculateAge } from '@/lib/auth';

/**
 * POPO LIVE — PHASE 7 (P7-P6)
 * MESSAGE MODULE API SERVICE & LOCKED RULES ENGINE
 */

export const USE_MESSAGE_API: boolean = process.env.NEXT_PUBLIC_USE_MESSAGE_API === 'true';

/**
 * Enforces Age 18+ Locked Rule for Messaging
 */
export function assertAdultMessage(user: AuthUser, actionName: string = 'use direct messaging') {
  if (user.is_adult_verified) return;
  const age = calculateAge(user.birthdate || '');
  if (age < 18) {
    const error: any = new Error(
      `AGE_VERIFICATION_FAILED: You must be at least 18 years old to ${actionName}. Current age: ${age}`
    );
    error.code = 'AGE_VERIFICATION_FAILED';
    error.status = 403;
    throw error;
  }
}

/**
 * Enforces Conversation Membership (Rule 2)
 * A user can only read or write in conversations they belong to.
 */
export async function assertConversationMember(conversationId: string, userId: string) {
  const rows = await query<any>(
    `SELECT * FROM popolive.inbox_conversations
     WHERE id::text = $1 AND (participant_one_id::text = $2 OR participant_two_id::text = $2)
     LIMIT 1`,
    [conversationId, userId]
  );

  if (rows.length === 0) {
    const error: any = new Error(
      'NOT_CONVERSATION_MEMBER: You do not have permission to access or post to this conversation.'
    );
    error.code = 'NOT_CONVERSATION_MEMBER';
    error.status = 403;
    throw error;
  }

  const conversation = rows[0];
  const isParticipantOne = conversation.participant_one_id.toString() === userId.toString();
  const recipientId = isParticipantOne
    ? conversation.participant_two_id.toString()
    : conversation.participant_one_id.toString();

  return { conversation, recipientId, isParticipantOne };
}

/**
 * Enforces Block Rules (Rule 4)
 * Returns true if recipient has blocked sender.
 */
export async function checkIsBlocked(senderId: string, recipientId: string): Promise<boolean> {
  const rows = await query<any>(
    `SELECT 1 FROM popolive.user_blocks
     WHERE blocker_id::text = $1 AND blocked_id::text = $2
     LIMIT 1`,
    [recipientId, senderId]
  );
  return rows.length > 0;
}

/**
 * Validates Message Text Length & Content (Rule 5)
 */
export function validateMessageContent(rawText: any): string {
  if (typeof rawText !== 'string') {
    const err: any = new Error('Message text must be a string.');
    err.code = 'INVALID_MESSAGE_TYPE';
    err.status = 400;
    throw err;
  }

  const trimmed = rawText.trim();
  if (trimmed.length === 0) {
    const err: any = new Error('EMPTY_MESSAGE: Message content cannot be empty.');
    err.code = 'EMPTY_MESSAGE';
    err.status = 400;
    throw err;
  }

  if (trimmed.length > 1000) {
    const err: any = new Error(
      `MESSAGE_TOO_LONG: Message exceeds 1000 characters limit. Length: ${trimmed.length}.`
    );
    err.code = 'MESSAGE_TOO_LONG';
    err.status = 400;
    throw err;
  }

  return trimmed;
}
