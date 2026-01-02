"use client"

import { useState, useEffect } from "react"
import { useContract } from "@/hooks/use-contract"
import { useWeb3 } from "@/lib/web3"
import { useFormatting } from "@/hooks/use-formatting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Gift, Sparkles, Star, Trophy, Award, CheckCircle2, Loader2, Package } from "lucide-react"
import type { RewardTier } from "@/lib/contract"

interface CampaignRewardsProps {
  campaignId: number
  donationAmount?: string
  selectedTier?: number | null
  onTierSelect?: (tierIndex: number) => void
  showSelection?: boolean
}

const tierIcons = [Star, Trophy, Award, Sparkles, Gift]
const tierColors = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-red-500",
  "from-green-500 to-emerald-500",
  "from-yellow-500 to-amber-500",
]

export function CampaignRewards({
  campaignId,
  donationAmount,
  selectedTier,
  onTierSelect,
  showSelection = false,
}: CampaignRewardsProps) {
  const { getCampaignTiers, getBackerRewardBalance, getUserContribution } = useContract()
  const { account, isConnected } = useWeb3()
  const { formatWeiToEth } = useFormatting()
  
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([])
  const [rewardBalances, setRewardBalances] = useState<Map<number, bigint>>(new Map())
  const [totalContribution, setTotalContribution] = useState<bigint>(BigInt(0))
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load reward tiers from contract on mount
  useEffect(() => {
    loadRewardTiers()
  }, [campaignId, getCampaignTiers])

  // Load reward balances and total contribution for connected user
  useEffect(() => {
    if (isConnected && account && rewardTiers.length > 0) {
      loadRewardBalances()
      loadTotalContribution()
    }
  }, [campaignId, account, isConnected, rewardTiers.length, getBackerRewardBalance, getUserContribution])

  const loadRewardTiers = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log(`Loading reward tiers for campaign ${campaignId}...`)
      const tiers = await getCampaignTiers(campaignId)
      console.log(`Loaded ${tiers.length} reward tiers for campaign ${campaignId}:`, tiers)
      
      setRewardTiers(tiers)
    } catch (err) {
      console.error("Error loading reward tiers:", err)
      setError("Failed to load reward tiers. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const loadRewardBalances = async () => {
    if (!account || !isConnected) return
    
    try {
      setIsLoadingBalances(true)
      const balances = new Map<number, bigint>()
      
      for (let i = 0; i < rewardTiers.length; i++) {
        try {
          const balance = await getBackerRewardBalance(campaignId, account, i)
          if (balance > 0) {
            balances.set(i, balance)
          }
        } catch (err) {
          console.warn(`Failed to load balance for tier ${i}:`, err)
        }
      }
      
      setRewardBalances(balances)
    } catch (err) {
      console.error("Error loading reward balances:", err)
    } finally {
      setIsLoadingBalances(false)
    }
  }

  const loadTotalContribution = async () => {
    if (!account || !isConnected) return
    
    try {
      const contribution = await getUserContribution(campaignId)
      setTotalContribution(contribution)
    } catch (err) {
      console.error("Error loading total contribution:", err)
    }
  }

  // Sort tiers by required amount (ascending)
  const sortedTiers = [...rewardTiers]
    .map((tier, index) => ({ ...tier, originalIndex: index }))
    .sort((a, b) => {
      const aAmount = typeof a.requiredAmount === 'bigint' ? a.requiredAmount : BigInt(String(a.requiredAmount))
      const bAmount = typeof b.requiredAmount === 'bigint' ? b.requiredAmount : BigInt(String(b.requiredAmount))
      return aAmount < bAmount ? -1 : aAmount > bAmount ? 1 : 0
    })

  // Get eligible tiers based on donation amount or total contribution
  const getEligibleTiers = () => {
    // If donation amount is provided, use it; otherwise use total contribution
    let amountWei: bigint
    if (donationAmount) {
      amountWei = BigInt(Math.floor(parseFloat(donationAmount) * 1e18))
    } else if (totalContribution > 0) {
      amountWei = totalContribution
    } else {
      return []
    }
    
    return sortedTiers
      .filter(tier => {
        const required = typeof tier.requiredAmount === 'bigint' ? tier.requiredAmount : BigInt(String(tier.requiredAmount))
        return amountWei >= required
      })
      .map(tier => tier.originalIndex)
  }

  const eligibleTierIndices = getEligibleTiers()
  
  // Get the highest tier that user's total contribution qualifies for
  const getHighestQualifiedTier = () => {
    if (totalContribution === BigInt(0)) return null
    
    let highestTier: { tier: typeof sortedTiers[0], index: number } | null = null
    
    for (const tier of sortedTiers) {
      const required = typeof tier.requiredAmount === 'bigint' ? tier.requiredAmount : BigInt(String(tier.requiredAmount))
      if (totalContribution >= required) {
        if (!highestTier || required > (typeof highestTier.tier.requiredAmount === 'bigint' ? highestTier.tier.requiredAmount : BigInt(String(highestTier.tier.requiredAmount)))) {
          highestTier = { tier, index: tier.originalIndex }
        }
      }
    }
    
    return highestTier
  }

  const highestQualifiedTier = getHighestQualifiedTier()

  if (isLoading) {
    return (
      <Card className="border border-border bg-card">
        <CardContent className="p-6 text-center">
          <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading reward tiers...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-border bg-card">
        <CardContent className="p-6 text-center">
          <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (rewardTiers.length === 0) {
    return (
      <Card className="border border-border bg-card">
        <CardContent className="p-6 text-center">
          <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No reward tiers available for this campaign</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
            <Gift className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-xl font-semibold">Reward Tiers</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Choose your contribution level and unlock exclusive rewards
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedTiers.map((tier, displayIndex) => {
            const tierIndex = tier.originalIndex
            const requiredAmount = typeof tier.requiredAmount === 'bigint' 
              ? tier.requiredAmount 
              : BigInt(String(tier.requiredAmount))
            
            const Icon = tierIcons[displayIndex % tierIcons.length]
            const colorGradient = tierColors[displayIndex % tierColors.length]
            const isEligible = eligibleTierIndices.includes(tierIndex)
            const isSelected = selectedTier === tierIndex
            const isHighestEligible = isEligible && tierIndex === eligibleTierIndices[eligibleTierIndices.length - 1]
            // Use original tier index (not display index) to get balance
            const userBalance = rewardBalances.get(tierIndex) || BigInt(0)
            const hasReward = userBalance > 0
            // Check if this is the highest tier user qualifies for based on total contribution
            const isHighestQualified = highestQualifiedTier?.index === tierIndex

            return (
              <div
                key={tierIndex}
                onClick={() => showSelection && onTierSelect && onTierSelect(tierIndex)}
                className={`
                  relative p-4 rounded-lg border-2 transition-all duration-200
                  ${showSelection ? 'cursor-pointer hover:shadow-md' : ''}
                  ${isSelected 
                    ? 'border-primary bg-primary/5 shadow-md' 
                    : isEligible 
                      ? 'border-green-500/50 bg-green-500/5' 
                      : 'border-border bg-card hover:border-primary/50'
                  }
                `}
              >
                {/* Tier Badge */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${colorGradient}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">Tier {displayIndex + 1}</h4>
                        {/* Show "Received" if user has reward or qualifies based on total contribution */}
                        {(hasReward || isHighestQualified) && (
                          <Badge variant="default" className="bg-purple-500 text-white text-xs">
                            <Package className="h-3 w-3 mr-1" />
                            Received
                          </Badge>
                        )}
                        {/* Show "You qualify!" only when entering donation amount (not yet received) */}
                        {isHighestEligible && !hasReward && !isHighestQualified && donationAmount && (
                          <Badge variant="default" className="bg-green-500 text-white text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            You qualify!
                          </Badge>
                        )}
                        {isEligible && !isHighestEligible && !hasReward && !isHighestQualified && donationAmount && (
                          <Badge variant="outline" className="border-green-500 text-green-600 text-xs">
                            Eligible
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium text-primary mt-1">
                        {formatWeiToEth(requiredAmount)} ETH
                      </p>
                    </div>
                  </div>
                  
                  {isSelected && showSelection && (
                    <div className="p-1 rounded-full bg-primary text-primary-foreground">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  )}
                </div>

                {/* Tier Description */}
                <div className="pl-12">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {tier.description}
                  </p>
                </div>

                {/* Progress indicator for eligible tiers */}
                {isEligible && donationAmount && (
                  <div className="mt-3 pl-12">
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>You will receive this reward with your donation</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Info message */}
        {donationAmount && eligibleTierIndices.length === 0 && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              Increase your donation to unlock reward tiers. Minimum tier requires{" "}
              <span className="font-medium text-foreground">
                {formatWeiToEth(sortedTiers[0]?.requiredAmount || BigInt(0))} ETH
              </span>
            </p>
          </div>
        )}

        {!donationAmount && showSelection && (
          <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-600 dark:text-blue-400 text-center">
              💡 Enter a donation amount to see which rewards you qualify for
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

