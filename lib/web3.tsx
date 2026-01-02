"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { BrowserProvider, Contract } from "ethers"
import { CONTRACT_ADDRESS, CONTRACT_ABI, SEPOLIA_CHAIN_ID } from "./contract"

interface Web3ContextType {
  account: string | null
  provider: BrowserProvider | null
  contract: Contract | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  switchToSepolia: () => Promise<void>
  isConnected: boolean
  chainId: number | null
  isCorrectNetwork: boolean
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  provider: null,
  contract: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchToSepolia: async () => {},
  isConnected: false,
  chainId: null,
  isCorrectNetwork: false,
})

export const useWeb3 = () => useContext(Web3Context)

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null)
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [contract, setContract] = useState<Contract | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(false)

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        // Request account access
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        })
        
        if (accounts.length === 0) {
          throw new Error("No accounts found")
        }

        const browserProvider = new BrowserProvider(window.ethereum)
        const network = await browserProvider.getNetwork()
        const signer = await browserProvider.getSigner()

        setProvider(browserProvider)
        setAccount(accounts[0])
        setChainId(Number(network.chainId))
        const isCorrect = Number(network.chainId) === SEPOLIA_CHAIN_ID
        setIsCorrectNetwork(isCorrect)
        
        // Debug logging
        console.log("Wallet connection debug:", {
          account: accounts[0],
          chainId: Number(network.chainId),
          expectedChainId: SEPOLIA_CHAIN_ID,
          isCorrectNetwork: isCorrect
        })

        const contractInstance = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
        setContract(contractInstance)
      } catch (error) {
        console.error("Error connecting wallet:", error)
        alert(`Failed to connect wallet: ${error.message}`)
      }
    } else {
      alert("Please install MetaMask or another Ethereum wallet!")
    }
  }

  const switchToSepolia = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        console.log("Attempting to switch to Sepolia...")
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}` }],
        })
        console.log("Successfully switched to Sepolia")
        
        // Refresh the connection after switching
        setTimeout(() => {
          connectWallet()
        }, 1000)
        
      } catch (error: any) {
        console.log("Error switching to Sepolia:", error)
        // If the chain doesn't exist, add it
        if (error.code === 4902) {
          try {
            console.log("Adding Sepolia network...")
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
                  chainName: "Sepolia Test Network",
                  nativeCurrency: {
                    name: "SepoliaETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["https://sepolia.infura.io/v3/"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io/"],
                },
              ],
            })
            console.log("Successfully added Sepolia network")
            
            // Try to connect again after adding the network
            setTimeout(() => {
              connectWallet()
            }, 1000)
            
          } catch (addError: any) {
            console.error("Error adding Sepolia network:", addError)
            alert(`Failed to add Sepolia network: ${addError.message}`)
          }
        } else {
          console.error("Error switching to Sepolia:", error)
          alert(`Failed to switch to Sepolia: ${error.message}`)
        }
      }
    }
  }

  const disconnectWallet = () => {
    setAccount(null)
    setProvider(null)
    setContract(null)
    setChainId(null)
    setIsCorrectNetwork(false)
  }

  useEffect(() => {
    if (typeof window.ethereum !== "undefined") {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0])
        } else {
          disconnectWallet()
        }
      })

      window.ethereum.on("chainChanged", (chainId: string) => {
        const newChainId = parseInt(chainId, 16)
        setChainId(newChainId)
        const isCorrect = newChainId === SEPOLIA_CHAIN_ID
        setIsCorrectNetwork(isCorrect)
        
        // Debug logging
        console.log("Chain changed debug:", {
          newChainId,
          expectedChainId: SEPOLIA_CHAIN_ID,
          isCorrectNetwork: isCorrect
        })
        // Don't reload the page, just update the state
      })
    }
  }, [])

  return (
    <Web3Context.Provider
      value={{
        account,
        provider,
        contract,
        connectWallet,
        disconnectWallet,
        switchToSepolia,
        isConnected: !!account,
        chainId,
        isCorrectNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}
