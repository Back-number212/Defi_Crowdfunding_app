# Troubleshooting Campaign Archive

## Issue: Campaign Created But Not Archived

If you created a campaign but it doesn't appear in the Supabase archive tables, follow these steps:

### Step 1: Check Browser Console

Open your browser's developer console (F12) and look for:
- ✅ Success messages: "Campaign archived successfully"
- ❌ Error messages: "Failed to archive campaign" or "Supabase insert error"

### Step 2: Verify Supabase Tables Exist

1. Go to your Supabase dashboard
2. Navigate to **Table Editor**
3. Check if these tables exist:
   - `campaign_creators`
   - `campaigns_archive`
   - `campaign_updates`

If tables don't exist, you need to run the SQL migration:
1. Go to **SQL Editor**
2. Copy and paste the contents of `supabase-campaign-archive.sql`
3. Click **Run**

### Step 3: Check Environment Variables

Verify your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://ftczasczdvtbarxwqcyu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** Restart your dev server after adding/changing environment variables!

### Step 4: Check Supabase RLS Policies

The tables might exist but RLS (Row Level Security) might be blocking inserts:

1. Go to **Authentication** → **Policies** in Supabase
2. Or run this SQL to check policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'campaigns_archive';
```

If policies are too restrictive, you can temporarily disable RLS for testing:
```sql
ALTER TABLE campaigns_archive DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_creators DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_updates DISABLE ROW LEVEL SECURITY;
```

### Step 5: Test Supabase Connection

Create a test file to verify connection:

```typescript
// test-supabase.ts
import { supabase } from "@/lib/supabase"

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('campaign_creators')
      .select('count')
    
    if (error) {
      console.error("❌ Supabase connection error:", error)
    } else {
      console.log("✅ Supabase connected successfully")
    }
  } catch (err) {
    console.error("❌ Connection test failed:", err)
  }
}

testConnection()
```

### Step 6: Manual Archive Test

Try archiving a campaign manually:

```typescript
import { campaignArchiveService } from "@/lib/supabase-campaigns"

// Test with a simple campaign
const result = await campaignArchiveService.archiveCampaign({
  campaignId: 999, // Test ID
  creatorWallet: "0x1234567890123456789012345678901234567890",
  title: "Test Campaign",
  description: "Test",
  image: "",
  category: "Technology",
  targetWei: BigInt("1000000000000000000"),
  amountCollectedWei: BigInt("0"),
  deadline: BigInt("1735689600"),
  state: 0,
  rewardTiers: []
})

console.log("Archive result:", result)
```

### Common Errors

#### Error: "relation 'campaigns_archive' does not exist"
**Solution:** Run the SQL migration file in Supabase

#### Error: "new row violates row-level security policy"
**Solution:** Check RLS policies or temporarily disable RLS

#### Error: "Missing Supabase environment variables"
**Solution:** 
1. Check `.env.local` file exists
2. Verify variables are correct
3. Restart dev server

#### Error: "Failed to get or create creator"
**Solution:** Check if `campaign_creators` table exists and RLS allows inserts

### Step 7: Check Network Tab

1. Open browser DevTools → Network tab
2. Create a campaign
3. Look for requests to `supabase.co`
4. Check if requests are:
   - ✅ 200/201 (Success)
   - ❌ 400/401/403 (Error - check response body)

### Step 8: Verify Data in Supabase

1. Go to Supabase dashboard → Table Editor
2. Select `campaigns_archive` table
3. Check if your campaign appears
4. If not, check the `campaign_creators` table to see if creator was created

### Still Not Working?

1. **Check the console logs** - The code now has detailed logging
2. **Verify Supabase project is active** - Check your Supabase dashboard
3. **Check API limits** - Free tier has limits
4. **Try creating a campaign again** - Sometimes it's a timing issue

### Quick Fix: Sync Existing Campaigns

If you have campaigns on blockchain but not in archive, you can sync them:

```typescript
// In your component or a utility script
const syncCampaigns = async () => {
  const campaigns = await getCampaigns() // From use-contract
  
  for (const campaign of campaigns) {
    const result = await campaignArchiveService.archiveCampaign({
      campaignId: campaign.id,
      creatorWallet: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      image: campaign.image,
      category: CONTRACT_CATEGORIES[campaign.category],
      targetWei: campaign.target,
      amountCollectedWei: campaign.amountCollected,
      deadline: campaign.deadline,
      state: Number(campaign.state),
      rewardTiers: campaign.rewardTiers
    })
    
    console.log(`Campaign ${campaign.id}:`, result ? "✅ Archived" : "❌ Failed")
  }
}
```

