# Campaign Archive Database Setup Guide

## Overview
This database schema archives campaign creators and their campaigns in Supabase, providing a complete history and analytics of all campaigns on the platform.

## Step 1: Run the SQL Migration

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase-campaign-archive.sql`
6. Click **Run** to execute the migration

## Step 2: Database Schema

The migration creates the following tables:

### 1. `campaign_creators`
Stores information about campaign creators:
- Wallet address (unique)
- Total campaigns created
- Total raised (in Wei)
- Successful/Failed/Claimed campaign counts
- Timestamps

### 2. `campaigns_archive`
Archives all campaign information:
- Original campaign ID from blockchain
- Creator information
- Campaign details (title, description, image, category)
- Financial information (target, amount collected)
- Timeline (deadline, created/updated dates)
- Status (Active, Successful, Failed, Claimed)
- Blockchain information (contract address, transaction hash)
- Reward tiers (stored as JSON)

### 3. `campaign_updates`
Tracks all changes to campaigns:
- Update type (created, donated, claimed, refunded, state_changed)
- Previous and new states
- Amount changes
- Transaction information
- Timestamps

## Step 3: Features

### Automatic Statistics
- Creator statistics are automatically updated when campaigns are created or updated
- Total campaigns, total raised, and success rates are calculated automatically

### Triggers
- `update_creator_stats`: Updates creator statistics when a campaign is created
- `update_creator_stats_on_state_change`: Updates statistics when campaign state changes
- `update_updated_at_column`: Automatically updates `updated_at` timestamps

### Views
- `creator_statistics`: View for easy access to creator statistics
- `campaign_summary`: View with campaign details and progress percentages

## Step 4: Integration

The `lib/supabase-campaigns.ts` file provides helper functions to:
- Archive campaigns when they're created
- Update campaigns when donations are made
- Track campaign state changes
- Retrieve creator statistics
- Get campaign history

## Usage Example

```typescript
import { campaignArchiveService } from "@/lib/supabase-campaigns"

// Archive a new campaign
await campaignArchiveService.archiveCampaign({
  campaignId: 0,
  creatorWallet: "0x...",
  title: "My Campaign",
  description: "Description",
  image: "ipfs://...",
  category: "Technology",
  targetWei: BigInt("1000000000000000000"), // 1 ETH
  amountCollectedWei: BigInt("0"),
  deadline: BigInt("1735689600"),
  state: 0, // Active
  rewardTiers: [...],
  contractAddress: "0x...",
  transactionHash: "0x..."
})

// Update campaign when donation is made
await campaignArchiveService.updateCampaignArchive(0, {
  amountCollectedWei: BigInt("500000000000000000"), // 0.5 ETH
})

// Add update history
await campaignArchiveService.addCampaignUpdate(0, {
  updateType: "donated",
  newAmountWei: BigInt("500000000000000000"),
  transactionHash: "0x...",
  blockNumber: 12345
})
```

## Security

- Row Level Security (RLS) is enabled on all tables
- Policies allow anyone to read, but only authenticated users can write
- All wallet addresses are stored in lowercase for consistency

## Next Steps

1. Integrate the archive service into your campaign creation flow
2. Update campaigns when donations are made
3. Track state changes (Active → Successful → Claimed)
4. Build analytics dashboards using the archived data

