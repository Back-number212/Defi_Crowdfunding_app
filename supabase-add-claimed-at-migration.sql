-- Migration: Add claimed_at column to campaigns_archive if it doesn't exist
-- This migration is safe to run multiple times

-- Add claimed_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'campaigns_archive' 
    AND column_name = 'claimed_at'
  ) THEN
    ALTER TABLE campaigns_archive 
    ADD COLUMN claimed_at TIMESTAMP WITH TIME ZONE;
    
    RAISE NOTICE 'Column claimed_at added to campaigns_archive';
  ELSE
    RAISE NOTICE 'Column claimed_at already exists in campaigns_archive';
  END IF;
END $$;

-- Add index on claimed_at for better query performance
CREATE INDEX IF NOT EXISTS idx_campaigns_claimed_at ON campaigns_archive(claimed_at DESC);

-- Update existing claimed campaigns to set claimed_at if not set
UPDATE campaigns_archive
SET claimed_at = updated_at
WHERE state = 'Claimed' 
  AND is_claimed = true 
  AND claimed_at IS NULL;

