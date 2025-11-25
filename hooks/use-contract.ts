"use client"

import { useState, useCallback } from "react"
import { useWeb3 } from "@/lib/web3"
import { Campaign, RewardTier, Category, CONTRACT_CATEGORIES, CONTRACT_ADDRESS } from "@/lib/contract"
import { campaignArchiveService } from "@/lib/supabase-campaigns"

export interface CreateCampaignParams {
  title: string
  description: string
  target: string // in ETH
  deadline: number // Unix timestamp
  image: string
  category: string // Frontend-only category
  tierDescriptions: string[]
  tierRequiredAmounts: string[] // in ETH
  tierLimits: string[]
}

export interface DonationParams {
  campaignId: number
  amount: string // in ETH
}

export function useContract() {
  const { contract, account, isCorrectNetwork, provider } = useWeb3()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const createCampaign = useCallback(async (params: CreateCampaignParams) => {
    if (!contract || !account || !isCorrectNetwork) {
      setError("Please connect your wallet and switch to Sepolia testnet")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Validate target amount
      if (!params.target || params.target.trim() === "") {
        setError("Please enter a target amount")
        return null
      }

      const targetEth = parseFloat(params.target)
      if (isNaN(targetEth) || targetEth <= 0) {
        setError("Please enter a valid target amount greater than 0")
        return null
      }

      // Convert ETH amounts to Wei - use more precise calculation
      const targetWei = BigInt(Math.floor(targetEth * 1000000000000000000)) // 1e18
      
      console.log("Campaign creation params:", {
        title: params.title,
        description: params.description,
        image: params.image,
        targetEth: targetEth,
        targetWei: targetWei.toString(),
        deadline: params.deadline,
        category: params.category
      })
      
      if (targetWei === BigInt(0)) {
        setError("Target amount must be greater than 0")
        return null
      }
      
      // Validate deadline
      const now = Math.floor(Date.now() / 1000)
      if (params.deadline <= now) {
        setError("Deadline must be in the future")
        return null
      }
      
      // Calculate duration in days from deadline
      const durationInDays = Math.ceil((params.deadline - now) / (24 * 60 * 60))
      
      if (durationInDays <= 0) {
        setError("Campaign duration must be at least 1 day")
        return null
      }
      
      // Validate category
      if (!params.category || params.category.trim() === "") {
        setError("Please select a category")
        return null
      }
      
      // Convert category string to Category enum
      const categoryIndex = CONTRACT_CATEGORIES.indexOf(params.category as any)
      if (categoryIndex === -1) {
        setError(`Invalid category selected: ${params.category}. Valid categories: ${CONTRACT_CATEGORIES.join(", ")}`)
        return null
      }
      
      // Validate required fields
      if (!params.title || params.title.trim() === "") {
        setError("Please enter a campaign title")
        return null
      }
      
      if (!params.description || params.description.trim() === "") {
        setError("Please enter a campaign description")
        return null
      }
      
      // Validate and prepare reward tiers
      const tierNames: string[] = []
      const tierAmountsWei: bigint[] = []
      const rewardTiers: Array<{ description: string; requiredAmount: bigint }> = []
      
      if (params.tierDescriptions.length > 0 && params.tierDescriptions[0] !== "") {
        for (let i = 0; i < params.tierDescriptions.length; i++) {
          if (params.tierDescriptions[i] && params.tierDescriptions[i].trim() !== "" && 
              params.tierRequiredAmounts[i] && params.tierRequiredAmounts[i].trim() !== "") {
            const tierAmountEth = parseFloat(params.tierRequiredAmounts[i])
            if (isNaN(tierAmountEth) || tierAmountEth <= 0) {
              setError(`Invalid tier amount at tier ${i + 1}`)
              return null
            }
            const tierAmountWei = BigInt(Math.floor(tierAmountEth * 1e18))
            tierNames.push(params.tierDescriptions[i].trim())
            tierAmountsWei.push(tierAmountWei)
            rewardTiers.push({
              description: params.tierDescriptions[i].trim(),
              requiredAmount: tierAmountWei
            })
          }
        }
      }
      
      console.log("Calling contract.createCampaign with:", {
        title: params.title,
        description: params.description,
        image: params.image || "",
        targetWei: targetWei.toString(),
        durationInDays,
        categoryIndex,
        tierNames,
        tierAmountsWei: tierAmountsWei.map(a => a.toString())
      })
      
      const tx = await contract.createCampaign(
        params.title,
        params.description,
        params.image || "",
        targetWei,
        durationInDays,
        categoryIndex,
        tierNames,
        tierAmountsWei
      )

      const receipt = await tx.wait()
      
      // Get the new campaign ID
      const campaignCount = await contract.numberOfCampaigns()
      const newCampaignId = Number(campaignCount) - 1
      
      // Auto-sync campaign to Supabase
      try {
        console.log("🔄 Syncing campaign to Supabase:", newCampaignId)
        const syncResponse = await fetch('/api/sync-campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: newCampaignId,
            action: 'created',
            transactionHash: tx.hash
          })
        })
        
        if (!syncResponse.ok) {
          const errorData = await syncResponse.json().catch(() => ({}))
          console.error("❌ Sync failed:", errorData)
        } else {
          const result = await syncResponse.json()
          console.log("✅ Campaign synced to Supabase:", result)
        }
      } catch (archiveError) {
        console.error("❌ Failed to sync campaign archive:", archiveError)
      }
      
      return tx.hash
    } catch (err: any) {
      console.error("Campaign creation error:", err)
      
      // Try to extract more detailed error message
      let errorMessage = "Failed to create campaign"
      
      if (err.reason) {
        errorMessage = err.reason
      } else if (err.data?.message) {
        errorMessage = err.data.message
      } else if (err.message) {
        errorMessage = err.message
        
        // Check for common revert reasons
        if (err.message.includes("Target must be > 0")) {
          errorMessage = "Target amount must be greater than 0 ETH"
        } else if (err.message.includes("execution reverted")) {
          errorMessage = "Transaction failed. Please check: 1) Target amount is > 0, 2) All required fields are filled, 3) Category is selected, 4) Deadline is in the future"
        }
      }
      
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [contract, account, isCorrectNetwork])

  const donateToCampaign = useCallback(async (params: DonationParams) => {
    if (!contract || !account || !isCorrectNetwork) {
      setError("Please connect your wallet and switch to Sepolia testnet")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Validate donation amount
      if (!params.amount || params.amount.trim() === "") {
        setError("Please enter a donation amount")
        return null
      }

      const amountEth = parseFloat(params.amount)
      if (isNaN(amountEth) || amountEth <= 0) {
        setError("Please enter a valid donation amount greater than 0")
        return null
      }

      // Convert ETH to Wei
      const amountWei = BigInt(Math.floor(amountEth * 1000000000000000000)) // 1e18
      
      if (amountWei === BigInt(0)) {
        setError("Donation amount must be greater than 0")
        return null
      }

      console.log("Donating to campaign:", {
        campaignId: params.campaignId,
        amountEth: amountEth,
        amountWei: amountWei.toString()
      })
      
      const tx = await contract.donateToCampaign(params.campaignId, {
        value: amountWei
      })

      console.log("Donation transaction sent:", tx.hash)
      const receipt = await tx.wait()
      console.log("Donation successful! Receipt:", receipt)
      
      // Auto-sync campaign to Supabase
      try {
        await fetch('/api/sync-campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: params.campaignId,
            action: 'donated'
          })
        })
      } catch (archiveError) {
        console.error("Failed to sync campaign archive:", archiveError)
      }
      
      return tx.hash
    } catch (err: any) {
      console.error("Donation error:", err)
      
      // Try to extract more detailed error message
      let errorMessage = "Failed to donate"
      
      if (err.reason) {
        errorMessage = err.reason
      } else if (err.data?.message) {
        errorMessage = err.data.message
      } else if (err.message) {
        errorMessage = err.message
        
        // Check for common revert reasons
        if (err.message.includes("Campaign is not active")) {
          errorMessage = "This campaign is not active. You cannot donate to it."
        } else if (err.message.includes("execution reverted")) {
          errorMessage = "Donation failed. Please check: 1) Campaign is active, 2) Amount is > 0, 3) You have sufficient balance"
        }
      }
      
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [contract, account, isCorrectNetwork])

  const claimFunds = useCallback(async (campaignId: number) => {
    if (!contract || !account || !isCorrectNetwork) {
      setError("Please connect your wallet and switch to Sepolia testnet")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      console.log("=== CLAIM FUNDS DEBUG ===")
      console.log("Campaign ID:", campaignId)
      console.log("Account:", account)
      console.log("Contract address:", contract.target)
      
      // Use getAllCampaigns to avoid ABI decoding issues
      const allCampaigns = await contract.getAllCampaigns()
      if (campaignId >= allCampaigns.length || campaignId < 0) {
        setError(`Campaign ${campaignId} not found. Total campaigns: ${allCampaigns.length}`)
        return null
      }
      
      const campaign = allCampaigns[campaignId]
      const campaignState = Number(campaign.state)
      const campaignOwner = campaign.owner
      const amountCollected = campaign.amountCollected
      
      console.log("Campaign details:", {
        owner: campaignOwner,
        yourAccount: account,
        ownerMatch: campaignOwner.toLowerCase() === account.toLowerCase(),
        state: campaignState,
        stateName: ["Active", "Successful", "Failed", "Claimed"][campaignState] || "Unknown",
        amountCollected: amountCollected.toString(),
        target: campaign.target.toString()
      })

      // Check if you're the campaign owner
      if (campaignOwner.toLowerCase() !== account.toLowerCase()) {
        setError(`You are not the owner. Owner: ${campaignOwner}, Your account: ${account}`)
        return null
      }

      // Check if campaign is successful (state = 1)
      if (campaignState !== 1) {
        const stateNames = ["Active", "Successful", "Failed", "Claimed"]
        setError(`Campaign is ${stateNames[campaignState] || `State ${campaignState}`}. You can only claim funds from Successful campaigns.`)
        return null
      }

      // Check if there are funds to claim
      if (amountCollected === BigInt(0)) {
        setError("No funds available to claim")
        return null
      }

      // Try to estimate gas first to see if there's an error
      try {
        const gasEstimate = await contract.claimFunds.estimateGas(campaignId)
        console.log("Gas estimate:", gasEstimate.toString())
      } catch (estimateError: any) {
        console.error("Gas estimate failed:", estimateError)
        let estimateErrorMessage = "Transaction will fail"
        if (estimateError.reason) {
          estimateErrorMessage = estimateError.reason
        } else if (estimateError.message) {
          estimateErrorMessage = estimateError.message
        }
        setError(`Cannot claim funds: ${estimateErrorMessage}`)
        return null
      }

      console.log("Attempting to claim funds...")
      const tx = await contract.claimFunds(campaignId)
      console.log("Claim funds transaction sent:", tx.hash)
      
      const receipt = await tx.wait()
      console.log("Funds claimed successfully! Receipt:", receipt)
      
      // Auto-sync campaign to Supabase
      try {
        await fetch('/api/sync-campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: campaignId,
            action: 'claimed'
          })
        })
      } catch (archiveError) {
        console.error("Failed to sync campaign archive:", archiveError)
      }
      
      return tx.hash
    } catch (err: any) {
      console.error("Claim funds error:", err)
      
      // Try to extract more detailed error message
      let errorMessage = "Failed to claim funds"
      
      if (err.reason) {
        errorMessage = err.reason
      } else if (err.data?.message) {
        errorMessage = err.data.message
      } else if (err.message) {
        errorMessage = err.message
        
        // Check for common revert reasons
        if (err.message.includes("Campaign not successful") || err.message.includes("not successful")) {
          errorMessage = "Campaign is not successful. You can only claim funds from Successful campaigns."
        } else if (err.message.includes("Not the campaign owner") || err.message.includes("onlyOwner")) {
          errorMessage = "Only the campaign owner can claim funds"
        } else if (err.message.includes("Failed to send funds")) {
          errorMessage = "Failed to send funds. Please check the contract balance."
        } else if (err.message.includes("execution reverted")) {
          errorMessage = "Transaction failed. Please check: 1) You are the campaign owner, 2) Campaign is Successful (state = 1), 3) There are funds to claim"
        }
      }
      
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [contract, account, isCorrectNetwork])

  const getRefund = useCallback(async (campaignId: number) => {
    if (!contract || !account || !isCorrectNetwork) {
      setError("Please connect your wallet and switch to Sepolia testnet")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // First check if you have a contribution to this campaign
      const contribution = await contract.contributions(campaignId, account)
      console.log("Your contribution to campaign", campaignId, ":", contribution.toString())
      
      if (contribution === BigInt(0)) {
        setError("You have no contribution to refund for this campaign")
        return null
      }

      // Check campaign state
      const campaign = await contract.campaigns(campaignId)
      console.log("Campaign state:", campaign.state)
      
      if (campaign.state !== 2) { // 2 = Failed
        setError("Refunds are only available for failed campaigns")
        return null
      }

      const tx = await contract.getRefund(campaignId)
      const receipt = await tx.wait()
      
      // Auto-sync campaign to Supabase
      try {
        await fetch('/api/sync-campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            campaignId: campaignId,
            action: 'refunded'
          })
        })
      } catch (archiveError) {
        console.error("Failed to sync campaign archive:", archiveError)
      }
      
      return tx.hash
    } catch (err: any) {
      console.error("Refund error:", err)
      setError(err.message || "Failed to get refund")
      return null
    } finally {
      setLoading(false)
    }
  }, [contract, account, isCorrectNetwork])

  const getCampaignTiers = useCallback(async (campaignId: number): Promise<RewardTier[]> => {
    if (!contract) {
      setError("Contract not available")
      return []
    }

    try {
      console.log(`Fetching tiers for campaign ${campaignId}...`)
      const tiers = await contract.getCampaignTiers(campaignId)
      console.log(`Campaign ${campaignId} - Raw tiers from contract:`, tiers)
      
      // Transform the raw contract data to our interface
      const transformedTiers = (tiers && Array.isArray(tiers) 
        ? tiers.map((tier: any) => {
            const requiredAmount = typeof tier.requiredAmount === 'bigint' 
              ? tier.requiredAmount 
              : BigInt(String(tier.requiredAmount || 0))
            
            return {
              description: tier.description || "",
              requiredAmount
            }
          })
        : [])
      
      console.log(`Campaign ${campaignId} - Transformed ${transformedTiers.length} tiers:`, transformedTiers)
      return transformedTiers
    } catch (err: any) {
      console.error(`Failed to fetch campaign tiers for campaign ${campaignId}:`, err)
      return []
    }
  }, [contract])

  const getCampaigns = useCallback(async (): Promise<Campaign[]> => {
    if (!contract) {
      setError("Contract not available")
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const campaigns = await contract.getAllCampaigns()
      console.log("Raw campaigns from contract:", campaigns)
      
      // Transform the raw contract data to our interface
      const transformedCampaigns = await Promise.all(
        campaigns.map(async (campaign: any, index: number) => {
          // Parse reward tiers from getAllCampaigns response first
          let rewardTiers: RewardTier[] = []
          
          console.log(`Campaign ${index} - Raw rewardTiers:`, {
            rewardTiers: campaign.rewardTiers,
            isArray: Array.isArray(campaign.rewardTiers),
            length: campaign.rewardTiers?.length,
            type: typeof campaign.rewardTiers
          })
          
          if (campaign.rewardTiers && Array.isArray(campaign.rewardTiers) && campaign.rewardTiers.length > 0) {
            rewardTiers = campaign.rewardTiers.map((tier: any) => ({
              description: tier.description || "",
              requiredAmount: typeof tier.requiredAmount === 'bigint' 
                ? tier.requiredAmount 
                : BigInt(String(tier.requiredAmount || 0))
            }))
            console.log(`Campaign ${index} - Parsed ${rewardTiers.length} tiers from getAllCampaigns`)
          } else {
            // Always try to fetch separately using getCampaignTiers as fallback
            console.log(`Campaign ${index} - No tiers from getAllCampaigns, fetching separately...`)
            try {
              const tiers = await getCampaignTiers(index)
              if (tiers && tiers.length > 0) {
                rewardTiers = tiers
                console.log(`Campaign ${index} - Fetched ${tiers.length} tiers separately`)
              } else {
                console.log(`Campaign ${index} - No tiers found via getCampaignTiers`)
              }
            } catch (err) {
              console.warn(`Campaign ${index} - Failed to fetch tiers separately:`, err)
            }
          }

          return {
            id: index,
            owner: campaign.owner,
            title: campaign.title,
            description: campaign.description,
            target: typeof campaign.target === 'bigint' ? campaign.target : BigInt(campaign.target.toString()),
            deadline: typeof campaign.deadline === 'bigint' ? campaign.deadline : BigInt(campaign.deadline.toString()),
            amountCollected: typeof campaign.amountCollected === 'bigint' ? campaign.amountCollected : BigInt(campaign.amountCollected.toString()),
            image: campaign.image,
            category: campaign.category !== undefined ? Number(campaign.category) : Category.Other,
            state: Number(campaign.state), // Ensure state is a number
            rewardTiers
          }
        })
      )

      console.log("Final transformed campaigns:", transformedCampaigns.map(c => ({
        id: c.id,
        title: c.title,
        rewardTiersCount: c.rewardTiers.length
      })))

      return transformedCampaigns
    } catch (err: any) {
      setError(err.message || "Failed to fetch campaigns")
      return []
    } finally {
      setLoading(false)
    }
  }, [contract, getCampaignTiers])

  const getDonators = useCallback(async (campaignId: number) => {
    if (!contract || !provider || !isCorrectNetwork) {
      setError("Please connect your wallet and switch to Sepolia testnet")
      return { donors: [], amounts: [] }
    }

    setLoading(true)
    setError(null)

    try {
      // Query Donated events for this campaign
      const filter = contract.filters.Donated(campaignId, null, null)
      const events = await contract.queryFilter(filter)
      
      // Aggregate donations by donor address
      const donorMap = new Map<string, bigint>()
      
      for (const event of events) {
        // Check if event has args (EventLog type)
        if ('args' in event && event.args && Array.isArray(event.args) && event.args.length >= 3) {
          const donor = event.args[1] as string
          const amount = event.args[2] as bigint
          
          const currentAmount = donorMap.get(donor) || BigInt(0)
          donorMap.set(donor, currentAmount + amount)
        }
      }
      
      // Convert map to arrays
      const donors: string[] = []
      const amounts: bigint[] = []
      
      donorMap.forEach((amount, donor) => {
        donors.push(donor)
        amounts.push(amount)
      })
      
      console.log(`Found ${donors.length} unique donators for campaign ${campaignId}`)
      return { donors, amounts }
    } catch (err: any) {
      console.error("Get donators error:", err)
      setError(err.message || "Failed to get donators")
      return { donors: [], amounts: [] }
    } finally {
      setLoading(false)
    }
  }, [contract, provider, isCorrectNetwork])

  const getNumberOfCampaigns = useCallback(async (): Promise<number> => {
    if (!contract) {
      setError("Contract not available")
      return 0
    }

    try {
      const count = await contract.numberOfCampaigns()
      return Number(count)
    } catch (err: any) {
      setError(err.message || "Failed to get campaign count")
      return 0
    }
  }, [contract])

  const stopCampaign = useCallback(async (campaignId: number) => {
    if (!contract || !account || !isCorrectNetwork) {
      setError("Please connect your wallet and switch to Sepolia testnet")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      console.log("=== STOP CAMPAIGN DEBUG ===")
      console.log("Campaign ID:", campaignId)
      console.log("Account:", account)
      console.log("Contract address:", contract.target)
      console.log("Is correct network:", isCorrectNetwork)
      
      // First, let's check the campaign state and owner
      try {
        const allCampaigns = await contract.getAllCampaigns()
        if (campaignId >= allCampaigns.length) {
          setError(`Campaign ${campaignId} not found. Total campaigns: ${allCampaigns.length}`)
          return null
        }
        
        const campaign = allCampaigns[campaignId]
        const campaignState = Number(campaign.state)
        const campaignOwner = campaign.owner
        
        console.log("Campaign details:", {
          owner: campaignOwner,
          yourAccount: account,
          ownerMatch: campaignOwner.toLowerCase() === account.toLowerCase(),
          state: campaignState,
          stateName: ["Active", "Successful", "Failed", "Claimed"][campaignState] || "Unknown"
        })
        
        if (campaignOwner.toLowerCase() !== account.toLowerCase()) {
          setError(`You are not the owner. Owner: ${campaignOwner}, Your account: ${account}`)
          return null
        }
        
        if (campaignState !== 0) {
          const stateNames = ["Active", "Successful", "Failed", "Claimed"]
          setError(`Campaign is ${stateNames[campaignState] || `State ${campaignState}`}. Only Active campaigns can be stopped.`)
          return null
        }
      } catch (preCheckError: any) {
        console.error("Pre-check error:", preCheckError)
        // Continue anyway, contract will validate
      }
      
      // Try to estimate gas first to see if there's an error
      try {
        const gasEstimate = await contract.manualStopCampaign.estimateGas(campaignId)
        console.log("Gas estimate:", gasEstimate.toString())
      } catch (estimateError: any) {
        console.error("Gas estimate failed:", estimateError)
        let estimateErrorMessage = "Transaction will fail"
        if (estimateError.reason) {
          estimateErrorMessage = estimateError.reason
        } else if (estimateError.message) {
          estimateErrorMessage = estimateError.message
        }
        setError(`Cannot stop campaign: ${estimateErrorMessage}`)
        return null
      }
      
      console.log("Calling manualStopCampaign...")
      // Try calling with explicit method name in case of ABI issues
      let tx
      try {
        // First try the direct method call
        tx = await contract.manualStopCampaign(campaignId)
      } catch (methodError: any) {
        console.error("Direct method call failed, trying with getFunction:", methodError)
        // Fallback: use getFunction in case method name doesn't match
        const manualStopFunction = contract.getFunction("manualStopCampaign")
        tx = await manualStopFunction(campaignId)
      }
      console.log("Stop campaign transaction sent:", tx.hash)
      
      const receipt = await tx.wait()
      console.log("Campaign stopped successfully! Receipt:", receipt)
      
      return tx.hash
    } catch (err: any) {
      console.error("Stop campaign error:", err)
      
      // Try to extract more detailed error message
      let errorMessage = "Failed to stop campaign"
      
      if (err.reason) {
        errorMessage = err.reason
      } else if (err.data?.message) {
        errorMessage = err.data.message
      } else if (err.message) {
        errorMessage = err.message
        
        // Check for common revert reasons
        if (err.message.includes("Campaign is not active") || err.message.includes("campaignActive")) {
          errorMessage = "Campaign is not active. You can only stop campaigns that are currently Active."
        } else if (err.message.includes("Not the campaign owner") || err.message.includes("onlyOwner")) {
          errorMessage = "Only the campaign owner can stop the campaign"
        } else if (err.message.includes("execution reverted")) {
          errorMessage = "Failed to stop campaign. Please check: 1) You are the campaign owner, 2) Campaign is Active (not Successful/Failed/Claimed)"
        }
      }
      
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [contract, account, isCorrectNetwork])

  const getBackerRewardBalance = useCallback(async (
    campaignId: number, 
    backerAddress: string, 
    tierIndex: number
  ): Promise<bigint> => {
    if (!contract || !isCorrectNetwork) {
      setError("Please connect your wallet and switch to Sepolia testnet")
      return BigInt(0)
    }

    try {
      const balance = await contract.getBackerRewardBalance(campaignId, backerAddress, tierIndex)
      return typeof balance === 'bigint' ? balance : BigInt(balance.toString())
    } catch (err: any) {
      console.error("Get backer reward balance error:", err)
      setError(err.message || "Failed to get backer reward balance")
      return BigInt(0)
    }
  }, [contract, isCorrectNetwork])

  const getUserContribution = useCallback(async (campaignId: number): Promise<bigint> => {
    if (!contract || !account || !isCorrectNetwork) {
      console.error("Wallet not connected or wrong network")
      return BigInt(0)
    }

    try {
      const contribution = await contract.contributions(campaignId, account)
      console.log("User contribution to campaign", campaignId, ":", contribution.toString())
      return contribution
    } catch (err: any) {
      console.error("Get user contribution error:", err)
      // Don't set error state for this read-only operation
      return BigInt(0)
    }
  }, [contract, account, isCorrectNetwork])

  return {
    loading,
    error,
    clearError,
    createCampaign,
    donateToCampaign,
    claimFunds,
    getRefund,
    getCampaigns,
    getCampaignTiers,
    getDonators,
    getNumberOfCampaigns,
    stopCampaign,
    getUserContribution,
    getBackerRewardBalance,
  }
}
