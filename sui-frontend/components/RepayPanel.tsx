'use client'

import { useState } from 'react'
import { useLendingProtocol } from '@/hooks/useLendingProtocol'
import { useCurrentAccount } from '@mysten/dapp-kit'

interface RepayPanelProps {
  currentDebt: number
}

export function RepayPanel({ currentDebt }: RepayPanelProps) {
  const [amount, setAmount] = useState('')
  const [paymentObjectId, setPaymentObjectId] = useState('')
  const { repayLoan, isLoading } = useLendingProtocol()
  const account = useCurrentAccount()

  const handleRepay = async () => {
    if (!paymentObjectId) {
      alert('Please enter the payment object ID')
      return
    }

    try {
      await repayLoan(paymentObjectId)
      alert('Repayment successful!')
      setAmount('')
      setPaymentObjectId('')
    } catch (error) {
      console.error('Repayment failed:', error)
      alert('Repayment failed: ' + (error as Error).message)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">Repay Loan</h2>

      <div className="space-y-4">
        <div className="bg-yellow-50 p-3 rounded">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Current Debt:</span>
            <span className="font-semibold text-red-600">
              ${currentDebt.toFixed(2)} SUSD
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount to Repay (SUSD)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.0"
            step="0.01"
            max={currentDebt}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SUSD Coin Object ID
          </label>
          <input
            type="text"
            value={paymentObjectId}
            onChange={(e) => setPaymentObjectId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0x..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the object ID of your SUSD coins to repay
          </p>
        </div>

        <button
          onClick={handleRepay}
          disabled={!account || isLoading || currentDebt === 0}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Processing...' : 'Repay'}
        </button>
      </div>
    </div>
  )
}