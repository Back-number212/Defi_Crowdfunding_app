"use client"

import { useState } from "react"
import { useWeb3 } from "@/lib/web3"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Wallet, 
  CheckCircle, 
  AlertTriangle, 
  ExternalLink,
  Copy,
  LogOut
} from "lucide-react"

export function ModernWalletConnect() {
  const { 
    account, 
    isConnected, 
    isCorrectNetwork, 
    connectWallet, 
    disconnectWallet, 
    switchToSepolia 
  } = useWeb3()
  
  const [isOpen, setIsOpen] = useState(false)

  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (!isConnected) {
    return (
      <>
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md bg-card text-foreground border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground text-xl font-semibold">
                Sign in
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Social Login Options */}
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="bg-background hover:bg-muted text-foreground border-border"
                >
                  <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-yellow-500 rounded flex items-center justify-center text-white font-bold text-xs">
                    G
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-background hover:bg-muted text-foreground border-border"
                >
                  <div className="w-5 h-5 bg-muted rounded flex items-center justify-center">
                    <div className="w-3 h-3 bg-background rounded-sm"></div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-background hover:bg-muted text-foreground border-border"
                >
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">
                    f
                  </div>
                </Button>
              </div>

              {/* Traditional Login Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer">
                  <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  </div>
                  <span className="text-foreground">Email address</span>
                  <div className="ml-auto">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer">
                  <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  </div>
                  <span className="text-foreground">Phone number</span>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg hover:bg-muted/80 cursor-pointer">
                  <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                    <div className="w-2 h-2 bg-foreground rounded-full"></div>
                  </div>
                  <span className="text-foreground">Passkey</span>
                </div>
              </div>

              {/* Separator */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-muted text-muted-foreground">OR</span>
                </div>
              </div>

              {/* Connect Wallet Option */}
              <Button
                onClick={() => {
                  connectWallet()
                  setIsOpen(false)
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-3 h-auto"
              >
                <div className="flex items-center space-x-3">
                  <Wallet className="h-5 w-5" />
                  <span className="text-white font-medium">Connect a Wallet</span>
                </div>
              </Button>
            </div>

            <div className="text-center text-gray-400 text-sm">
              Powered by <span className="text-blue-400 font-semibold">thirdweb</span>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between">
            <span>
              Please switch to Sepolia testnet to use this application
            </span>
            <Button 
              onClick={switchToSepolia} 
              size="sm" 
              variant="outline"
              className="ml-4"
            >
              Switch Network
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="flex items-center gap-1">
        <CheckCircle className="h-3 w-3 text-green-600" />
        Connected
      </Badge>
      <Badge variant="outline">
        {formatAddress(account!)}
      </Badge>
      <Badge variant="outline">
        Sepolia
      </Badge>
      <Button
        onClick={disconnectWallet}
        size="sm"
        variant="ghost"
        className="h-8 w-8 p-0"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
