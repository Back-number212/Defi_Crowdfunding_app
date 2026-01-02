# Campaign Archive Service - Usage Guide

## Overview
The campaign archive service automatically saves campaign data to Supabase whenever campaigns are created, updated, or state changes occur. This guide shows you how to use the service functions.

## Automatic Integration

The archive service is **already integrated** into the following functions in `hooks/use-contract.ts`:

1. ✅ **Campaign Creation** - Automatically archives when a campaign is created
2. ✅ **Donations** - Updates archive when donations are made
3. ✅ **Claiming Funds** - Updates archive when funds are claimed

## Manual Usage Examples

### 1. Archive a Campaign (Manual)

```typescript
import { campaignArchiveService } from "@/lib/supabase-campaigns"

// After creating a campaign on blockchain
await campaignArchiveService.archiveCampaign({
  campaignId: 0,
  creatorWallet: "0x1234...",
  title: "My Campaign",
  description: "Campaign description",
  image: "ipfs://Qm...",
  category: "Technology",
  targetWei: BigInt("1000000000000000000"), // 1 ETH in Wei
  amountCollectedWei: BigInt("0"),
  deadline: BigInt("1735689600"), // Unix timestamp
  state: 0, // 0=Active, 1=Successful, 2=Failed, 3=Claimed
  rewardTiers: [
    { description: "Early Bird", requiredAmount: BigInt("500000000000000000") },
    { description: "VIP", requiredAmount: BigInt("1000000000000000000") }
  ],
  contractAddress: "0x5B06A8d28F4dF5862A23b9B275f6F80f76050F76",
  transactionHash: "0xabc123..."
})
```

### 2. Update Campaign Archive

```typescript
// Update when donation is received
await campaignArchiveService.updateCampaignArchive(0, {
  amountCollectedWei: BigInt("500000000000000000"), // 0.5 ETH
})

// Update when campaign state changes
await campaignArchiveService.updateCampaignArchive(0, {
  state: 1, // Successful
})

// Update when funds are claimed
await campaignArchiveService.updateCampaignArchive(0, {
  state: 3, // Claimed
  isClaimed: true,
  claimedAt: new Date()
})
```

### 3. Add Campaign Update History

```typescript
// Track donation
await campaignArchiveService.addCampaignUpdate(0, {
  updateType: "donated",
  previousAmountWei: BigInt("0"),
  newAmountWei: BigInt("500000000000000000"),
  transactionHash: "0xdef456...",
  blockNumber: 12345,
  metadata: {
    donor: "0x7890...",
    donationAmount: "500000000000000000"
  }
})

// Track state change
await campaignArchiveService.addCampaignUpdate(0, {
  updateType: "state_changed",
  previousState: "Active",
  newState: "Successful",
  transactionHash: "0xghi789...",
  blockNumber: 12350
})

// Track claim
await campaignArchiveService.addCampaignUpdate(0, {
  updateType: "claimed",
  previousState: "Successful",
  newState: "Claimed",
  transactionHash: "0xjkl012...",
  blockNumber: 12355
})
```

### 4. Get Creator Statistics

```typescript
// Get all campaigns for a creator
const campaigns = await campaignArchiveService.getCreatorCampaigns("0x1234...")
console.log("Creator campaigns:", campaigns)

// Get creator statistics
const stats = await campaignArchiveService.getCreatorStats("0x1234...")
console.log("Total campaigns:", stats?.total_campaigns)
console.log("Total raised:", stats?.total_raised_wei)
console.log("Successful:", stats?.successful_campaigns)
```

### 5. Get All Archived Campaigns

```typescript
// Get all campaigns from archive
const allCampaigns = await campaignArchiveService.getAllArchivedCampaigns()
console.log("Total archived campaigns:", allCampaigns.length)
```

## Integration Points

### In Your Components

```typescript
// Example: After successful campaign creation
const handleCreateCampaign = async () => {
  const txHash = await createCampaign(params)
  if (txHash) {
    // Archive is automatically handled in use-contract.ts
    // But you can also manually verify:
    const archived = await campaignArchiveService.getCreatorCampaigns(account)
    console.log("Your campaigns:", archived)
  }
}
```

### Sync Existing Campaigns

If you have existing campaigns on the blockchain that weren't archived, you can sync them:

```typescript
// Sync all existing campaigns
const syncAllCampaigns = async () => {
  const campaigns = await getCampaigns() // From use-contract
  
  for (const campaign of campaigns) {
    // Check if already archived
    const existing = await campaignArchiveService.getAllArchivedCampaigns()
    const isArchived = existing.some(c => c.campaign_id === campaign.id)
    
    if (!isArchived) {
      await campaignArchiveService.archiveCampaign({
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
    }
  }
}
```

## Available Functions

| Function | Description | Returns |
|----------|-------------|---------|
| `getOrCreateCreator(walletAddress)` | Get or create a creator record | `CampaignCreator \| null` |
| `archiveCampaign(campaign)` | Archive a new campaign | `CampaignArchive \| null` |
| `updateCampaignArchive(campaignId, updates)` | Update campaign data | `boolean` |
| `addCampaignUpdate(campaignId, update)` | Add update history | `boolean` |
| `getCreatorCampaigns(walletAddress)` | Get all campaigns for a creator | `CampaignArchive[]` |
| `getCreatorStats(walletAddress)` | Get creator statistics | `CampaignCreator \| null` |
| `getAllArchivedCampaigns()` | Get all archived campaigns | `CampaignArchive[]` |

## Error Handling

All functions handle errors gracefully and return `null` or `false` on failure. Errors are logged to console but won't break your application:

```typescript
const result = await campaignArchiveService.archiveCampaign({...})
if (!result) {
  console.error("Failed to archive campaign")
  // Continue with your flow - blockchain transaction already succeeded
}
```

## Best Practices

1. **Don't block on archive failures** - Archive is supplementary data, blockchain is source of truth
2. **Use try-catch for critical flows** - Wrap archive calls in try-catch if needed
3. **Sync periodically** - Consider syncing existing campaigns on app load
4. **Monitor archive status** - Check Supabase dashboard to verify data is being saved

## Database Queries

You can also query the archive directly in Supabase:

```sql
-- Get all campaigns for a creator
SELECT * FROM campaigns_archive 
WHERE creator_wallet_address = '0x1234...'
ORDER BY created_at DESC;

-- Get creator statistics
SELECT * FROM campaign_creators 
WHERE wallet_address = '0x1234...';

-- Get campaign history
SELECT * FROM campaign_updates 
WHERE campaign_id = 0
ORDER BY updated_at DESC;
```

