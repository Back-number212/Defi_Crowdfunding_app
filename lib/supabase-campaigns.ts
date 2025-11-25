import { getSupabase } from "./supabase"

// Use getSupabase() to avoid initialization issues
const supabase = getSupabase()

// Types for campaign archive
export interface CampaignCreator {
  id: string
  wallet_address: string
  created_at: string
  updated_at: string
  total_campaigns: number
  total_raised_wei: string
  successful_campaigns: number
  failed_campaigns: number
  claimed_campaigns: number
}

export interface CampaignArchive {
  id: string
  campaign_id: number
  creator_id: string | null
  creator_wallet_address: string
  title: string
  description: string
  image: string | null
  category: string
  target_wei: string
  amount_collected_wei: string
  deadline: string
  created_at: string
  updated_at: string
  state: string
  is_claimed: boolean
  claimed_at: string | null
  contract_address: string | null
  reward_tiers: any[]
}

export interface CampaignUpdate {
  id: string
  campaign_archive_id: string
  campaign_id: number
  update_type: string
  previous_state: string | null
  new_state: string | null
  previous_amount_wei: string | null
  new_amount_wei: string | null
  transaction_hash: string | null
  block_number: number | null
  updated_at: string
  metadata: any
}

// Campaign Archive Functions
export const campaignArchiveService = {
  // Get or create a campaign creator
  async getOrCreateCreator(walletAddress: string): Promise<CampaignCreator | null> {
    try {
      // Try to get existing creator
      const { data: existing, error: fetchError } = await supabase
        .from('campaign_creators')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (existing) {
        return existing as CampaignCreator
      }

      // Create new creator if doesn't exist
      const { data: newCreator, error: createError } = await supabase
        .from('campaign_creators')
        .insert({
          wallet_address: walletAddress.toLowerCase(),
        })
        .select()
        .single()

      if (createError) throw createError
      return newCreator as CampaignCreator
    } catch (error) {
      console.error("Error getting/creating creator:", error)
      return null
    }
  },

  // Archive a campaign
  async archiveCampaign(campaign: {
    campaignId: number
    creatorWallet: string
    title: string
    description: string
    image: string
    category: string
    targetWei: bigint
    amountCollectedWei: bigint
    deadline: bigint
    state: number
    rewardTiers: Array<{ description: string; requiredAmount: bigint }>
    contractAddress?: string
    transactionHash?: string
  }): Promise<CampaignArchive | null> {
    try {
      console.log("🔍 Starting archive process for campaign:", campaign.campaignId)
      
      if (!campaign.creatorWallet) {
        throw new Error("Creator wallet address is required")
      }
      
      // Get or create creator first
      console.log("👤 Getting or creating creator:", campaign.creatorWallet)
      const creator = await this.getOrCreateCreator(campaign.creatorWallet)
      if (!creator) {
        throw new Error("Failed to get or create creator")
      }
      console.log("✅ Creator found/created:", creator.id)

      // Map state number to string
      const stateMap: Record<number, string> = {
        0: 'Active',
        1: 'Successful',
        2: 'Failed',
        3: 'Claimed'
      }

      // Prepare reward tiers as JSON
      const rewardTiersJson = campaign.rewardTiers.map(tier => ({
        description: tier.description,
        requiredAmount: tier.requiredAmount.toString()
      }))

      // Convert deadline from Unix timestamp to ISO string
      const deadlineDate = new Date(Number(campaign.deadline) * 1000).toISOString()

      const insertData: any = {
        campaign_id: campaign.campaignId,
        creator_id: creator.id,
        creator_wallet_address: campaign.creatorWallet.toLowerCase(),
        title: campaign.title,
        description: campaign.description,
        image: campaign.image || null,
        category: campaign.category,
        target_wei: campaign.targetWei.toString(),
        amount_collected_wei: campaign.amountCollectedWei.toString(),
        deadline: deadlineDate,
        state: stateMap[campaign.state] || 'Active',
        is_claimed: campaign.state === 3,
        contract_address: campaign.contractAddress || null,
        reward_tiers: rewardTiersJson
      }
      
      // Set claimed_at if campaign is already claimed
      if (campaign.state === 3) {
        insertData.claimed_at = new Date().toISOString()
      }
      
      console.log("💾 Inserting campaign into archive:", {
        campaign_id: insertData.campaign_id,
        creator_id: insertData.creator_id,
        title: insertData.title.substring(0, 50)
      })
      
      const { data, error } = await supabase
        .from('campaigns_archive')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        console.error("❌ Supabase insert error:", error)
        console.error("Error code:", error.code)
        console.error("Error message:", error.message)
        console.error("Error details:", error.details)
        throw error
      }
      
      console.log("✅ Campaign archived successfully:", data.id)
      return data as CampaignArchive
    } catch (error: any) {
      console.error("❌ Error archiving campaign:", error)
      console.error("Error type:", typeof error)
      console.error("Error message:", error?.message)
      console.error("Error stack:", error?.stack)
      if (error?.code) {
        console.error("Error code:", error.code)
      }
      if (error?.details) {
        console.error("Error details:", error.details)
      }
      return null
    }
  },

  // Update campaign archive
  async updateCampaignArchive(
    campaignId: number,
    updates: {
      amountCollectedWei?: bigint
      state?: number
      isClaimed?: boolean
    }
  ): Promise<boolean> {
    try {
      console.log("🔄 Updating campaign archive:", { campaignId, updates })
      
      const updateData: any = {}

      if (updates.amountCollectedWei !== undefined) {
        updateData.amount_collected_wei = updates.amountCollectedWei.toString()
      }

      if (updates.state !== undefined) {
        const stateMap: Record<number, string> = {
          0: 'Active',
          1: 'Successful',
          2: 'Failed',
          3: 'Claimed'
        }
        updateData.state = stateMap[updates.state] || 'Active'
        
        // Set claimed_at when state changes to Claimed
        if (updates.state === 3) {
          updateData.claimed_at = new Date().toISOString()
          updateData.is_claimed = true
        }
      }

      if (updates.isClaimed !== undefined) {
        updateData.is_claimed = updates.isClaimed
        // Set claimed_at when is_claimed is set to true
        if (updates.isClaimed && !updateData.claimed_at) {
          updateData.claimed_at = new Date().toISOString()
        }
      }

      console.log("💾 Update data:", updateData)

      const { data, error } = await supabase
        .from('campaigns_archive')
        .update(updateData)
        .eq('campaign_id', campaignId)
        .select()

      if (error) {
        console.error("❌ Update error:", error)
        throw error
      }
      
      console.log("✅ Campaign updated successfully:", data)
      return true
    } catch (error) {
      console.error("❌ Error updating campaign archive:", error)
      return false
    }
  },

  // Add campaign update/history
  async addCampaignUpdate(
    campaignId: number,
    update: {
      updateType: string
      previousState?: string
      newState?: string
      previousAmountWei?: bigint
      newAmountWei?: bigint
      transactionHash?: string
      blockNumber?: number
      metadata?: any
    }
  ): Promise<boolean> {
    try {
      // Get campaign archive ID
      const { data: campaign } = await supabase
        .from('campaigns_archive')
        .select('id')
        .eq('campaign_id', campaignId)
        .single()

      if (!campaign) {
        console.warn(`Campaign ${campaignId} not found in archive`)
        return false
      }

      const { error } = await supabase
        .from('campaign_updates')
        .insert({
          campaign_archive_id: campaign.id,
          campaign_id: campaignId,
          update_type: update.updateType,
          previous_state: update.previousState || null,
          new_state: update.newState || null,
          previous_amount_wei: update.previousAmountWei?.toString() || null,
          new_amount_wei: update.newAmountWei?.toString() || null,
          transaction_hash: update.transactionHash || null,
          block_number: update.blockNumber || null,
          metadata: update.metadata || {}
        })

      if (error) throw error
      return true
    } catch (error) {
      console.error("Error adding campaign update:", error)
      return false
    }
  },

  // Get all campaigns for a creator
  async getCreatorCampaigns(walletAddress: string): Promise<CampaignArchive[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns_archive')
        .select('id, campaign_id, creator_id, creator_wallet_address, title, description, image, category, target_wei, amount_collected_wei, deadline, created_at, updated_at, state, is_claimed, claimed_at, contract_address, reward_tiers')
        .eq('creator_wallet_address', walletAddress.toLowerCase())
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Error fetching creator campaigns:", error)
        throw error
      }
      
      // Ensure wei values are strings
      // If amount_collected_wei is 0 and campaign is claimed, use target_wei instead
      const campaigns = (data || []).map(c => {
        const targetWei = c.target_wei ? String(c.target_wei) : "0"
        const amountCollectedWei = c.amount_collected_wei ? String(c.amount_collected_wei) : "0"
        const isClaimed = c.state === 'Claimed' || c.is_claimed
        
        return {
          ...c,
          target_wei: targetWei,
          amount_collected_wei: (amountCollectedWei === "0" && isClaimed) ? targetWei : amountCollectedWei
        }
      })
      
      return campaigns as CampaignArchive[]
    } catch (error) {
      console.error("Error getting creator campaigns:", error)
      return []
    }
  },

  // Get creator statistics
  async getCreatorStats(walletAddress: string): Promise<CampaignCreator | null> {
    try {
      const { data, error } = await supabase
        .from('campaign_creators')
        .select('id, wallet_address, created_at, updated_at, total_campaigns, total_raised_wei, successful_campaigns, failed_campaigns, claimed_campaigns')
        .eq('wallet_address', walletAddress.toLowerCase())
        .single()

      if (error) {
        // If creator doesn't exist, return null (not an error)
        if (error.code === 'PGRST116') {
          console.log(`Creator ${walletAddress} not found in database`)
          return null
        }
        throw error
      }
      
      // Ensure wei values are returned as strings (BIGINT from Supabase)
      const stats = {
        ...data,
        total_raised_wei: data?.total_raised_wei ? String(data.total_raised_wei) : "0"
      }
      
      console.log("Creator stats retrieved:", {
        wallet: walletAddress,
        total_campaigns: stats.total_campaigns,
        total_raised_wei: stats.total_raised_wei,
        successful_campaigns: stats.successful_campaigns,
        failed_campaigns: stats.failed_campaigns,
        claimed_campaigns: stats.claimed_campaigns
      })
      
      return stats as CampaignCreator
    } catch (error) {
      console.error("Error getting creator stats:", error)
      return null
    }
  },

  // Get all archived campaigns
  async getAllArchivedCampaigns(): Promise<CampaignArchive[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns_archive')
        .select('id, campaign_id, creator_id, creator_wallet_address, title, description, image, category, target_wei, amount_collected_wei, deadline, created_at, updated_at, state, is_claimed, claimed_at, contract_address, reward_tiers')
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Error fetching all campaigns:", error)
        throw error
      }
      
      // Ensure wei values are strings
      // If amount_collected_wei is 0 and campaign is claimed, use target_wei instead
      const campaigns = (data || []).map(c => {
        const targetWei = c.target_wei ? String(c.target_wei) : "0"
        const amountCollectedWei = c.amount_collected_wei ? String(c.amount_collected_wei) : "0"
        const isClaimed = c.state === 'Claimed' || c.is_claimed
        
        return {
          ...c,
          target_wei: targetWei,
          amount_collected_wei: (amountCollectedWei === "0" && isClaimed) ? targetWei : amountCollectedWei
        }
      })
      
      return campaigns as CampaignArchive[]
    } catch (error) {
      console.error("Error getting all archived campaigns:", error)
      return []
    }
  },

  // Get a single archived campaign by campaign_id
  async getArchivedCampaign(campaignId: number): Promise<CampaignArchive | null> {
    try {
      const { data, error } = await supabase
        .from('campaigns_archive')
        .select('id, campaign_id, creator_id, creator_wallet_address, title, description, image, category, target_wei, amount_collected_wei, deadline, created_at, updated_at, state, is_claimed, claimed_at, contract_address, reward_tiers')
        .eq('campaign_id', campaignId)
        .maybeSingle() // Use maybeSingle() instead of single() to avoid errors when no row found

      if (error) {
        // Check if error object is empty or has no meaningful properties
        const errorKeys = Object.keys(error)
        const errorCode = (error as any)?.code
        const errorMessage = String((error as any)?.message || '')
        
        // If error object is empty or has no code/message, it's likely a "not found" case
        // This happens with maybeSingle() when no row is found - this is expected
        if (errorKeys.length === 0 || (!errorCode && !errorMessage)) {
          return null
        }
        
        // PGRST116 means no rows returned - this is expected and should be silent
        if (errorCode === 'PGRST116' || 
            errorMessage.includes('No rows') || 
            errorMessage.includes('not found') ||
            errorMessage.includes('0 rows')) {
          return null
        }
        
        // Only log actual errors with meaningful information
        if (errorCode || errorMessage) {
          console.error("Error fetching archived campaign:", {
            code: errorCode,
            message: errorMessage,
            details: (error as any)?.details,
            hint: (error as any)?.hint
          })
        }
        return null
      }
      
      // maybeSingle() returns null if no row found, which is what we want
      if (data) {
        // Ensure wei values are strings
        // If amount_collected_wei is 0 and campaign is claimed, use target_wei instead
        const targetWei = data.target_wei ? String(data.target_wei) : "0"
        const amountCollectedWei = data.amount_collected_wei ? String(data.amount_collected_wei) : "0"
        const isClaimed = data.state === 'Claimed' || data.is_claimed
        
        return {
          ...data,
          target_wei: targetWei,
          amount_collected_wei: (amountCollectedWei === "0" && isClaimed) ? targetWei : amountCollectedWei
        } as CampaignArchive
      }
      
      return null
    } catch (error: any) {
      // Handle unexpected errors silently - campaigns not in archive are expected
      return null
    }
  }
}

