'use client'

import { useState, useEffect } from 'react'
import { useLendingProtocolFixed } from '@/hooks/useLendingProtocolFixed'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useSuiPrice } from '@/hooks/usePositionData'
import { CONTRACT_ADDRESSES } from '@/lib/constants'
import { suiToMist } from '@/lib/decimal-utils'

interface WithdrawPanelFixedProps {
  stakedAmount: number
  estimatedRewards: number
}

export function WithdrawPanelFixed({ stakedAmount, estimatedRewards }: WithdrawPanelFixedProps) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [estimatedGas, setEstimatedGas] = useState(0)
  const [maxWithdraw, setMaxWithdraw] = useState(0)

  const { withdrawCollateral, isLoading, validateAmount, estimateGas } = useLendingProtocolFixed()
  const account = useCurrentAccount()
  const { data: suiPrice = 0.5 } = useSuiPrice()

  // Calculate maximum withdrawable amount (staked amount + rewards)
  useEffect(() => {
    // Can withdraw all staked amount
    setMaxWithdraw(stakedAmount)
  }, [stakedAmount])

  // Validate input
  useEffect(() => {
    if (amount) {
      const withdrawAmount = parseFloat(amount)

      if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        setError('Amount must be greater than 0')
      } else if (withdrawAmount < 0.001) {
        setError('Minimum withdrawal is 0.001 SUI')
      } else if (withdrawAmount > stakedAmount) {
        setError('Amount exceeds staked amount')
      } else {
        setError(null)
      }
    } else {
      setError(null)
    }
  }, [amount, stakedAmount])

  const handleWithdraw = async () => {
    if (error || !amount) return

    setShowConfirm(true)

    // Estimate gas
    try {
      const { Transaction } = await import('@mysten/sui/transactions')
      const tx = new Transaction()
      const amountInMist = suiToMist(amount)

      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::lending_pool::withdraw_collateral`,
        arguments: [
          tx.object(CONTRACT_ADDRESSES.LENDING_POOL),
          tx.object(CONTRACT_ADDRESSES.STAKING_MANAGER),
          tx.object(CONTRACT_ADDRESSES.SHORT_POSITION_MANAGER),
          tx.pure.u64(amountInMist),
        ],
      })

      const gasEstimate = await estimateGas(tx)
      setEstimatedGas(gasEstimate / 1e9)
    } catch (err) {
      console.error('Gas estimation failed:', err)
      setEstimatedGas(0.001)
    }
  }

  const confirmWithdraw = async () => {
    setShowConfirm(false)

    try {
      await withdrawCollateral(amount, maxWithdraw)
      alert('✅ Withdrawal successful!')
      setAmount('')
      setError(null)
    } catch (error) {
      console.error('Withdrawal failed:', error)
      alert('❌ Withdrawal failed: ' + (error as Error).message)
    }
  }

  const getHealthColor = (health: number) => {
    if (health > 150) return 'text-green-600'
    if (health > 100) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">Unstake & Withdraw</h3>
        <p className="text-slate-600 leading-relaxed">Unstake your SUI from validators and withdraw with earned rewards</p>
      </div>

      <div className="space-y-6">
        {/* Staking Info */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200/50 p-6 rounded-2xl backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-600 font-medium">Staked Amount:</span>
            <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{stakedAmount.toFixed(4)} SUI</span>
          </div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-slate-600 font-medium">Est. Rewards:</span>
            <span className="font-bold text-lg text-green-600">{estimatedRewards.toFixed(4)} SUI</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-600 font-medium">Total Withdrawable:</span>
            <span className="font-bold text-xl text-green-600">
              {(stakedAmount + estimatedRewards).toFixed(4)} SUI
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Unstake Amount (SUI)
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-6 py-4 border-2 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 text-xl font-semibold backdrop-blur-sm ${
                error
                  ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500 bg-red-50/50'
                  : 'border-indigo-200/50 bg-white/70 hover:bg-white/90'
              } ${maxWithdraw === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="0.0"
              step="0.001"
              min="0.001"
              max={maxWithdraw}
              disabled={maxWithdraw === 0}
            />
            <button
              onClick={() => setAmount(maxWithdraw.toString())}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium disabled:bg-slate-300 disabled:cursor-not-allowed"
              disabled={stakedAmount === 0}
              title="Maximum unstakable amount"
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

        {/* Withdrawal Preview */}
        {amount && !error && (
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/50 p-6 rounded-2xl shadow-lg">
            <p className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Transaction Preview</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Unstake Amount:</span>
                <span className="font-medium text-slate-900">{amount} SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Est. Rewards:</span>
                <span className="font-medium text-green-600">
                  {estimatedRewards.toFixed(4)} SUI
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Total to Receive:</span>
                <span className="font-medium text-slate-900">
                  {(parseFloat(amount) + estimatedRewards).toFixed(4)} SUI
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">USD Value:</span>
                <span className="font-medium text-slate-900">
                  ${((parseFloat(amount) + estimatedRewards) * suiPrice).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Staking Rewards Info */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 p-6 rounded-2xl shadow-lg">
          <p className="font-bold text-lg bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">Staking Rewards</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">• Staking APY:</span>
              <span className="text-sm font-medium text-green-600">~5-7%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">• Earned Rewards:</span>
              <span className="text-sm font-medium text-green-600">{estimatedRewards.toFixed(4)} SUI</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Rewards are calculated automatically when unstaking
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/50 p-6 rounded-2xl shadow-lg">
          <p className="font-bold text-lg bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-3">Unstaking Information</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Instant unstaking from validator</li>
            <li>• Includes accumulated staking rewards</li>
            <li>• No unstaking penalties</li>
          </ul>
        </div>

        {/* Withdraw Button */}
        <button
          onClick={handleWithdraw}
          disabled={
            !account ||
            isLoading ||
            !!error ||
            !amount ||
            stakedAmount === 0
          }
          className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-4 px-6 rounded-2xl hover:shadow-2xl hover:shadow-purple-500/25 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all duration-300 font-bold text-lg transform hover:scale-105 hover:-translate-y-1"
        >
          {isLoading ? '🔄 Processing...' :
           stakedAmount === 0 ? '❌ No Staked SUI to Withdraw' :
           '🎆 Unstake & Withdraw'}
        </button>

        {!account && (
          <p className="text-sm text-slate-500 text-center">
            Please connect your wallet first
          </p>
        )}

        {stakedAmount === 0 && account && (
          <p className="text-sm text-slate-500 text-center">
            No staked SUI available for withdrawal
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Confirm Unstaking</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Unstake Amount:</span>
                <span className="font-semibold text-slate-900">{amount} SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Est. Rewards:</span>
                <span className="font-semibold text-green-600">
                  {estimatedRewards.toFixed(4)} SUI
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total to Receive:</span>
                <span className="font-semibold text-slate-900">
                  {(parseFloat(amount) + estimatedRewards).toFixed(4)} SUI
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Estimated Gas:</span>
                <span className="font-semibold text-slate-900">~{estimatedGas.toFixed(6)} SUI</span>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={confirmWithdraw}
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