'use client'

import { useState } from 'react'
import { useLendingProtocol } from '@/hooks/useLendingProtocol'
import { useCurrentAccount } from '@mysten/dapp-kit'

interface WithdrawPanelProps {
  availableCollateral: number
  currentDebt: number
}

export function WithdrawPanel({ availableCollateral, currentDebt }: WithdrawPanelProps) {
  const [amount, setAmount] = useState('')
  const { withdrawCollateral, isLoading } = useLendingProtocol()
  const account = useCurrentAccount()

  const canWithdraw = currentDebt === 0

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    if (!canWithdraw) {
      alert('Please repay your loan before withdrawing collateral')
      return
    }

    try {
      // Convert SUI to MIST
      const amountInMist = (parseFloat(amount) * 1e9).toString()
      await withdrawCollateral(amountInMist)
      alert('Withdrawal successful!')
      setAmount('')
    } catch (error) {
      console.error('Withdrawal failed:', error)
      alert('Withdrawal failed: ' + (error as Error).message)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Withdraw Collateral</h2>

      <div className="space-y-4">
        <div className="bg-gray-50 p-3 rounded">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Available Collateral:</span>
            <span className="font-semibold">
              {availableCollateral.toFixed(4)} SUI
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Outstanding Debt:</span>
            <span className={`font-semibold ${currentDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${currentDebt.toFixed(2)}
            </span>
          </div>
        </div>

        {currentDebt > 0 && (
          <div className="bg-red-50 border border-red-200 p-3 rounded">
            <p className="text-sm text-red-700">
              ⚠️ You must repay your loan before withdrawing collateral
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (SUI)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.0"
            step="0.01"
            max={availableCollateral}
            disabled={!canWithdraw}
          />
        </div>

        <div className="text-sm text-gray-600">
          <p>• Includes staking rewards</p>
          <p>• Includes short position P&L</p>
        </div>

        <button
          onClick={handleWithdraw}
          disabled={!account || isLoading || !canWithdraw}
          className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Processing...' : 'Withdraw'}
        </button>
      </div>
    </div>
  )
}