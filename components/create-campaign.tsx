"use client"

import { useState } from "react"
import { useContract } from "@/hooks/use-contract"
import { useWeb3 } from "@/lib/web3"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, X, Loader2, Upload, Calendar, DollarSign, Image as ImageIcon } from "lucide-react"
import { CONTRACT_CATEGORIES } from "@/lib/contract"

const categories = CONTRACT_CATEGORIES

export function CreateCampaign() {
  const { createCampaign, loading, error, clearError } = useContract()
  const { isConnected, isCorrectNetwork, connectWallet, switchToSepolia } = useWeb3()
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    target: "",
    deadline: "",
    image: "",
    category: "",
  })
  
  const [rewardTiers, setRewardTiers] = useState([
    { description: "", requiredAmount: "" }
  ])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) clearError()
  }

  const handleTierChange = (index: number, field: string, value: string) => {
    setRewardTiers(prev => prev.map((tier, i) => 
      i === index ? { ...tier, [field]: value } : tier
    ))
  }

  const addTier = () => {
    setRewardTiers(prev => [...prev, { description: "", requiredAmount: "" }])
  }

  const removeTier = (index: number) => {
    if (rewardTiers.length > 1) {
      setRewardTiers(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || !isCorrectNetwork) {
      return
    }

    const deadline = Math.floor(new Date(formData.deadline).getTime() / 1000)
    
    const result = await createCampaign({
      title: formData.title,
      description: formData.description,
      target: formData.target,
      deadline,
      image: formData.image,
      category: formData.category,
      tierDescriptions: rewardTiers.map(tier => tier.description),
      tierRequiredAmounts: rewardTiers.map(tier => tier.requiredAmount),
      tierLimits: rewardTiers.map(() => "0"), // Not used in new contract
    })

    if (result) {
      // Reset form
      setFormData({
        title: "",
        description: "",
        target: "",
        deadline: "",
        image: "",
        category: "",
      })
      setRewardTiers([{ description: "", requiredAmount: "" }])
    }
  }

  if (!isConnected || !isCorrectNetwork) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ImageIcon className="h-6 w-6 text-blue-600" />
            <span>Create Campaign</span>
          </CardTitle>
          <CardDescription>
            {!isConnected 
              ? "Connect your wallet to create a campaign"
              : "Switch to Sepolia testnet to create a campaign"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isConnected ? (
            <Button onClick={connectWallet} className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
              <Upload className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          ) : (
            <Button onClick={switchToSepolia} className="w-full bg-gradient-to-r from-orange-500 to-red-500">
              <Upload className="mr-2 h-4 w-4" />
              Switch to Sepolia Testnet
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-2xl">
          <ImageIcon className="h-7 w-7 text-blue-600" />
          <span>Create New Campaign</span>
        </CardTitle>
        <CardDescription>
          Launch your crowdfunding campaign and bring your ideas to life
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <ImageIcon className="mr-2 h-5 w-5 text-blue-600" />
              Campaign Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Campaign Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter your campaign title"
                  required
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-500">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your campaign, goals, and what makes it special..."
                rows={4}
                required
                className="border-blue-200 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Campaign Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => handleInputChange("image", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Funding Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-green-600" />
              Funding Goals
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Funding Target (ETH) *</Label>
                <Input
                  id="target"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.target}
                  onChange={(e) => handleInputChange("target", e.target.value)}
                  placeholder="10.0"
                  required
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadline">Campaign Deadline *</Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => handleInputChange("deadline", e.target.value)}
                  required
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Reward Tiers */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Calendar className="mr-2 h-5 w-5 text-purple-600" />
                Reward Tiers
              </h3>
              <Button
                type="button"
                onClick={addTier}
                variant="outline"
                size="sm"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tier
              </Button>
            </div>
            
            <div className="space-y-4">
              {rewardTiers.map((tier, index) => (
                <div key={index} className="p-4 border border-purple-200 rounded-lg bg-purple-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-purple-700">Tier {index + 1}</span>
                    {rewardTiers.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeTier(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Reward Description</Label>
                      <Input
                        value={tier.description}
                        onChange={(e) => handleTierChange(index, "description", e.target.value)}
                        placeholder="e.g., Early bird access, exclusive merchandise"
                        className="border-purple-200 focus:border-purple-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Required Amount (ETH)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.requiredAmount}
                        onChange={(e) => handleTierChange(index, "requiredAmount", e.target.value)}
                        placeholder="0.1"
                        className="border-purple-200 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  title: "",
                  description: "",
                  target: "",
                  deadline: "",
                  image: "",
                  category: "",
                })
                setRewardTiers([{ description: "", requiredAmount: "" }])
                clearError()
              }}
              className="border-gray-300"
            >
              Reset
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Campaign...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}