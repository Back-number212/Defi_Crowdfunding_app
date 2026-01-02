"use client"

import { useState, useEffect } from "react"
import { useWeb3 } from "@/lib/web3"
import { useContract } from "@/hooks/use-contract"
import { useFormatting } from "@/hooks/use-formatting"
import { addCategoriesToCampaigns, type FrontendCampaign } from "@/lib/frontend-campaign"
import { CONTRACT_CATEGORIES } from "@/lib/contract"
import { Header } from "@/components/header"
import { CategoryBar } from "@/components/category-bar"
import { ProjectCard } from "@/components/project-card"
import { CampaignDetailModal } from "@/components/campaign-detail-modal"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, TrendingUp, Users, Clock, Star, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { account, isConnected, isCorrectNetwork } = useWeb3()
  const { getCampaigns, claimFunds, getRefund, loading: contractLoading } = useContract()
  const { formatWeiToEth, getProgressPercentage, getTimeRemaining, isCampaignEnded, isCampaignSuccessful } = useFormatting()
  
  const [campaigns, setCampaigns] = useState<FrontendCampaign[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<FrontendCampaign[]>([])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [campaignDetailOpen, setCampaignDetailOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<FrontendCampaign | null>(null)

  const categories = ["All", ...CONTRACT_CATEGORIES]

  useEffect(() => {
    loadCampaigns()
  }, [isConnected])

  useEffect(() => {
    let filtered = campaigns

    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(c => c.category?.toLowerCase() === selectedCategory.toLowerCase())
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredCampaigns(filtered)
  }, [selectedCategory, searchQuery, campaigns])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const campaignsData = await getCampaigns()
      const campaignsWithCategories = addCategoriesToCampaigns(campaignsData)
      // Sort by campaign ID descending (newest first)
      const sortedCampaigns = [...campaignsWithCategories].sort((a, b) => b.id - a.id)
      
      // Debug: Log campaign amounts
      console.log("📊 Campaigns loaded:", sortedCampaigns.length)
      sortedCampaigns.forEach(c => {
        const amount = typeof c.amountCollected === 'bigint' ? c.amountCollected : BigInt(c.amountCollected.toString())
        const target = typeof c.target === 'bigint' ? c.target : BigInt(c.target.toString())
        const isClaimed = Number(c.state) === 3
        const displayAmount = isClaimed ? target : amount
        console.log(`Campaign ${c.id}: ${formatWeiToEth(displayAmount)} ETH (state: ${c.state}, claimed: ${isClaimed})`)
      })
      
      setCampaigns(sortedCampaigns)
    } catch (error) {
      console.error("Failed to load campaigns:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDonate = async (campaignId: number) => {
    const campaign = campaigns.find(c => c.id === campaignId)
    if (campaign) {
      setSelectedCampaign(campaign)
      setCampaignDetailOpen(true)
    }
  }

  const handleRefund = async (campaignId: number) => {
    try {
      await getRefund(campaignId)
      await loadCampaigns()
    } catch (error) {
      console.error("Failed to get refund:", error)
    }
  }

  const handleClaim = async (campaignId: number) => {
    try {
      await claimFunds(campaignId)
      await loadCampaigns()
    } catch (error) {
      console.error("Failed to claim funds:", error)
    }
  }

  const handleViewDetails = (campaign: FrontendCampaign) => {
    setSelectedCampaign(campaign)
    setCampaignDetailOpen(true)
  }

  const stats = {
    totalCampaigns: campaigns.length,
    totalRaised: campaigns.reduce((sum, c) => {
      const target = typeof c.target === 'bigint' ? c.target : BigInt(c.target.toString())
      const amountCollected = typeof c.amountCollected === 'bigint' ? c.amountCollected : BigInt(c.amountCollected.toString())
      const isClaimed = Number(c.state) === 3
      
      // For claimed campaigns, if amountCollected is 0, use target
      // But if amountCollected > 0 (campaign exceeded target), use amountCollected
      // For non-claimed campaigns, always use amountCollected (even if it exceeds target)
      let amount: bigint
      if (isClaimed && amountCollected === BigInt(0)) {
        // Campaign was claimed and amountCollected was reset to 0, use target
        amount = target
      } else {
        // Use amountCollected (handles both normal and exceeded cases)
        amount = amountCollected
      }
      
      return sum + amount
    }, BigInt(0)),
    activeCampaigns: campaigns.filter(c => !isCampaignEnded(c.deadline)).length,
    successfulCampaigns: campaigns.filter(c => {
      // Include claimed campaigns (state === 3) in successful count
      if (Number(c.state) === 3) return true
      const amount = typeof c.amountCollected === 'bigint' ? c.amountCollected : BigInt(c.amountCollected.toString())
      const target = typeof c.target === 'bigint' ? c.target : BigInt(c.target.toString())
      return isCampaignSuccessful(amount, target)
    }).length
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="relative w-full overflow-hidden mb-20">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-600 opacity-90"></div>
          {/* Decorative geometric shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 left-10 w-20 h-20 border-4 border-blue-300 rounded-full opacity-30"></div>
            <div className="absolute top-32 left-32 w-16 h-16 border-4 border-blue-300 transform rotate-45 opacity-30"></div>
            <div className="absolute bottom-20 left-20 w-24 h-24 border-4 border-blue-300 rounded-full opacity-30"></div>
            <div className="absolute top-1/2 right-20 w-20 h-20 border-4 border-blue-300 transform rotate-12 opacity-30" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
            <div className="absolute top-20 right-32 w-16 h-16 border-4 border-blue-300 rounded-full opacity-30"></div>
            <div className="absolute bottom-32 right-10 w-12 h-12 border-4 border-blue-300 transform rotate-45 opacity-30"></div>
          </div>
          <div className="relative container mx-auto px-6 py-24 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
                CrowdFundX
              </h1>
              <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                Fund your dreams, support amazing projects. Join the decentralized crowdfunding revolution.
              </p>
              
              {/* Search Bar */}
              <div className="max-w-md mx-auto relative mb-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base border-2 border-white/30 focus:border-white/50 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder:text-white/70"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Total Campaigns</p>
                    <p className="text-2xl font-semibold text-foreground">{stats.totalCampaigns}</p>
                  </div>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Total Raised</p>
                    <p className="text-2xl font-semibold text-foreground">{formatWeiToEth(stats.totalRaised)} ETH</p>
                  </div>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Active</p>
                    <p className="text-2xl font-semibold text-foreground">{stats.activeCampaigns}</p>
                  </div>
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-border bg-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-medium">Successful</p>
                    <p className="text-2xl font-semibold text-foreground">{stats.successfulCampaigns}</p>
                  </div>
                  <Star className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Category Bar */}
        <section className="mb-20">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-3">Categories</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Discover campaigns across various categories
            </p>
          </div>
          <CategoryBar 
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            campaigns={campaigns}
          />
        </section>

        {/* Projects Section */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Featured Projects</h2>
              <p className="text-muted-foreground">
                Discover amazing campaigns that need your support
              </p>
            </div>
            <Link href="/creator">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Create Campaign
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading campaigns...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <Card className="p-12 text-center border border-border bg-card">
              <CardContent>
                <div className="max-w-sm mx-auto">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No campaigns found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search terms or category filter.
                  </p>
                  <Button variant="outline" onClick={() => {setSearchQuery(""); setSelectedCategory("All")}}>
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCampaigns.map((campaign) => (
                <ProjectCard
                  key={campaign.id}
                  campaign={campaign}
                  onDonate={() => handleDonate(campaign.id)}
                  onRefund={() => handleRefund(campaign.id)}
                  onClaim={() => handleClaim(campaign.id)}
                  onViewDetails={() => handleViewDetails(campaign)}
                  isOwner={account === campaign.owner}
                />
              ))}
            </div>
          )}
        </section>

        {/* About Section */}
        <section className="mb-20">
          <div className="relative w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-600 opacity-90"></div>
            {/* Decorative geometric shapes */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-10 left-10 w-20 h-20 border-4 border-blue-300 rounded-full opacity-30"></div>
              <div className="absolute top-32 left-32 w-16 h-16 border-4 border-blue-300 transform rotate-45 opacity-30"></div>
              <div className="absolute bottom-20 left-20 w-24 h-24 border-4 border-blue-300 rounded-full opacity-30"></div>
              <div className="absolute top-1/2 right-20 w-20 h-20 border-4 border-blue-300 transform rotate-12 opacity-30" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
              <div className="absolute top-20 right-32 w-16 h-16 border-4 border-blue-300 rounded-full opacity-30"></div>
              <div className="absolute bottom-32 right-10 w-12 h-12 border-4 border-blue-300 transform rotate-45 opacity-30"></div>
            </div>
            <div className="relative container mx-auto px-6 py-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-semibold text-white mb-6 drop-shadow-lg">
                    About CrowdFundX
                  </h2>
                  <p className="text-lg text-white/90 mb-8 leading-relaxed drop-shadow-md">
                    We're revolutionizing crowdfunding through blockchain technology, empowering creators and innovators to bring their dreams to life with transparent, secure, and global funding solutions.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-6 drop-shadow-lg">Why Choose CrowdFundX?</h3>
                  <p className="text-white/90 mb-6 leading-relaxed drop-shadow-md">
                    We combine cutting-edge blockchain technology with user-friendly design to create the ultimate crowdfunding experience.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-white mb-1 drop-shadow-md">Decentralized & Secure</h4>
                        <p className="text-white/80 text-sm drop-shadow-sm">No central authority, your funds are always secure</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-white mb-1 drop-shadow-md">Transparent Transactions</h4>
                        <p className="text-white/80 text-sm drop-shadow-sm">All transactions are recorded on the blockchain</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-white mb-1 drop-shadow-md">Global Accessibility</h4>
                        <p className="text-white/80 text-sm drop-shadow-sm">Support and launch projects from anywhere</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full mt-2"></div>
                      <div>
                        <h4 className="font-medium text-white mb-1 drop-shadow-md">Low Fees & Fast Processing</h4>
                        <p className="text-white/80 text-sm drop-shadow-sm">Minimal fees with instant transaction processing</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <CampaignDetailModal
          campaign={selectedCampaign}
          isOpen={campaignDetailOpen}
          onClose={() => setCampaignDetailOpen(false)}
          isOwner={account === selectedCampaign.owner}
        />
      )}
    </div>
  )
}