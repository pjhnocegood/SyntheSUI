'use client'

import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { lendingProtocol } from '@/lib/sui-client'
import { useState } from 'react'

export function useLendingProtocol() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const [isLoading, setIsLoading] = useState(false)

  const depositSui = async (amount: string) => {
    if (!account) throw new Error('Wallet not connected')

    setIsLoading(true)
    try {
      const tx = new Transaction()
      lendingProtocol.depositSui(tx, amount)

      const result = await signAndExecuteTransaction({
        transaction: tx,
      })

      await client.waitForTransaction({
        digest: result.digest,
      })

      return result
    } finally {
      setIsLoading(false)
    }
  }

  const borrowStablecoin = async (amount: string) => {
    if (!account) throw new Error('Wallet not connected')

    setIsLoading(true)
    try {
      const tx = new Transaction()
      lendingProtocol.borrowStablecoin(tx, amount)

      const result = await signAndExecuteTransaction({
        transaction: tx,
      })

      await client.waitForTransaction({
        digest: result.digest,
      })

      return result
    } finally {
      setIsLoading(false)
    }
  }

  const repayLoan = async (paymentObjectId: string) => {
    if (!account) throw new Error('Wallet not connected')

    setIsLoading(true)
    try {
      const tx = new Transaction()
      lendingProtocol.repayLoan(tx, paymentObjectId)

      const result = await signAndExecuteTransaction({
        transaction: tx,
      })

      await client.waitForTransaction({
        digest: result.digest,
      })

      return result
    } finally {
      setIsLoading(false)
    }
  }

  const withdrawCollateral = async (amount: string) => {
    if (!account) throw new Error('Wallet not connected')

    setIsLoading(true)
    try {
      const tx = new Transaction()
      lendingProtocol.withdrawCollateral(tx, amount)

      const result = await signAndExecuteTransaction({
        transaction: tx,
      })

      await client.waitForTransaction({
        digest: result.digest,
      })

      return result
    } finally {
      setIsLoading(false)
    }
  }

  return {
    depositSui,
    borrowStablecoin,
    repayLoan,
    withdrawCollateral,
    isLoading,
  }
}