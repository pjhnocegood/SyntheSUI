'use client'

import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { CONTRACT_ADDRESSES, MIN_DEPOSIT_SUI, MIN_BORROW_SUSD } from '@/lib/constants'
import { useState } from 'react'
import {
  suiToMist,
  susdToSmallest,
  validateTokenAmount,
  SUI_DECIMALS,
  SUSD_DECIMALS
} from '@/lib/decimal-utils'

export function useLendingProtocolFixed() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction()
  const [isLoading, setIsLoading] = useState(false)

  // Validate input amount using decimal utils for precision
  const validateAmount = (amount: string, max?: number, tokenType: 'SUI' | 'SUSD' = 'SUI'): string | null => {
    const decimals = tokenType === 'SUI' ? SUI_DECIMALS : SUSD_DECIMALS
    const minAmount = tokenType === 'SUI' ? MIN_DEPOSIT_SUI : MIN_BORROW_SUSD

    // Use decimal-safe validation
    const validation = validateTokenAmount(
      amount,
      decimals,
      minAmount.toString(),
      max?.toString()
    )

    return validation
  }

  const depositSui = async (amount: string) => {
    if (!account) throw new Error('Wallet not connected')

    const validation = validateAmount(amount, undefined, 'SUI')
    if (validation) throw new Error(validation)

    setIsLoading(true)
    try {
      const tx = new Transaction()

      // Convert SUI to MIST using precision-safe conversion
      const amountInMist = suiToMist(amount)

      // Split coins from gas and deposit
      const [depositCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)])

      // Use the new staking-integrated deposit function
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::lending_pool_with_staking::deposit_and_stake_sui`,
        arguments: [
          tx.object(CONTRACT_ADDRESSES.LENDING_POOL_WITH_STAKING),
          tx.object('0x0000000000000000000000000000000000000000000000000000000000000005'), // SuiSystemState
          depositCoin,
        ],
      })

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

  const borrowStablecoin = async (amount: string, maxBorrow: number) => {
    if (!account) throw new Error('Wallet not connected')

    const validation = validateAmount(amount, maxBorrow, 'SUSD')
    if (validation) throw new Error(validation)

    setIsLoading(true)
    try {
      const tx = new Transaction()

      // Convert to smallest unit using precision-safe conversion
      const amountInSmallestUnit = susdToSmallest(amount)

      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::lending_pool::borrow_stablecoin`,
        arguments: [
          tx.object(CONTRACT_ADDRESSES.LENDING_POOL),
          tx.object(CONTRACT_ADDRESSES.PRICE_ORACLE),
          tx.object(CONTRACT_ADDRESSES.STABLECOIN_TREASURY),
          tx.pure.u64(amountInSmallestUnit),
        ],
      })

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

  const repayLoan = async (amount: string) => {
    if (!account) throw new Error('Wallet not connected')

    const validation = validateAmount(amount, undefined, 'SUSD')
    if (validation) throw new Error(validation)

    setIsLoading(true)
    try {
      const tx = new Transaction()

      // Get user's SUSD coins
      const coins = await client.getCoins({
        owner: account.address,
        coinType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::stablecoin::STABLECOIN`,
      })

      if (!coins.data || coins.data.length === 0) {
        throw new Error('No SUSD coins found in wallet')
      }

      // Convert amount to smallest unit using precision-safe conversion
      const amountInSmallestUnit = susdToSmallest(amount)

      // Calculate total available
      const totalAvailable = coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), BigInt(0))

      if (BigInt(amountInSmallestUnit) > totalAvailable) {
        throw new Error('Insufficient SUSD balance')
      }

      // Merge coins if multiple
      let paymentCoin
      if (coins.data.length > 1) {
        const [firstCoin, ...otherCoins] = coins.data.map(c => tx.object(c.coinObjectId))
        tx.mergeCoins(firstCoin, otherCoins)
        paymentCoin = firstCoin
      } else {
        paymentCoin = tx.object(coins.data[0].coinObjectId)
      }

      // Split exact amount for repayment
      const [repaymentCoin] = tx.splitCoins(paymentCoin, [tx.pure.u64(amountInSmallestUnit)])

      // Call repay function
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::lending_pool::repay_loan`,
        arguments: [
          tx.object(CONTRACT_ADDRESSES.LENDING_POOL),
          tx.object(CONTRACT_ADDRESSES.STABLECOIN_TREASURY),
          repaymentCoin,
        ],
      })

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

  const withdrawCollateral = async (amount: string, maxWithdraw: number) => {
    if (!account) throw new Error('Wallet not connected')

    const validation = validateAmount(amount, maxWithdraw, 'SUI')
    if (validation) throw new Error(validation)

    setIsLoading(true)
    try {
      const tx = new Transaction()

      // Convert SUI to MIST using precision-safe conversion
      const amountInMist = suiToMist(amount)

      // Use the new staking-integrated withdraw function
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::lending_pool_with_staking::unstake_and_withdraw_sui`,
        arguments: [
          tx.object(CONTRACT_ADDRESSES.LENDING_POOL_WITH_STAKING),
          tx.object('0x0000000000000000000000000000000000000000000000000000000000000005'), // SuiSystemState
          tx.pure.u64(amountInMist),
        ],
      })

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

  const liquidatePosition = async (userToLiquidate: string, debtAmount: string) => {
    if (!account) throw new Error('Wallet not connected')

    setIsLoading(true)
    try {
      const tx = new Transaction()

      // Get liquidator's SUSD coins
      const coins = await client.getCoins({
        owner: account.address,
        coinType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::stablecoin::STABLECOIN`,
      })

      if (!coins.data || coins.data.length === 0) {
        throw new Error('No SUSD coins found for liquidation')
      }

      // Convert amount to smallest unit using precision-safe conversion
      const amountInSmallestUnit = susdToSmallest(debtAmount)

      // Prepare payment coin
      let paymentCoin = tx.object(coins.data[0].coinObjectId)
      if (coins.data.length > 1) {
        const otherCoins = coins.data.slice(1).map(c => tx.object(c.coinObjectId))
        tx.mergeCoins(paymentCoin, otherCoins)
      }

      const [liquidationPayment] = tx.splitCoins(paymentCoin, [tx.pure.u64(amountInSmallestUnit)])

      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::lending_pool::liquidate_position`,
        arguments: [
          tx.object(CONTRACT_ADDRESSES.LENDING_POOL),
          tx.object(CONTRACT_ADDRESSES.PRICE_ORACLE),
          tx.object(CONTRACT_ADDRESSES.STAKING_MANAGER),
          tx.object(CONTRACT_ADDRESSES.SHORT_POSITION_MANAGER),
          tx.object(CONTRACT_ADDRESSES.STABLECOIN_TREASURY),
          tx.pure.address(userToLiquidate),
          liquidationPayment,
        ],
      })

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

  // Estimate gas for a transaction
  const estimateGas = async (tx: Transaction) => {
    try {
      const dryRun = await client.dryRunTransactionBlock({
        transactionBlock: await tx.build({ client }),
      })
      return Number(dryRun.effects.gasUsed.computationCost) + Number(dryRun.effects.gasUsed.storageCost)
    } catch (error) {
      console.error('Gas estimation failed:', error)
      return 10000000 // Default gas estimate
    }
  }

  return {
    depositSui,
    borrowStablecoin,
    repayLoan,
    withdrawCollateral,
    liquidatePosition,
    estimateGas,
    isLoading,
    validateAmount,
  }
}