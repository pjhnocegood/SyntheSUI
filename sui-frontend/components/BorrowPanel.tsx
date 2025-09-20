'use client'

import { useState } from 'react'
import { useLendingProtocol } from '@/hooks/useLendingProtocol'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { MAX_LTV } from '@/lib/constants'

interface BorrowPanelProps {
  collateralValue: number
  currentDebt: number
}

export function BorrowPanel({ collateralValue, currentDebt }: BorrowPanelProps) {
  const [amount, setAmount] = useState('')
  const { borrowStablecoin, isLoading } = useLendingProtocol()
  const account = useCurrentAccount()

  const maxBorrow = (collateralValue * MAX_LTV) / 100 - currentDebt
  const availableToBorrow = maxBorrow > 0 ? maxBorrow : 0

  const handleBorrow = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (parseFloat(amount) > availableToBorrow) {
      alert('Amount exceeds maximum borrowable')
      return
    }

    try {
      // Convert to the smallest unit (assuming 6 decimals for stablecoin)
      const amountInSmallestUnit = (parseFloat(amount) * 1e6).toString()
      await borrowStablecoin(amountInSmallestUnit)
      alert('Borrow successful!')
      setAmount('')
    } catch (error) {
      console.error('Borrow failed:', error)
      alert('Borrow failed: ' + (error as Error).message)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Borrow Stablecoins</h2>

      <div className="space-y-4">
        <div className="bg-gray-50 p-3 rounded">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Collateral Value:</span>
            <span className="font-semibold">${collateralValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Current Debt:</span>
            <span className="font-semibold">${currentDebt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Available to Borrow:</span>
            <span className="font-semibold text-green-600">
              ${availableToBorrow.toFixed(2)}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (SUSD)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.0"
            step="0.01"
            max={availableToBorrow}
          />
          <p className="text-xs text-gray-500 mt-1">
            Max LTV: {MAX_LTV}%
          </p>
        </div>

        <button
          onClick={handleBorrow}
          disabled={!account || isLoading || availableToBorrow === 0}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Processing...' : 'Borrow'}
        </button>
      </div>
    </div>
  )
}