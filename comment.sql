-- Create comments table for campaign comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id BIGINT NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on campaign_id for faster queries
CREATE INDEX IF NOT EXISTS idx_comments_campaign_id ON comments(campaign_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
DROP POLICY IF EXISTS "Anyone can insert comments" ON comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

-- Policy: Anyone can read comments
CREATE POLICY "Anyone can read comments"
  ON comments
  FOR SELECT
  USING (true);

-- Policy: Anyone authenticated can insert comments
CREATE POLICY "Anyone can insert comments"
  ON comments
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments"
  ON comments
  FOR UPDATE
  USING (author = current_setting('request.jwt.claims', true)::json->>'sub' OR true)
  WITH CHECK (author = current_setting('request.jwt.claims', true)::json->>'sub' OR true);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
  ON comments
  FOR DELETE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

