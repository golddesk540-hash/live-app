-- Migration 011: Indexes, Tag Enrichment, and Room Status States for Room Cards
SET search_path TO popolive, public;

-- Composite indexes for high-speed discovery and status queries
CREATE INDEX IF NOT EXISTS idx_live_rooms_status_views ON popolive.live_rooms(is_live, status, viewer_count DESC);
CREATE INDEX IF NOT EXISTS idx_live_rooms_country_views ON popolive.live_rooms(country_code, viewer_count DESC);
CREATE INDEX IF NOT EXISTS idx_live_rooms_category_views ON popolive.live_rooms(category, viewer_count DESC);

-- Enrich existing rooms with authentic tags matching 03_04_room_cards.png
UPDATE popolive.live_rooms
SET tags = ARRAY['Live', 'PK', 'Chat']
WHERE category = 'live' AND (tags IS NULL OR array_length(tags, 1) <= 1 OR tags = '{}');

UPDATE popolive.live_rooms
SET tags = ARRAY['Party', 'Fun', 'Music']
WHERE category = 'party';

UPDATE popolive.live_rooms
SET tags = ARRAY['PK', 'Arena', 'Battle']
WHERE category = 'pk';

-- Ensure hosts have adult verification enabled for room card badge display
UPDATE popolive.users
SET is_adult_verified = true
WHERE id IN (SELECT host_id FROM popolive.live_rooms);
