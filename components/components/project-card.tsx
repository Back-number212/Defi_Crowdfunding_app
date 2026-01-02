"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useFormatting } from "@/hooks/use-formatting"
import { 
  Heart, 
  Share2, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle,
  AlertCircle,
  Wallet,
  ArrowRight
} from "lucide-react"
import type { FrontendCampaign } from "@/lib/frontend-campaign"

interface ProjectCardProps {
  campaign: FrontendCampaign
  onDonate?: (campaignId: number) => void
  onRefund?: (campaignId: number) => void
  onClaim?: (campaignId: number) => void
  onViewDetails?: (campaign: FrontendCampaign) => void
  isOwner?: boolean
}

export function ProjectCard({ 
  campaign, 
  onDonate, 
  onRefund, 
  onClaim, 
  onViewDetails,
  isOwner = false 
}: ProjectCardProps) {
  const { formatWeiToEth, getProgressPercentage, getTimeRemaining, isCampaignEnded, isCampaignSuccessful } = useFormatting()
  const [isLiked, setIsLiked] = useState(false)
  
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
  
  const getStatusBadge = () => {
    if (campaign.state === 3) return { text: "Claimed", color: "bg-green-100 text-green-700" }
    if (goalReached) return { text: "Funded", color: "bg-blue-100 text-blue-700" }
    if (isExpired) return { text: "Ended", color: "bg-muted text-muted-foreground" }
    return { text: "Active", color: "bg-green-100 text-green-700" }
  }

  const status = getStatusBadge()

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border border-border bg-card overflow-hidden">
      <CardHeader className="p-0">
        {/* Campaign Image */}
        <div className="relative h-64 bg-muted overflow-hidden flex items-center justify-center">
          {campaign.image ? (
            <img 
              src={campaign.image} 
              alt={campaign.title}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-5xl opacity-20">🎯</div>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="text-xs">
              {status.text}
            </Badge>
          </div>

          {/* Category Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="text-xs bg-background/80">
              {campaign.category}
            </Badge>
          </div>

          {/* Like Button */}
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="absolute bottom-3 right-3 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        {/* Campaign Title */}
        <CardTitle className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
          {campaign.title}
        </CardTitle>

        {/* Campaign Description */}
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {campaign.description}
        </p>

        {/* Progress Section */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{progress.toFixed(1)}%</span>
          </div>
          
          <Progress value={progress} className="h-2" />
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatWeiToEth(amountCollected)} ETH</span>
            <span>Goal: {formatWeiToEth(target)} ETH</span>
          </div>
        </div>

        {/* Campaign Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{timeRemaining}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>0 backers</span>
          </div>
        </div>

        {/* Reward Tiers Preview */}
        {campaign.rewardTiers.length > 0 && (
          <div className="mb-4 p-3 bg-muted/30 rounded-md">
            <p className="text-xs font-medium text-foreground mb-2">Reward Tiers:</p>
            <div className="space-y-1">
              {campaign.rewardTiers.slice(0, 2).map((tier, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="truncate text-muted-foreground">{tier.description}</span>
                  <span className="font-medium text-foreground">{formatWeiToEth(typeof tier.requiredAmount === 'bigint' ? tier.requiredAmount : BigInt(tier.requiredAmount.toString()))} ETH</span>
                </div>
              ))}
              {campaign.rewardTiers.length > 2 && (
                <p className="text-xs text-muted-foreground">+{campaign.rewardTiers.length - 2} more tiers</p>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <div className="w-full space-y-3">
          {/* Action Buttons */}
          <div className="flex space-x-2">
            {!isOwner && onDonate && !isExpired && (
              <Button
                onClick={() => onDonate(campaign.id)}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                <Wallet className="mr-2 h-4 w-4" />
                Donate
              </Button>
            )}
            
            {isOwner && onClaim && goalReached && campaign.state !== 3 && (
              <Button
                onClick={() => onClaim(campaign.id)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Claim Funds
              </Button>
            )}
            
            {!isOwner && onRefund && isExpired && !goalReached && (
              <Button
                onClick={() => onRefund(campaign.id)}
                variant="outline"
                className="flex-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                size="sm"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Get Refund
              </Button>
            )}
          </div>

          {/* View Details Button */}
          {onViewDetails && (
            <Button
              onClick={() => onViewDetails(campaign)}
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              size="sm"
            >
              View Details
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}