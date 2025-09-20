'use client'

import { useState, useEffect } from 'react'
import { useLendingProtocolFixed } from '@/hooks/useLendingProtocolFixed'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { GAS_RESERVE_SUI } from '@/lib/constants'
import { calculateMaxWithGasReserve, suiToMist } from '@/lib/decimal-utils'
import { useSuiPrice } from '@/hooks/usePositionData'

interface DepositPanelFixedProps {
  currentCollateral?: number
  currentDebt?: number
}

export function DepositPanelFixed({ currentCollateral = 0, currentDebt = 0 }: DepositPanelFixedProps) {
  const [amount, setAmount] = useState('')
  const [balance, setBalance] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [estimatedGas, setEstimatedGas] = useState(0)

  const { depositSui, isLoading, validateAmount, estimateGas } = useLendingProtocolFixed()
  const account = useCurrentAccount()
  const client = useSuiClient()
  const { data: suiPrice = 0.5 } = useSuiPrice()

  // Fetch user's SUI balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!account) return

      try {
        const balance = await client.getBalance({
          owner: account.address,
          coinType: '0x2::sui::SUI',
        })
        setBalance(Number(balance.totalBalance) / 1e9)
      } catch (err) {
        console.error('Error fetching balance:', err)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 5000)
    return () => clearInterval(interval)
  }, [account, client])

  // Validate input on change
  useEffect(() => {
    if (amount) {
      const validation = validateAmount(amount, balance)
      setError(validation)
    } else {
      setError(null)
    }
  }, [amount, balance, validateAmount])

  const handleDeposit = async () => {
    if (error || !amount) return

    setShowConfirm(true)

    // Estimate gas
    try {
      const { Transaction } = await import('@mysten/sui/transactions')
      const tx = new Transaction()
      const amountInMist = suiToMist(amount)

      const gasEstimate = await estimateGas(tx)
      setEstimatedGas(gasEstimate / 1e9)
    } catch (err) {
      console.error('Gas estimation failed:', err)
      setEstimatedGas(0.001)
    }
  }

  const confirmDeposit = async () => {
    setShowConfirm(false)

    try {
      await depositSui(amount)
      alert('✅ Deposit successful!')
      setAmount('')
      setError(null)
    } catch (error) {
      console.error('Deposit failed:', error)
      alert('❌ Deposit failed: ' + (error as Error).message)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Deposit SUI</h3>
        <p className="text-sm text-slate-600">Deposit SUI tokens to earn yields and use as collateral</p>
      </div>

      <div className="space-y-6">
        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Deposit Amount (SUI)
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                error
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-slate-300'
              }`}
              placeholder="0.0"
              step="0.001"
              min="0.001"
            />
            <button
              onClick={() => setAmount(balance.toString())}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium disabled:bg-slate-300 disabled:cursor-not-allowed"
              disabled={balance === 0}
            >
              MAX
            </button>
          </div>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center">
                <span className="mr-2">⚠️</span>
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Current Balance */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Available Balance:</span>
            <span className="font-semibold text-slate-900">{balance.toFixed(4)} SUI</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">USD Value:</span>
            <span className="font-semibold text-slate-900">
              ${(balance * suiPrice).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Deposit Preview */}
        {amount && !error && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="font-semibold text-slate-900 mb-3">Transaction Preview</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Deposit Amount:</span>
                <span className="font-medium text-slate-900">{amount} SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">USD Value:</span>
                <span className="font-medium text-slate-900">${(parseFloat(amount) * suiPrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">New Total Collateral:</span>
                <span className="font-medium text-slate-900">
                  {(currentCollateral + parseFloat(amount)).toFixed(4)} SUI
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Allocation:</span>
                <span className="font-medium text-green-600">90% Staking + 10% Hedge</span>
              </div>
            </div>
          </div>
        )}

        {/* Allocation Info */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <p className="font-semibold text-slate-900 mb-2">Allocation Strategy</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">• Staking (90%):</span>
              <span className="text-sm font-medium text-slate-900">{(parseFloat(amount || '0') * 0.9).toFixed(4)} SUI</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">• Short Position (10%):</span>
              <span className="text-sm font-medium text-slate-900">{(parseFloat(amount || '0') * 0.1).toFixed(4)} SUI</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Optimized strategy for maximum yield with risk management
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <p className="font-semibold text-slate-900 mb-2">Deposit Information</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Minimum deposit: 0.001 SUI</li>
            <li>• Instant liquidity with automatic yield optimization</li>
            <li>• No lock-up period, withdraw anytime</li>
          </ul>
        </div>

        {/* Deposit Button */}
        <button
          onClick={handleDeposit}
          disabled={!account || isLoading || !!error || !amount || balance === 0}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Processing...' :
           balance === 0 ? 'Insufficient Balance' :
           'Deposit SUI'}
        </button>

        {!account && (
          <p className="text-sm text-slate-500 text-center">
            Please connect your wallet first
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Confirm Deposit</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Deposit Amount:</span>
                <span className="font-semibold text-slate-900">{amount} SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">USD Value:</span>
                <span className="font-semibold text-slate-900">${(parseFloat(amount) * suiPrice).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">To Staking:</span>
                <span className="font-semibold text-slate-900">
                  {(parseFloat(amount) * 0.9).toFixed(4)} SUI
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">To Short Position:</span>
                <span className="font-semibold text-slate-900">
                  {(parseFloat(amount) * 0.1).toFixed(4)} SUI
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Estimated Gas:</span>
                <span className="font-semibold text-slate-900">~{estimatedGas.toFixed(6)} SUI</span>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={confirmDeposit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-slate-200 text-slate-700 py-2 rounded-lg hover:bg-slate-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}