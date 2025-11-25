-- Fix statistics calculation for campaign_creators
-- This script recalculates all creator statistics from campaigns_archive

-- Function to recalculate creator stats
CREATE OR REPLACE FUNCTION recalculate_creator_stats()
RETURNS void AS $$
BEGIN
  -- Reset all creator stats
  UPDATE campaign_creators
  SET 
    total_campaigns = 0,
    total_raised_wei = 0,
    successful_campaigns = 0,
    failed_campaigns = 0,
    claimed_campaigns = 0;
  
  -- Recalculate stats from campaigns_archive
  WITH campaign_stats AS (
    SELECT 
      creator_wallet_address,
      COUNT(*)::INTEGER as total_campaigns,
      COALESCE(SUM(amount_collected_wei), 0)::BIGINT as total_raised_wei,
      COUNT(*) FILTER (WHERE state = 'Successful' OR state = 'Claimed')::INTEGER as successful_campaigns,
      COUNT(*) FILTER (WHERE state = 'Failed')::INTEGER as failed_campaigns,
      COUNT(*) FILTER (WHERE state = 'Claimed')::INTEGER as claimed_campaigns
    FROM campaigns_archive
    GROUP BY creator_wallet_address
  )
  UPDATE campaign_creators cc
  SET 
    total_campaigns = COALESCE(cs.total_campaigns, 0),
    total_raised_wei = COALESCE(cs.total_raised_wei, 0),
    successful_campaigns = COALESCE(cs.successful_campaigns, 0),
    failed_campaigns = COALESCE(cs.failed_campaigns, 0),
    claimed_campaigns = COALESCE(cs.claimed_campaigns, 0),
    updated_at = NOW()
  FROM campaign_stats cs
  WHERE cc.wallet_address = cs.creator_wallet_address;
  
  RAISE NOTICE 'Creator statistics recalculated';
END;
$$ LANGUAGE plpgsql;

-- Run the recalculation
SELECT recalculate_creator_stats();

-- Fix the update_creator_stats function to properly calculate stats
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

-- Fix the update_creator_stats_on_state_change function
CREATE OR REPLACE FUNCTION update_creator_stats_on_state_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate all stats from campaigns_archive for this creator
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

