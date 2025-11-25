"use client"

import { useState, useEffect } from "react"
import { useContract } from "@/hooks/use-contract"
import { useWeb3 } from "@/lib/web3"
import { useFormatting } from "@/hooks/use-formatting"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Calendar, 
  Target, 
  TrendingUp, 
  Users, 
  Gift, 
  Wallet,
  Loader2,
  ExternalLink,
  Copy,
  X,
  StopCircle
} from "lucide-react"
import type { FrontendCampaign } from "@/lib/frontend-campaign"
import { CampaignComments } from "@/components/campaign-comments"
import { CampaignRewards } from "@/components/campaign-rewards"

interface CampaignDetailModalProps {
  campaign: FrontendCampaign | null
  isOpen: boolean
  onClose: () => void
  onHide?: (campaignId: number) => void
  isOwner?: boolean
}

export function CampaignDetailModal({ 
  campaign, 
  isOpen, 
  onClose, 
  onHide,
  isOwner 
}: CampaignDetailModalProps) {
  const { donateToCampaign, claimFunds, getRefund, getDonators, stopCampaign, getCampaignTiers, loading, error, clearError } = useContract()
  const { isConnected, isCorrectNetwork, account } = useWeb3()
  
  // Double-check if user is owner by comparing addresses
  const actualIsOwner = account && campaign.owner.toLowerCase() === account.toLowerCase()
  const { 
    formatWeiToEth, 
    formatAddress, 
    getProgressPercentage, 
    getTimeRemaining, 
    isCampaignEnded, 
    isCampaignSuccessful 
  } = useFormatting()
  
  const [donationAmount, setDonationAmount] = useState("")
  const [showDonationForm, setShowDonationForm] = useState(false)
  const [donators, setDonators] = useState<any[]>([])
  const [showDonators, setShowDonators] = useState(false)
  // Removed archived data fetching since claimed_at and transaction_hash columns were deleted

  if (!campaign) return null

  // Debug logging for owner check and reward tiers
  if (isOpen) {
    console.log("Campaign Detail Modal - Owner Check:", {
      isOwnerProp: isOwner,
      actualIsOwner: actualIsOwner,
      account: account,
      campaignOwner: campaign.owner,
      campaignState: campaign.state,
      campaignId: campaign.id
    })
    console.log("Campaign Reward Tiers:", {
      rewardTiers: campaign.rewardTiers,
      rewardTiersLength: campaign.rewardTiers?.length || 0,
      rewardTiersType: typeof campaign.rewardTiers,
      rewardTiersIsArray: Array.isArray(campaign.rewardTiers)
    })
  }

  // Ensure BigInt values for calculations
  const target = typeof campaign.target === 'bigint' ? campaign.target : BigInt(campaign.target.toString())
  const deadline = typeof campaign.deadline === 'bigint' ? campaign.deadline : BigInt(campaign.deadline.toString())
  
  // For claimed campaigns (state === 3), use target as the collected amount to preserve the original funded amount
  const isClaimed = Number(campaign.state) === 3
  const amountCollected = isClaimed 
    ? target 
    : (typeof campaign.amountCollected === 'bigint' ? campaign.amountCollected : BigInt(campaign.amountCollected.toString()))
  
  const progress = getProgressPercentage(amountCollected, target)
  const timeRemaining = getTimeRemaining(deadline)
  const isExpired = isCampaignEnded(deadline)
  const goalReached = isCampaignSuccessful(amountCollected, target)
  const totalBackers = 0 // Not available in new contract

  const handleDonate = async () => {
    if (!donationAmount) return

    try {
      const result = await donateToCampaign({
        campaignId: campaign.id,
        amount: donationAmount
      })

      if (result) {
        setDonationAmount("")
        setShowDonationForm(false)
        // Show success message
        alert("Donation successful! Thank you for your contribution.")
        onClose()
      } else {
        alert("Donation failed. Please check your wallet connection and try again.")
      }
    } catch (error) {
      console.error("Donation error:", error)
      alert("Donation failed. Please check your wallet connection and try again.")
    }
  }

  const handleClaimFunds = async () => {
    try {
      const result = await claimFunds(campaign.id)
      if (result) {
        alert("Funds claimed successfully!")
        onClose()
      } else {
        alert("Failed to claim funds. Please check your wallet connection and try again.")
      }
    } catch (error) {
      console.error("Claim funds error:", error)
      alert("Failed to claim funds. Please check your wallet connection and try again.")
    }
  }

  const handleGetDonators = async () => {
    try {
      const donatorsData = await getDonators(campaign.id)
      if (donatorsData.donors && donatorsData.donors.length > 0) {
        // Get reward tiers to calculate tier index for each donator based on total contribution
        const tiers = await getCampaignTiers(campaign.id)
        
        // Transform the data and calculate tier index based on total contribution amount
        const transformedDonators = donatorsData.donors.map((donor: string, index: number) => {
          const totalAmount = donatorsData.amounts[index] || BigInt(0)
          
          // Find the highest tier that this total contribution qualifies for
          let highestTierIndex = -1
          let highestRequiredAmount = BigInt(0)
          
          for (let i = 0; i < tiers.length; i++) {
            const required = typeof tiers[i].requiredAmount === 'bigint' 
              ? tiers[i].requiredAmount 
              : BigInt(String(tiers[i].requiredAmount))
            
            // Check if total contribution qualifies for this tier
            if (totalAmount >= required && required >= highestRequiredAmount) {
              highestTierIndex = i
              highestRequiredAmount = required
            }
          }
          
          return {
            donor,
            amount: totalAmount,
            tierIndex: highestTierIndex >= 0 ? BigInt(highestTierIndex) : BigInt(0)
          }
        })
        setDonators(transformedDonators)
      } else {
        setDonators([])
      }
      setShowDonators(true)
    } catch (error) {
      console.error("Error getting donators:", error)
      setDonators([])
      setShowDonators(true)
    }
  }

  const handleRefund = async () => {
    try {
      const result = await getRefund(campaign.id)
      if (result) {
        alert("Refund successful!")
        onClose()
      } else {
        alert("Failed to get refund. Please check your wallet connection and try again.")
      }
    } catch (error) {
      console.error("Refund error:", error)
      alert("Failed to get refund. Please check your wallet connection and try again.")
    }
  }

  const handleStopCampaign = async () => {
    try {
      if (confirm("Are you sure you want to stop this campaign? This action cannot be undone.")) {
        const result = await stopCampaign(campaign.id)
        if (result) {
          alert("Campaign stopped successfully!")
          onClose()
        } else {
          alert("Failed to stop campaign. Please check your wallet connection and try again.")
        }
      }
    } catch (error) {
      console.error("Stop campaign error:", error)
      alert("Failed to stop campaign. Please check your wallet connection and try again.")
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <Badge variant="secondary" className="text-sm">
              {campaign.category}
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-bold">{campaign.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Campaign Image */}
          {campaign.image && (
            <div className="w-full min-h-64 max-h-96 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
              <img 
                src={campaign.image} 
                alt={campaign.title}
                className="w-full h-full object-contain max-h-96"
              />
            </div>
          )}

          {/* Campaign Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{campaign.description}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Creator</h3>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">{formatAddress(campaign.owner)}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(campaign.owner)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatWeiToEth(amountCollected)} ETH</span>
                  <span className="text-muted-foreground">of {formatWeiToEth(target)} ETH</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{progress.toFixed(1)}% funded</span>
                  <span className="text-muted-foreground">{totalBackers} backers</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Time Left</p>
                    <p className="text-sm text-muted-foreground">{timeRemaining}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">
                      {Number(campaign.state) === 0 ? "Active" : 
                       Number(campaign.state) === 1 ? "Successful" : 
                       Number(campaign.state) === 2 ? "Failed" : 
                       Number(campaign.state) === 3 ? "Claimed" : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reward Tiers Section - Full Width (only show when donation form is not open) */}
          {campaign && !showDonationForm && (
            <div className="mt-6">
              <CampaignRewards 
                campaignId={campaign.id}
                donationAmount={undefined}
                selectedTier={null}
                onTierSelect={undefined}
                showSelection={false}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {/* Donate Button - Available to everyone */}
            <Button
              onClick={() => setShowDonationForm(true)}
              disabled={isExpired || goalReached || !isConnected || !isCorrectNetwork}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:opacity-90 transition-all duration-200"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Donate
            </Button>
            
            {/* Refund Button - Available to everyone */}
            <Button
              onClick={handleRefund}
              disabled={!isExpired || goalReached || !isConnected || !isCorrectNetwork}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:opacity-90 transition-all duration-200"
            >
              Get Refund
            </Button>
            
            {/* Claim Funds Button - Available to campaign owner when goal is reached */}
            {(isOwner || actualIsOwner) && goalReached && (
              <Button
                onClick={handleClaimFunds}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  "Claim Funds"
                )}
              </Button>
            )}

            {/* Manual Stop Campaign Button - Always visible for campaign owner */}
            {(isOwner || actualIsOwner) && (
              <Button
                onClick={() => {
                  console.log("Manual Stop Campaign button clicked!")
                  console.log("Campaign state:", campaign.state, "Type:", typeof campaign.state)
                  console.log("Number(campaign.state):", Number(campaign.state))
                  console.log("Is owner:", isOwner, "Actual is owner:", actualIsOwner)
                  handleStopCampaign()
                }}
                disabled={loading}
                variant="destructive"
                className="bg-red-600 hover:bg-red-700 text-white"
                title="Stop this campaign manually"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Stopping...
                  </>
                ) : (
                  <>
                    <StopCircle className="h-4 w-4 mr-2" />
                    Manual Stop Campaign
                  </>
                )}
              </Button>
            )}

            <Button
              onClick={handleGetDonators}
              disabled={!isConnected || !isCorrectNetwork}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:opacity-90 transition-all duration-200"
            >
              <Users className="h-4 w-4 mr-2" />
              Get Donators
            </Button>

            {onHide && (
              <Button
                onClick={() => onHide(campaign.id)}
                variant="outline"
                className="text-muted-foreground"
              >
                Hide Campaign
              </Button>
            )}
          </div>

          {/* Donation Form */}
          {showDonationForm && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Make a Donation</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Donation Amount (ETH)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={donationAmount}
                    onChange={(e) => {
                      setDonationAmount(e.target.value)
                      clearError()
                    }}
                    placeholder="0.00"
                  />
                </div>

                {/* Reward Section in Donation Form - Show eligible rewards only */}
                {campaign && donationAmount && (
                  <CampaignRewards 
                    campaignId={campaign.id}
                    donationAmount={donationAmount}
                    selectedTier={null}
                    onTierSelect={undefined}
                    showSelection={false}
                  />
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={handleDonate}
                    disabled={loading || !donationAmount || parseFloat(donationAmount) <= 0}
                    className="flex-1"
                  >
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {loading ? "Processing..." : "Donate"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowDonationForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Donators Modal */}
          {showDonators && (
            <div className="border-t pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Campaign Donators</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDonators(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {donators.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2">
                      Donator information is not available in the current contract version.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      This feature may be available in future updates.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {donators.map((donator, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-mono text-sm">{formatAddress(donator.donor)}</p>
                          <p className="text-xs text-muted-foreground">
                            Amount: {formatWeiToEth(donator.amount)} ETH
                          </p>
                        </div>
                        <Badge variant="outline">
                          Tier {Number(donator.tierIndex) + 1}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comment Section */}
          <div className="border-t pt-6">
            <CampaignComments campaignId={campaign.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
