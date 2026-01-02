"use client"

import React, { useCallback } from "react"

export function useFormatting() {
  const formatWeiToEth = useCallback((wei: bigint | string): string => {
    const weiBigInt = typeof wei === 'string' ? BigInt(wei) : wei
    const eth = Number(weiBigInt) / 1e18
    return eth.toFixed(4)
  }, [])

  const formatEthToWei = useCallback((eth: string | number): bigint => {
    const ethNumber = typeof eth === 'string' ? parseFloat(eth) : eth
    return BigInt(Math.floor(ethNumber * 1e18))
  }, [])

  const formatAddress = useCallback((address: string): string => {
    if (!address) return ""
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [])

  const formatTimestamp = useCallback((timestamp: bigint | number): string => {
    const date = new Date(Number(timestamp) * 1000)
    return date.toLocaleDateString()
  }, [])

  const formatTimestampToDate = useCallback((timestamp: bigint | number): Date => {
    return new Date(Number(timestamp) * 1000)
  }, [])

  const isCampaignEnded = useCallback((deadline: bigint | number): boolean => {
    return Date.now() / 1000 > Number(deadline)
  }, [])

  const isCampaignSuccessful = useCallback((amountCollected: bigint, target: bigint): boolean => {
    return amountCollected >= target
  }, [])

  const getProgressPercentage = useCallback((amountCollected: bigint, target: bigint): number => {
    if (target === 0n) return 0
    return Math.min(100, (Number(amountCollected) / Number(target)) * 100)
  }, [])

  const getTimeRemaining = useCallback((deadline: bigint | number): string => {
    const now = Date.now() / 1000
    const deadlineTime = Number(deadline)
    const timeLeft = deadlineTime - now

    if (timeLeft <= 0) return "Ended"

    const days = Math.floor(timeLeft / 86400)
    const hours = Math.floor((timeLeft % 86400) / 3600)
    const minutes = Math.floor((timeLeft % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }, [])

  return {
    formatWeiToEth,
    formatEthToWei,
    formatAddress,
    formatTimestamp,
    formatTimestampToDate,
    isCampaignEnded,
    isCampaignSuccessful,
    getProgressPercentage,
    getTimeRemaining,
  }
}

