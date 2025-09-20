'use client'

import { useState } from 'react'
import { useLendingProtocol } from '@/hooks/useLendingProtocol'
import { useCurrentAccount } from '@mysten/dapp-kit'

export function DepositPanel() {
  const [amount, setAmount] = useState('')
  const { depositSui, isLoading } = useLendingProtocol()
  const account = useCurrentAccount()

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      // Convert SUI to MIST (1 SUI = 10^9 MIST)
      const amountInMist = (parseFloat(amount) * 1e9).toString()
      await depositSui(amountInMist)
      alert('Deposit successful!')
      setAmount('')
    } catch (error) {
      console.error('Deposit failed:', error)
      alert('Deposit failed: ' + (error as Error).message)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Deposit SUI</h2>

      <div className="space-y-4">
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
          />
        </div>

        <div className="text-sm text-gray-600">
          <p>• 50% will be staked for 5% APY</p>
          <p>• 50% will be used for short position hedging</p>
        </div>

        <button
          onClick={handleDeposit}
          disabled={!account || isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Processing...' : 'Deposit'}
        </button>

        {!account && (
          <p className="text-sm text-red-600 text-center">
            Please connect your wallet first
          </p>
        )}
      </div>
    </div>
  )
}