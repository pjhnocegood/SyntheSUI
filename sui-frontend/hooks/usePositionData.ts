'use client'

import { useQuery } from '@tanstack/react-query'
import { useSuiClient, useCurrentAccount } from '@mysten/dapp-kit'
import { CONTRACT_ADDRESSES, PRECISION } from '@/lib/constants'

interface Position {
  collateralAmount: number
  borrowedAmount: number
  stakingAmount: number
  shortPositionAmount: number
  healthFactor: number
  ltv: number
}

export function usePositionData() {
  const client = useSuiClient()
  const account = useCurrentAccount()

  return useQuery({
    queryKey: ['position', account?.address],
    queryFn: async () => {
      if (!account) return null

      try {
        // For now, return mock data since we need to implement proper position tracking
        // In a real implementation, you'd call the contract's position query function

        // Check if user has any position by trying to get the pool object
        const poolObject = await client.getObject({
          id: CONTRACT_ADDRESSES.LENDING_POOL_WITH_STAKING,
          options: { showContent: true },
        })

        if (poolObject.data?.content) {
          // For testing purposes, return simulated position data
          // This would be replaced with actual contract state parsing
          const mockCollateralAmount = 1.8 // SUI (from our recent test)
          const mockBorrowedAmount = 0.0 // SUSD
          const mockSuiPrice = 0.5 // USD per SUI

          const collateralValue = mockCollateralAmount * mockSuiPrice
          const ltv = collateralValue > 0 ? (mockBorrowedAmount / collateralValue) * 100 : 0
          const healthFactor = mockBorrowedAmount > 0 ? (collateralValue * 100) / mockBorrowedAmount : 100

          return {
            collateralAmount: mockCollateralAmount,
            borrowedAmount: mockBorrowedAmount,
            stakingAmount: mockCollateralAmount * 0.9, // 90% staked
            shortPositionAmount: mockCollateralAmount * 0.1, // 10% short
            healthFactor,
            ltv,
            collateralValue,
            suiPrice: mockSuiPrice,
          }
        }

        return null
      } catch (error) {
        console.error('Error fetching position:', error)
        return null
      }
    },
    enabled: !!account,
    refetchInterval: 5000, // Refetch every 5 seconds
  })
}

export function useSuiPrice() {
  const client = useSuiClient()

  return useQuery({
    queryKey: ['sui-price'],
    queryFn: async () => {
      try {
        const priceData = await client.getObject({
          id: CONTRACT_ADDRESSES.PRICE_ORACLE,
          options: { showContent: true },
        })

        const suiPrice = (priceData.data?.content as any)?.fields?.sui_price || 5000
        return suiPrice / PRECISION // Convert to USD
      } catch (error) {
        console.error('Error fetching SUI price:', error)
        return 0.5 // Default fallback price
      }
    },
    refetchInterval: 10000, // Update every 10 seconds
  })
}

export function useProtocolStats() {
  const client = useSuiClient()

  return useQuery({
    queryKey: ['protocol-stats'],
    queryFn: async () => {
      try {
        // Try to get the staking pool object to calculate stats
        const poolObject = await client.getObject({
          id: CONTRACT_ADDRESSES.LENDING_POOL_WITH_STAKING,
          options: { showContent: true },
        })

        if (poolObject.data?.content) {
          // For testing purposes, return mock protocol stats
          // This would be replaced with actual contract state parsing
          return {
            totalValueLocked: 950, // Mock TVL in USD (1.8 SUI * $0.5 + others)
            totalBorrowed: 0, // Mock borrowed amount
            utilizationRate: 0, // Mock utilization rate
          }
        }

        return {
          totalValueLocked: 0,
          totalBorrowed: 0,
          utilizationRate: 0,
        }
      } catch (error) {
        console.error('Error fetching protocol stats:', error)
        return {
          totalValueLocked: 0,
          totalBorrowed: 0,
          utilizationRate: 0,
        }
      }
    },
    refetchInterval: 15000, // Update every 15 seconds
  })
}