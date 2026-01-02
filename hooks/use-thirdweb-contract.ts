"use client"

import { useState, useCallback } from "react"
import { useContract, useAddress, useChainId } from "@thirdweb-dev/react"
import { Campaign, RewardTier, Donation, CONTRACT_ADDRESS, SEPOLIA_CHAIN_ID } from "@/lib/contract"

export interface CreateCampaignParams {
  title: string
  description: string
  target: string // in ETH
  deadline: number // Unix timestamp
  image: string
  tierDescriptions: string[]
  tierRequiredAmounts: string[] // in ETH
  tierLimits: string[]
}

export interface DonationParams {
  campaignId: number
  amount: string // in ETH
}

export function useThirdwebContract() {
  const { contract } = useContract(CONTRACT_ADDRESS)
  const address = useAddress()
  const chainId = useChainId()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const createCampaign = useCallback(async (params: CreateCampaignParams) => {
    if (!contract || !address) {
      setError("Please connect your wallet")
      return null
    }

    if (chainId !== SEPOLIA_CHAIN_ID) {
      setError("Please switch to the correct network")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Convert ETH amounts to Wei
      const targetWei = BigInt(Math.floor(parseFloat(params.target) * 1e18))
      const tierAmountsWei = params.tierRequiredAmounts.map(amount => 
        BigInt(Math.floor(parseFloat(amount) * 1e18))
      )
      const tierLimitsBigInt = params.tierLimits.map(limit => BigInt(limit))

      const tx = await contract.call("createCampaign", [
        address,
        params.title,
        params.description,
        targetWei,
        params.deadline,
        params.image,
        params.tierDescriptions,
        tierAmountsWei,
        tierLimitsBigInt
      ])

      return tx.receipt.transactionHash
    } catch (err: any) {
      setError(err.message || "Failed to create campaign")
      return null
    } finally {
      setLoading(false)
    }
  }, [contract, address, chainId])

  const donateToCampaign = useCallback(async (params: DonationParams) => {
    if (!contract || !address) {
      setError("Please connect your wallet")
      return null
    }

    if (chainId !== SEPOLIA_CHAIN_ID) {
      setError("Please switch to the correct network")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Check campaign state before attempting donation
      const allCampaigns = await contract.call("getAllCampaigns", [])
      if (params.campaignId >= allCampaigns.length || params.campaignId < 0) {
        setError(`Campaign ${params.campaignId} not found`)
        return null
      }

      const campaign = allCampaigns[params.campaignId]
      const campaignState = Number(campaign.state)
      
      // Check if campaign is active
      if (campaignState !== 0) {
        let stateMessage = ""
        if (campaignState === 1) {
          stateMessage = "Chiến dịch đã thành công và đã đạt mục tiêu. Bạn không thể quyên góp nữa."
        } else if (campaignState === 2) {
          stateMessage = "Chiến dịch đã kết thúc và không đạt mục tiêu. Bạn không thể quyên góp nữa."
        } else if (campaignState === 3) {
          stateMessage = "Chiến dịch đã được rút tiền. Bạn không thể quyên góp nữa."
        } else {
          stateMessage = `Chiến dịch đang ở trạng thái không hoạt động. Bạn không thể quyên góp.`
        }
        setError(stateMessage)
        return null
      }

      const amountWei = BigInt(Math.floor(parseFloat(params.amount) * 1e18))
      
      const tx = await contract.call("donateToCampaign", [params.campaignId], {
        value: amountWei
      })

      return tx.receipt.transactionHash
    } catch (err: any) {
      let errorMessage = err.message || "Failed to donate"
      
      // Check for common revert reasons
      if (err.message && err.message.includes("Campaign is not active")) {
        errorMessage = "Chiến dịch không còn hoạt động. Bạn không thể quyên góp."
      }
      
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [contract, address, chainId])

  const claimFunds = useCallback(async (campaignId: number) => {
    if (!contract || !address) {
      setError("Please connect your wallet")
      return null
    }

    if (chainId !== SEPOLIA_CHAIN_ID) {
      setError("Please switch to the correct network")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const tx = await contract.call("claimFunds", [campaignId])
      return tx.receipt.transactionHash
    } catch (err: any) {
      setError(err.message || "Failed to claim funds")
      return null
    } finally {
      setLoading(false)
    }
  }, [contract, address, chainId])

  const getRefund = useCallback(async (campaignId: number) => {
    if (!contract || !address) {
      setError("Please connect your wallet")
      return null
    }

    if (chainId !== SEPOLIA_CHAIN_ID) {
      setError("Please switch to the correct network")
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const tx = await contract.call("getRefund", [campaignId])
      return tx.receipt.transactionHash
    } catch (err: any) {
      setError(err.message || "Failed to get refund")
      return null
    } finally {
      setLoading(false)
    }
  }, [contract, address, chainId])

  const getCampaigns = useCallback(async (): Promise<Campaign[]> => {
    if (!contract) {
      setError("Contract not available")
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const campaigns = await contract.call("getCampaigns")
      
      // Transform the raw contract data to our interface
      return campaigns.map((campaign: any, index: number) => ({
        id: index,
        owner: campaign.owner,
        title: campaign.title,
        description: campaign.description,
        target: campaign.target,
        deadline: campaign.deadline,
        amountCollected: campaign.amountCollected,
        image: campaign.image,
        claimed: campaign.claimed,
        rewardTiers: campaign.rewardTiers.map((tier: any) => ({
          description: tier.description,
          requiredAmount: tier.requiredAmount,
          limit: tier.limit,
          backers: tier.backers
        })),
        allDonations: campaign.allDonations.map((donation: any) => ({
          donor: donation.donor,
          amount: donation.amount,
          tierIndex: donation.tierIndex
        }))
      }))
    } catch (err: any) {
      setError(err.message || "Failed to fetch campaigns")
      return []
    } finally {
      setLoading(false)
    }
  }, [contract])

  const getDonators = useCallback(async (campaignId: number) => {
    if (!contract) {
      setError("Contract not available")
      return { donors: [], amounts: [] }
    }

    setLoading(true)
    setError(null)

    try {
      const [donors, amounts] = await contract.call("getDonators", [campaignId])
      return { donors, amounts }
    } catch (err: any) {
      setError(err.message || "Failed to fetch donators")
      return { donors: [], amounts: [] }
    } finally {
      setLoading(false)
    }
  }, [contract])

  const getNumberOfCampaigns = useCallback(async (): Promise<number> => {
    if (!contract) {
      setError("Contract not available")
      return 0
    }

    try {
      const count = await contract.call("numberOfCampaigns")
      return Number(count)
    } catch (err: any) {
      setError(err.message || "Failed to get campaign count")
      return 0
    }
  }, [contract])

  return {
    loading,
    error,
    clearError,
    createCampaign,
    donateToCampaign,
    claimFunds,
    getRefund,
    getCampaigns,
    getDonators,
    getNumberOfCampaigns,
    isConnected: !!address,
    isCorrectNetwork: chainId === SEPOLIA_CHAIN_ID,
    account: address
  }
}

