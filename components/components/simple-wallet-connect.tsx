"use client"

import { useWeb3 } from "@/lib/web3"
import { Button } from "@/components/ui/button"

export function SimpleWalletConnect() {
  const { account, connectWallet, disconnectWallet, isCorrectNetwork, switchToSepolia } = useWeb3()

  if (!account) {
    return (
      <Button 
        onClick={connectWallet}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
      >
        Connect Wallet
      </Button>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <Button 
        onClick={switchToSepolia}
        className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200"
      >
        Switch to Sepolia
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-muted-foreground">
        {account.slice(0, 6)}...{account.slice(-4)}
      </div>
      <Button 
        onClick={disconnectWallet}
        variant="outline"
        className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
      >
        Disconnect
      </Button>
    </div>
  )
}
