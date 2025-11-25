"use client"

import { useState } from "react"
import { useWeb3 } from "@/lib/web3"
import { useContract } from "@/hooks/use-contract"
import { campaignArchiveService } from "@/lib/supabase-campaigns"
import { CONTRACT_CATEGORIES } from "@/lib/contract"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw, CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function SyncPage() {
  const { account, isConnected } = useWeb3()
  const { getCampaigns } = useContract()
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{
    synced: number
    skipped: number
    failed: number
    total: number
  } | null>(null)

  const handleSync = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }

    setSyncing(true)
    setResult(null)

    try {
      console.log("🔄 Starting campaign sync to Supabase...\n")
      
      // Get campaigns from blockchain
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
          
          const archiveResult = await campaignArchiveService.archiveCampaign({
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
          
          if (archiveResult) {
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
      
      setResult({ synced, skipped, failed, total: campaigns.length })
      console.log("\n📊 Sync Summary:", { synced, skipped, failed, total: campaigns.length })
    } catch (error: any) {
      console.error("❌ Sync failed:", error)
      alert(`Sync failed: ${error.message}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Sync Campaigns to Archive
            </CardTitle>
            <CardDescription>
              Sync all campaigns from the blockchain to Supabase archive database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span>Please connect your wallet to sync campaigns</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleSync}
              disabled={syncing || !isConnected}
              className="w-full"
              size="lg"
            >
              {syncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing Campaigns...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync All Campaigns
                </>
              )}
            </Button>

            {result && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-3">Sync Results</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Campaigns:</span>
                      <span className="font-medium">{result.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Synced:
                      </span>
                      <span className="font-medium text-green-600">{result.synced}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        Skipped:
                      </span>
                      <span className="font-medium text-yellow-600">{result.skipped}</span>
                    </div>
                    {result.failed > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-600" />
                          Failed:
                        </span>
                        <span className="font-medium text-red-600">{result.failed}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Fetches all campaigns from the blockchain</li>
                <li>Checks which campaigns are already archived</li>
                <li>Archives only new campaigns to Supabase</li>
                <li>Skips campaigns that already exist in the archive</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}

