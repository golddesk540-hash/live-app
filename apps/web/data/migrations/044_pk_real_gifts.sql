-- ============================================================================
-- Migration 044: PK Battle Hand-off to Real Gifts
-- Module 6.10: Real Gift Catalog, Wallet Integration, PK Score Sync, Animations
-- ============================================================================

SET search_path TO popolive, public;

-- 1. Real Gift Catalog Table
CREATE TABLE IF NOT EXISTS popolive.pk_gift_catalog (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_ur VARCHAR(100) NOT NULL,
  coin_price INT NOT NULL,
  currency_icon VARCHAR(50) NOT NULL DEFAULT 'coin', -- 'heart', 'coin', 'diamond'
  image_url TEXT NOT NULL,
  animation_name VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'popular',
  display_order INT NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Exact 6 Gifts from Reference Picture 06_10_hand_off_to_real_gifts.png
INSERT INTO popolive.pk_gift_catalog (id, name, name_ur, coin_price, currency_icon, image_url, animation_name, category, display_order)
VALUES
  (
    'rose',
    'Rose',
    'گلاب',
    1,
    'heart',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&auto=format&fit=crop&q=80',
    'rose_bloom',
    'popular',
    1
  ),
  (
    'heart',
    'Heart',
    'دل',
    10,
    'heart',
    'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=300&auto=format&fit=crop&q=80',
    'heart_burst',
    'romantic',
    2
  ),
  (
    'crown',
    'Crown',
    'تاج',
    50,
    'coin',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=300&auto=format&fit=crop&q=80',
    'crown_shine',
    'luxury',
    3
  ),
  (
    'car',
    'Sports Car',
    'اسپورٹس کار',
    200,
    'coin',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=300&auto=format&fit=crop&q=80',
    'car_drive',
    'luxury',
    4
  ),
  (
    'castle',
    'Magic Castle',
    'جادوئی محل',
    500,
    'coin',
    'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=300&auto=format&fit=crop&q=80',
    'castle_fireworks',
    'special',
    5
  ),
  (
    'rocket',
    'Space Rocket',
    'خلائی راکٹ',
    1000,
    'diamond',
    'https://images.unsplash.com/photo-1517976487507-5b3b4b45a9d7?w=300&auto=format&fit=crop&q=80',
    'rocket_launch',
    'legendary',
    6
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  name_ur = EXCLUDED.name_ur,
  coin_price = EXCLUDED.coin_price,
  currency_icon = EXCLUDED.currency_icon,
  image_url = EXCLUDED.image_url,
  animation_name = EXCLUDED.animation_name,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order;

-- 2. User Wallets Table (Connecting to Popo Live Wallet Economy)
CREATE TABLE IF NOT EXISTS popolive.user_wallets (
  user_id VARCHAR(100) PRIMARY KEY,
  coins INT NOT NULL DEFAULT 3600, -- 3,600 coins matching 06_10 reference picture
  diamond_points INT NOT NULL DEFAULT 0, -- Host earning points
  total_spent_coins BIGINT NOT NULL DEFAULT 0,
  total_received_points BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Wallet for Demo Viewer (3,600 coins matching 06_10) and Demo Hosts
INSERT INTO popolive.user_wallets (user_id, coins, diamond_points)
VALUES
  ('user_viewer_9001', 3600, 0),
  ('00000000-0000-0000-0000-000000088201', 5000, 87010),
  ('00000000-0000-0000-0000-000000088202', 4500, 69090)
ON CONFLICT (user_id) DO UPDATE SET
  coins = EXCLUDED.coins,
  updated_at = NOW();

-- 3. PK Real Gift Transactions Ledger
CREATE TABLE IF NOT EXISTS popolive.pk_gift_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  battle_id UUID NOT NULL REFERENCES popolive.pk_battles(id) ON DELETE CASCADE,
  sender_id VARCHAR(100) NOT NULL,
  sender_name VARCHAR(100) NOT NULL DEFAULT 'Viewer',
  receiver_id VARCHAR(100) NOT NULL,
  receiver_name VARCHAR(100) NOT NULL DEFAULT 'Host',
  receiver_side VARCHAR(20) NOT NULL CHECK (receiver_side IN ('host_a', 'host_b')),
  gift_id VARCHAR(50) NOT NULL REFERENCES popolive.pk_gift_catalog(id),
  gift_name VARCHAR(100) NOT NULL,
  coin_price INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_coins INT NOT NULL,
  host_points INT NOT NULL, -- 70% rule
  pk_score_added INT NOT NULL, -- 1 Coin = 1 PK Point
  status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  idempotency_key VARCHAR(100) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pk_gift_tx_battle 
  ON popolive.pk_gift_transactions (battle_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pk_gift_tx_sender 
  ON popolive.pk_gift_transactions (sender_id, created_at DESC);

-- Seed Sample Completed Gift Transaction for Canonical Battle 603
INSERT INTO popolive.pk_gift_transactions (
  transaction_id, battle_id, sender_id, sender_name, receiver_id, receiver_name, receiver_side,
  gift_id, gift_name, coin_price, quantity, total_coins, host_points, pk_score_added, status
) VALUES (
  'tx_seed_pk_610_001',
  '00000000-0000-0000-0000-000000000603',
  'user_viewer_9001',
  'Ali',
  '00000000-0000-0000-0000-000000088201',
  'Sara Live',
  'host_a',
  'crown',
  'Crown',
  50,
  1,
  50,
  35,
  50,
  'completed'
) ON CONFLICT (transaction_id) DO NOTHING;
