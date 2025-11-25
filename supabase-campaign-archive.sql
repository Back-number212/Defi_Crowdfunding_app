-- Campaign Archive Database Schema
-- This schema archives campaign creators and their campaigns

-- ============================================
-- 1. Campaign Creators Table
-- ============================================
CREATE TABLE IF NOT EXISTS campaign_creators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_campaigns INTEGER DEFAULT 0,
  total_raised_wei BIGINT DEFAULT 0,
  successful_campaigns INTEGER DEFAULT 0,
  failed_campaigns INTEGER DEFAULT 0,
  claimed_campaigns INTEGER DEFAULT 0
);

-- Index on wallet address for fast lookups
CREATE INDEX IF NOT EXISTS idx_creators_wallet_address ON campaign_creators(wallet_address);

-- ============================================
-- 2. Campaigns Archive Table
-- ============================================
CREATE TABLE IF NOT EXISTS campaigns_archive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id BIGINT NOT NULL, -- Original campaign ID from blockchain
  creator_id UUID REFERENCES campaign_creators(id) ON DELETE CASCADE,
  creator_wallet_address TEXT NOT NULL,
  
  -- Campaign Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  category TEXT NOT NULL,
  
  -- Financial Information
  target_wei BIGINT NOT NULL,
  amount_collected_wei BIGINT NOT NULL DEFAULT 0,
  
  -- Timeline
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Status
  state TEXT NOT NULL DEFAULT 'Active', -- Active, Successful, Failed, Claimed
  is_claimed BOOLEAN DEFAULT FALSE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  
  -- Blockchain Information
  contract_address TEXT,
  transaction_hash TEXT,
  
  -- Metadata
  reward_tiers JSONB DEFAULT '[]'::jsonb, -- Store reward tiers as JSON
  
  -- Constraints
  UNIQUE(campaign_id, contract_address)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_id ON campaigns_archive(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id ON campaigns_archive(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator_wallet ON campaigns_archive(creator_wallet_address);
CREATE INDEX IF NOT EXISTS idx_campaigns_state ON campaigns_archive(state);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns_archive(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_category ON campaigns_archive(category);

-- ============================================
-- 3. Campaign Updates/History Table
-- ============================================
CREATE TABLE IF NOT EXISTS campaign_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_archive_id UUID REFERENCES campaigns_archive(id) ON DELETE CASCADE,
  campaign_id BIGINT NOT NULL,
  
  -- Update Details
  update_type TEXT NOT NULL, -- 'created', 'donated', 'claimed', 'refunded', 'state_changed'
  previous_state TEXT,
  new_state TEXT,
  previous_amount_wei BIGINT,
  new_amount_wei BIGINT,
  
  -- Transaction Info
  transaction_hash TEXT,
  block_number BIGINT,
  
  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_updates_campaign_archive_id ON campaign_updates(campaign_archive_id);
CREATE INDEX IF NOT EXISTS idx_updates_campaign_id ON campaign_updates(campaign_id);
CREATE INDEX IF NOT EXISTS idx_updates_type ON campaign_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_updates_updated_at ON campaign_updates(updated_at DESC);

-- ============================================
-- 4. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE campaign_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_updates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS Policies
-- ============================================

-- Campaign Creators Policies
DROP POLICY IF EXISTS "Anyone can read creators" ON campaign_creators;
CREATE POLICY "Anyone can read creators"
  ON campaign_creators
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert creators" ON campaign_creators;
CREATE POLICY "Anyone can insert creators"
  ON campaign_creators
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update creators" ON campaign_creators;
CREATE POLICY "Anyone can update creators"
  ON campaign_creators
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Campaigns Archive Policies
DROP POLICY IF EXISTS "Anyone can read campaigns" ON campaigns_archive;
CREATE POLICY "Anyone can read campaigns"
  ON campaigns_archive
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert campaigns" ON campaigns_archive;
CREATE POLICY "Anyone can insert campaigns"
  ON campaigns_archive
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update campaigns" ON campaigns_archive;
CREATE POLICY "Anyone can update campaigns"
  ON campaigns_archive
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Campaign Updates Policies
DROP POLICY IF EXISTS "Anyone can read updates" ON campaign_updates;
CREATE POLICY "Anyone can read updates"
  ON campaign_updates
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can insert updates" ON campaign_updates;
CREATE POLICY "Anyone can insert updates"
  ON campaign_updates
  FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 6. Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for campaign_creators
DROP TRIGGER IF EXISTS update_creators_updated_at ON campaign_creators;
CREATE TRIGGER update_creators_updated_at
  BEFORE UPDATE ON campaign_creators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for campaigns_archive
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns_archive;
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns_archive
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update creator stats when campaign is created/updated
CREATE OR REPLACE FUNCTION update_creator_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Get or create creator
  INSERT INTO campaign_creators (wallet_address, total_campaigns, total_raised_wei)
  VALUES (NEW.creator_wallet_address, 1, NEW.amount_collected_wei)
  ON CONFLICT (wallet_address) 
  DO UPDATE SET
    total_campaigns = (
      SELECT COUNT(*) 
      FROM campaigns_archive 
      WHERE creator_wallet_address = NEW.creator_wallet_address
    ),
    total_raised_wei = (
      SELECT COALESCE(SUM(amount_collected_wei), 0)::BIGINT
      FROM campaigns_archive 
      WHERE creator_wallet_address = NEW.creator_wallet_address
    ),
    successful_campaigns = (
      SELECT COUNT(*) 
      FROM campaigns_archive 
      WHERE creator_wallet_address = NEW.creator_wallet_address 
        AND (state = 'Successful' OR state = 'Claimed')
    ),
    failed_campaigns = (
      SELECT COUNT(*) 
      FROM campaigns_archive 
      WHERE creator_wallet_address = NEW.creator_wallet_address 
        AND state = 'Failed'
    ),
    claimed_campaigns = (
      SELECT COUNT(*) 
      FROM campaigns_archive 
      WHERE creator_wallet_address = NEW.creator_wallet_address 
        AND state = 'Claimed'
    ),
    updated_at = NOW();
  
  -- Update creator_id in campaigns_archive
  UPDATE campaigns_archive
  SET creator_id = (SELECT id FROM campaign_creators WHERE wallet_address = NEW.creator_wallet_address)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update creator stats on campaign insert
DROP TRIGGER IF EXISTS trigger_update_creator_stats ON campaigns_archive;
CREATE TRIGGER trigger_update_creator_stats
  AFTER INSERT ON campaigns_archive
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_stats();

-- Function to update creator stats when campaign state changes
CREATE OR REPLACE FUNCTION update_creator_stats_on_state_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate all stats from campaigns_archive for this creator
  -- This ensures accuracy even if multiple updates happen
  UPDATE campaign_creators
  SET 
    total_campaigns = (
      SELECT COUNT(*) 
      FROM campaigns_archive 
      WHERE creator_wallet_address = NEW.creator_wallet_address
    ),
    total_raised_wei = (
      SELECT COALESCE(SUM(amount_collected_wei), 0)::BIGINT
      FROM campaigns_archive 
      WHERE creator_wallet_address = NEW.creator_wallet_address
    ),
    successful_campaigns = (
      SELECT COUNT(*) 
      FROM campaigns_archive 
      WHERE creator_wallet_address = NEW.creator_wallet_address 
        AND (state = 'Successful' OR state = 'Claimed')
    ),
    failed_campaigns = (
      SELECT COUNT(*) 
      FROM campaigns_archive 
      WHERE creator_wallet_address = NEW.creator_wallet_address 
        AND state = 'Failed'
    ),
    claimed_campaigns = (
      SELECT COUNT(*) 
      FROM campaigns_archive 
      WHERE creator_wallet_address = NEW.creator_wallet_address 
        AND state = 'Claimed'
    ),
    updated_at = NOW()
  WHERE wallet_address = NEW.creator_wallet_address;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update creator stats on campaign update
DROP TRIGGER IF EXISTS trigger_update_creator_stats_on_change ON campaigns_archive;
CREATE TRIGGER trigger_update_creator_stats_on_change
  AFTER UPDATE ON campaigns_archive
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_stats_on_state_change();

-- ============================================
-- 7. Helper Views (Optional)
-- ============================================

-- View for creator statistics
CREATE OR REPLACE VIEW creator_statistics AS
SELECT 
  cc.id,
  cc.wallet_address,
  cc.total_campaigns,
  cc.total_raised_wei,
  cc.successful_campaigns,
  cc.failed_campaigns,
  cc.claimed_campaigns,
  COUNT(ca.id) FILTER (WHERE ca.state = 'Active') as active_campaigns,
  cc.created_at,
  cc.updated_at
FROM campaign_creators cc
LEFT JOIN campaigns_archive ca ON cc.id = ca.creator_id
GROUP BY cc.id, cc.wallet_address, cc.total_campaigns, cc.total_raised_wei, 
         cc.successful_campaigns, cc.failed_campaigns, cc.claimed_campaigns, 
         cc.created_at, cc.updated_at;

-- View for campaign summary
CREATE OR REPLACE VIEW campaign_summary AS
SELECT 
  ca.*,
  cc.wallet_address as creator_wallet,
  cc.total_campaigns as creator_total_campaigns,
  CASE 
    WHEN ca.amount_collected_wei >= ca.target_wei THEN 100.0
    ELSE (ca.amount_collected_wei::numeric / NULLIF(ca.target_wei, 0)::numeric * 100)
  END as progress_percentage
FROM campaigns_archive ca
LEFT JOIN campaign_creators cc ON ca.creator_id = cc.id;

