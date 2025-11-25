"use client"

import { useState } from "react"
import { useWeb3 } from "@/lib/web3"
import { useContract } from "@/hooks/use-contract"
import { campaignArchiveService } from "@/lib/supabase-campaigns"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Wrench } from "lucide-react"

export default function FixArchivePage() {
  const { account, isConnected } = useWeb3()
  const { getCampaigns } = useContract()
  const [fixing, setFixing] = useState(false)
  const [result, setResult] = useState<string>("")

  const handleFixNullValues = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first")
      return
    }

    setFixing(true)
    setResult("")

    try {
      const campaigns = await getCampaigns()
      let fixed = 0
      let errors = 0

      for (const campaign of campaigns) {
        try {
          // Get the archived campaign
          const archived = await campaignArchiveService.getAllArchivedCampaigns()
          const existing = archived.find(c => c.campaign_id === campaign.id)

          if (!existing) {
            console.log(`Campaign ${campaign.id} not in archive, skipping...`)
            continue
          }

          // Check if transaction_hash is null and we have a way to get it
          // For now, we'll just update claimed_at if campaign is claimed
          if (Number(campaign.state) === 3 && !existing.claimed_at) {
            const updateResult = await campaignArchiveService.updateCampaignArchive(campaign.id, {
              state: 3,
              isClaimed: true,
              claimedAt: new Date()
            })
            
            if (updateResult) {
              fixed++
              console.log(`✅ Fixed campaign ${campaign.id}`)
            }
          }
        } catch (error: any) {
          console.error(`Error fixing campaign ${campaign.id}:`, error)
          errors++
        }
      }

      setResult(`Fixed: ${fixed}, Errors: ${errors}, Total: ${campaigns.length}`)
    } catch (error: any) {
      setResult(`Error: ${error.message}`)
    } finally {
      setFixing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-6 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Fix Null Values in Archive
            </CardTitle>
            <CardDescription>
              Update existing campaigns to populate claimed_at and transaction_hash where missing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isConnected && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">Please connect your wallet</p>
              </div>
            )}

            <Button
              onClick={handleFixNullValues}
              disabled={fixing || !isConnected}
              className="w-full"
              size="lg"
            >
              {fixing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wrench className="mr-2 h-4 w-4" />
                  Fix Null Values
                </>
              )}
            </Button>

            {result && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">Result:</p>
                <p className="text-sm text-muted-foreground">{result}</p>
              </div>
            )}

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Note:</h4>
              <p className="text-sm text-blue-800">
                This will update campaigns that are claimed but missing claimed_at values.
                Transaction hashes from past transactions cannot be retrieved automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}

