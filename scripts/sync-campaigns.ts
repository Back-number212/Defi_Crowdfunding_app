// Script to sync existing campaigns to Supabase archive
// Run this in browser console or as a utility function

import { campaignArchiveService } from "@/lib/supabase-campaigns"
import { useContract } from "@/hooks/use-contract"
import { CONTRACT_CATEGORIES } from "@/lib/contract"

export async function syncAllCampaigns() {
  console.log("🔄 Starting campaign sync to Supabase...\n")
  
  try {
    // Get campaigns from blockchain
    const { getCampaigns } = useContract()
    const campaigns = await getCampaigns()
    
    console.log(`📊 Found ${campaigns.length} campaigns on blockchain\n`)
    
    // Get already archived campaigns
    const archived = await campaignArchiveService.getAllArchivedCampaigns()
    const archivedIds = new Set(archived.map(c => c.campaign_id))
    
    console.log(`📦 Found ${archived.length} campaigns already archived\n`)
    
    let synced = 0
    let skipped = 0
    let failed = 0
    
    for (const campaign of campaigns) {
      // Check if already archived
      if (archivedIds.has(campaign.id)) {
        console.log(`⏭️  Campaign ${campaign.id} already archived, skipping...`)
        skipped++
        continue
      }
      
      try {
        console.log(`📝 Archiving campaign ${campaign.id}: ${campaign.title.substring(0, 50)}...`)
        
        // Ensure BigInt values
        const target = typeof campaign.target === 'bigint' ? campaign.target : BigInt(campaign.target.toString())
        const amountCollected = typeof campaign.amountCollected === 'bigint' ? campaign.amountCollected : BigInt(campaign.amountCollected.toString())
        const deadline = typeof campaign.deadline === 'bigint' ? campaign.deadline : BigInt(campaign.deadline.toString())
        
        const result = await campaignArchiveService.archiveCampaign({
          campaignId: campaign.id,
          creatorWallet: campaign.owner,
          title: campaign.title,
          description: campaign.description,
          image: campaign.image || "",
          category: CONTRACT_CATEGORIES[campaign.category] || "Other",
          targetWei: target,
          amountCollectedWei: amountCollected,
          deadline: deadline,
          state: Number(campaign.state),
          rewardTiers: campaign.rewardTiers.map(tier => ({
            description: tier.description,
            requiredAmount: typeof tier.requiredAmount === 'bigint' ? tier.requiredAmount : BigInt(tier.requiredAmount.toString())
          })),
          contractAddress: "0x5B06A8d28F4dF5862A23b9B275f6F80f76050F76"
        })
        
        if (result) {
          console.log(`✅ Campaign ${campaign.id} archived successfully`)
          synced++
        } else {
          console.error(`❌ Failed to archive campaign ${campaign.id}`)
          failed++
        }
      } catch (error: any) {
        console.error(`❌ Error archiving campaign ${campaign.id}:`, error.message)
        failed++
      }
    }
    
    console.log("\n📊 Sync Summary:")
    console.log(`   ✅ Synced: ${synced}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📦 Total: ${campaigns.length}`)
    
    return { synced, skipped, failed, total: campaigns.length }
  } catch (error: any) {
    console.error("❌ Sync failed:", error)
    throw error
  }
}

// Make it available in browser console
if (typeof window !== 'undefined') {
  (window as any).syncAllCampaigns = syncAllCampaigns
}

