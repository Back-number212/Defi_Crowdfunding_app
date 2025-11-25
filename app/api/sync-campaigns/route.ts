import { NextRequest, NextResponse } from 'next/server'
import { campaignArchiveService } from '@/lib/supabase-campaigns'
import { CONTRACT_ADDRESS, CONTRACT_ABI, CONTRACT_CATEGORIES } from '@/lib/contract'
import { ethers } from 'ethers'

// This API route syncs campaigns from blockchain to Supabase
// It can be called periodically or triggered by events

export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received sync request')
    const body = await request.json().catch(() => ({}))
    const { campaignId, action } = body
    
    console.log('📋 Sync request data:', { campaignId, action })
    
    // Initialize provider (use environment variable for RPC URL)
    const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/916bda29a9b444559b9110dd90a3d507'
    console.log('🔗 Using RPC URL:', rpcUrl.replace(/\/v3\/[^/]+/, '/v3/***'))
    
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
    
    // If specific campaign ID provided, sync only that campaign
    if (campaignId !== undefined) {
      console.log(`🎯 Syncing single campaign: ${campaignId}`)
      return await syncSingleCampaign(contract, campaignId, action)
    }
    
    // Otherwise, sync all campaigns
    console.log('🔄 Syncing all campaigns')
    return await syncAllCampaigns(contract)
  } catch (error: any) {
    console.error('❌ Sync error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to sync campaigns',
        details: error.stack
      },
      { status: 500 }
    )
  }
}

async function syncSingleCampaign(contract: ethers.Contract, campaignId: number, action?: string) {
  try {
    console.log(`🔄 Syncing campaign ${campaignId}...`)
    
    // Get campaign from blockchain
    const campaign = await contract.campaigns(campaignId)
    const numberOfCampaigns = await contract.numberOfCampaigns()
    
    if (Number(campaignId) >= Number(numberOfCampaigns)) {
      console.error(`❌ Campaign ${campaignId} not found. Total campaigns: ${numberOfCampaigns}`)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    console.log(`✅ Found campaign ${campaignId} on blockchain:`, {
      title: campaign.title,
      owner: campaign.owner
    })
    
    // Get reward tiers
    const tiers = await contract.getCampaignTiers(campaignId)
    const rewardTiers = tiers.map((tier: any) => ({
      description: tier.description,
      requiredAmount: typeof tier.requiredAmount === 'bigint' 
        ? tier.requiredAmount 
        : BigInt(tier.requiredAmount.toString())
    }))
    
    console.log(`📦 Found ${rewardTiers.length} reward tiers`)
    
    // Check if campaign already exists in archive
    const existing = await campaignArchiveService.getArchivedCampaign(campaignId)
    console.log(`🔍 Campaign ${campaignId} exists in archive:`, !!existing)
    
    const campaignData = {
      campaignId,
      creatorWallet: campaign.owner,
      title: campaign.title,
      description: campaign.description,
      image: campaign.image || '',
      category: CONTRACT_CATEGORIES[Number(campaign.category)] || 'Other',
      targetWei: typeof campaign.target === 'bigint' ? campaign.target : BigInt(campaign.target.toString()),
      amountCollectedWei: typeof campaign.amountCollected === 'bigint' 
        ? campaign.amountCollected 
        : BigInt(campaign.amountCollected.toString()),
      deadline: typeof campaign.deadline === 'bigint' 
        ? campaign.deadline 
        : BigInt(campaign.deadline.toString()),
      state: Number(campaign.state),
      rewardTiers,
      contractAddress: CONTRACT_ADDRESS
    }
    
    if (existing) {
      // Update existing campaign
      console.log(`🔄 Updating existing campaign ${campaignId}...`)
      await campaignArchiveService.updateCampaignArchive(campaignId, {
        amountCollectedWei: campaignData.amountCollectedWei,
        state: campaignData.state,
        isClaimed: campaignData.state === 3
      })
      
      console.log(`✅ Campaign ${campaignId} updated successfully`)
      return NextResponse.json({
        success: true,
        action: 'updated',
        campaignId
      })
    } else {
      // Archive new campaign
      console.log(`📦 Archiving new campaign ${campaignId}...`)
      const result = await campaignArchiveService.archiveCampaign(campaignData)
      
      if (result) {
        console.log(`✅ Campaign ${campaignId} archived successfully:`, result.id)
        return NextResponse.json({
          success: true,
          action: 'archived',
          campaignId,
          archiveId: result.id
        })
      } else {
        console.error(`❌ Failed to archive campaign ${campaignId}`)
        return NextResponse.json(
          { error: 'Failed to archive campaign', campaignId },
          { status: 500 }
        )
      }
    }
  } catch (error: any) {
    console.error(`❌ Error syncing campaign ${campaignId}:`, error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details
    })
    return NextResponse.json(
      { 
        error: error.message || 'Failed to sync campaign',
        campaignId,
        details: error.details || error.stack
      },
      { status: 500 }
    )
  }
}

async function syncAllCampaigns(contract: ethers.Contract) {
  try {
    const numberOfCampaigns = await contract.numberOfCampaigns()
    const count = Number(numberOfCampaigns)
    
    console.log(`🔄 Syncing ${count} campaigns...`)
    
    let synced = 0
    let updated = 0
    let failed = 0
    
    // Get all archived campaigns to check which ones exist
    const archived = await campaignArchiveService.getAllArchivedCampaigns()
    const archivedIds = new Set(archived.map(c => c.campaign_id))
    
    for (let i = 0; i < count; i++) {
      try {
        const campaign = await contract.campaigns(i)
        
        // Get reward tiers
        const tiers = await contract.getCampaignTiers(i)
        const rewardTiers = tiers.map((tier: any) => ({
          description: tier.description,
          requiredAmount: typeof tier.requiredAmount === 'bigint' 
            ? tier.requiredAmount 
            : BigInt(tier.requiredAmount.toString())
        }))
        
        const campaignData = {
          campaignId: i,
          creatorWallet: campaign.owner,
          title: campaign.title,
          description: campaign.description,
          image: campaign.image || '',
          category: CONTRACT_CATEGORIES[Number(campaign.category)] || 'Other',
          targetWei: typeof campaign.target === 'bigint' ? campaign.target : BigInt(campaign.target.toString()),
          amountCollectedWei: typeof campaign.amountCollected === 'bigint' 
            ? campaign.amountCollected 
            : BigInt(campaign.amountCollected.toString()),
          deadline: typeof campaign.deadline === 'bigint' 
            ? campaign.deadline 
            : BigInt(campaign.deadline.toString()),
          state: Number(campaign.state),
          rewardTiers,
          contractAddress: CONTRACT_ADDRESS
        }
        
        if (archivedIds.has(i)) {
          // Update existing campaign
          await campaignArchiveService.updateCampaignArchive(i, {
            amountCollectedWei: campaignData.amountCollectedWei,
            state: campaignData.state
          })
          updated++
        } else {
          // Archive new campaign
          const result = await campaignArchiveService.archiveCampaign(campaignData)
          if (result) {
            synced++
          } else {
            failed++
          }
        }
      } catch (error: any) {
        console.error(`Error syncing campaign ${i}:`, error)
        failed++
      }
    }
    
    return NextResponse.json({
      success: true,
      summary: {
        total: count,
        synced,
        updated,
        failed
      }
    })
  } catch (error: any) {
    console.error('Error syncing all campaigns:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync campaigns' },
      { status: 500 }
    )
  }
}

// GET endpoint to trigger sync
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const campaignId = searchParams.get('campaignId')
    
    const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/916bda29a9b444559b9110dd90a3d507'
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
    
    if (campaignId) {
      return await syncSingleCampaign(contract, Number(campaignId))
    }
    
    return await syncAllCampaigns(contract)
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync campaigns' },
      { status: 500 }
    )
  }
}

