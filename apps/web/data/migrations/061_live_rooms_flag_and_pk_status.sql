-- Migration 061: Add flag_emoji and in_pk_battle columns to live_rooms if not exists
SET search_path TO popolive, public;

ALTER TABLE popolive.live_rooms ADD COLUMN IF NOT EXISTS flag_emoji VARCHAR(16) DEFAULT '🇵🇰';
ALTER TABLE popolive.live_rooms ADD COLUMN IF NOT EXISTS in_pk_battle BOOLEAN DEFAULT false;

UPDATE popolive.live_rooms SET flag_emoji = '🇵🇰' WHERE flag_emoji IS NULL;
UPDATE popolive.live_rooms SET in_pk_battle = false WHERE in_pk_battle IS NULL;

ALTER TABLE popolive.party_rooms ADD COLUMN IF NOT EXISTS flag_emoji VARCHAR(16) DEFAULT '🎉';
UPDATE popolive.party_rooms SET flag_emoji = '🎉' WHERE flag_emoji IS NULL;
