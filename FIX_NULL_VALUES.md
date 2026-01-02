# Fix for Null Values in claimed_at and transaction_hash

## Issue
The `claimed_at` and `transaction_hash` columns are returning null values even when they should have data.

## Solutions

### Solution 1: Verify Columns Exist and Are Writable

Run this in Supabase SQL Editor:
```sql
-- Check columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campaigns_archive' 
AND column_name IN ('claimed_at', 'transaction_hash');

-- If they don't exist, add them:
ALTER TABLE campaigns_archive 
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE campaigns_archive 
ADD COLUMN IF NOT EXISTS transaction_hash TEXT;
```

### Solution 2: Test Writing Values

Run the test script `supabase-test-columns.sql` to verify you can write to these columns.

### Solution 3: Check RLS Policies

If RLS is blocking updates, temporarily disable it:
```sql
ALTER TABLE campaigns_archive DISABLE ROW LEVEL SECURITY;
```

Or update the policy to allow updates:
```sql
DROP POLICY IF EXISTS "Anyone can update campaigns" ON campaigns_archive;
CREATE POLICY "Anyone can update campaigns"
  ON campaigns_archive
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
```

### Solution 4: Manual Update Test

Try manually updating a campaign:
```sql
UPDATE campaigns_archive
SET 
  transaction_hash = '0xtest123',
  claimed_at = NOW()
WHERE campaign_id = 0; -- Replace with your campaign ID

-- Verify it worked
SELECT campaign_id, transaction_hash, claimed_at 
FROM campaigns_archive 
WHERE campaign_id = 0;
```

### Solution 5: Check Browser Console

When you create a campaign or claim funds, check the browser console for:
- "💾 Inserting campaign into archive:" - should show transaction_hash
- "🔄 Updating campaign archive:" - should show claimed_at and transaction_hash
- "✅ Campaign updated successfully:" - should show the updated data

## What I've Fixed

1. ✅ Added `transaction_hash` parameter to `updateCampaignArchive()`
2. ✅ Added `claimed_at` when inserting claimed campaigns
3. ✅ Added `transaction_hash` when updating during claim
4. ✅ Added detailed logging to see what values are being set

## Next Steps

1. **Check browser console** when creating/claiming - you should see the values being set
2. **Run the test SQL** to verify columns work
3. **Check Supabase dashboard** - manually verify a row has these values
4. **If still null**, check if the columns actually exist in your database

## Debug Query

Run this to see all campaigns and their values:
```sql
SELECT 
  campaign_id,
  title,
  transaction_hash,
  claimed_at,
  is_claimed,
  state,
  created_at
FROM campaigns_archive
ORDER BY created_at DESC
LIMIT 10;
```

