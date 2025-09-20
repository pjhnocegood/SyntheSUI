'use client'

import { useState, useEffect } from 'react'
import { useLendingProtocolFixed } from '@/hooks/useLendingProtocolFixed'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useSuiPrice } from '@/hooks/usePositionData'
import { CONTRACT_ADDRESSES } from '@/lib/constants'
import { suiToMist } from '@/lib/decimal-utils'

interface WithdrawPanelFixedProps {
  availableCollateral: number
  currentDebt: number
}

export function WithdrawPanelFixed({ availableCollateral, currentDebt }: WithdrawPanelFixedProps) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [estimatedGas, setEstimatedGas] = useState(0)
  const [newHealthFactor, setNewHealthFactor] = useState(100)
  const [maxWithdraw, setMaxWithdraw] = useState(0)

  const { withdrawCollateral, isLoading, validateAmount, estimateGas } = useLendingProtocolFixed()
  const account = useCurrentAccount()
  const { data: suiPrice = 0.5 } = useSuiPrice()

  // Calculate maximum withdrawable amount (maintain 200% collateralization for safety)
  useEffect(() => {
    if (currentDebt === 0) {
      // No debt, can withdraw all
      setMaxWithdraw(availableCollateral)
    } else {
      // Must maintain collateral for debt
      // For 50% max LTV, we need 2x collateral value of debt
      const requiredCollateralValue = currentDebt * 2
      const requiredCollateralSui = requiredCollateralValue / suiPrice
      const withdrawable = Math.max(0, availableCollateral - requiredCollateralSui)
      setMaxWithdraw(withdrawable)
    }
  }, [availableCollateral, currentDebt, suiPrice])

  // Validate input and calculate new health factor
  useEffect(() => {
    if (amount) {
      const withdrawAmount = parseFloat(amount)

      if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
        setError('Amount must be greater than 0')
      } else if (withdrawAmount < 0.001) {
        setError('Minimum withdrawal is 0.001 SUI')
      } else if (withdrawAmount > availableCollateral) {
        setError('Amount exceeds available collateral')
      } else if (withdrawAmount > maxWithdraw) {
        setError('Withdrawal would make position unhealthy')
      } else {
        setError(null)

        // Calculate new health factor
        if (currentDebt > 0) {
          const remainingCollateral = availableCollateral - withdrawAmount
          const remainingCollateralValue = remainingCollateral * suiPrice
          const newHealth = (remainingCollateralValue * 100) / currentDebt
          setNewHealthFactor(newHealth)
        } else {
          setNewHealthFactor(100)
        }
      }
    } else {
      setError(null)
      if (currentDebt > 0) {
        const collateralValue = availableCollateral * suiPrice
        setNewHealthFactor((collateralValue * 100) / currentDebt)
      } else {
        setNewHealthFactor(100)
      }
    }
  }, [amount, availableCollateral, maxWithdraw, currentDebt, suiPrice])

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
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Withdraw Collateral</h3>
        <p className="text-sm text-slate-600">Withdraw your SUI collateral while maintaining a healthy position</p>
      </div>

      <div className="space-y-6">
        {/* Collateral Info */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Total Collateral:</span>
            <span className="font-semibold text-slate-900">{availableCollateral.toFixed(4)} SUI</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Current Debt:</span>
            <span className="font-semibold text-slate-900">${currentDebt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Max Withdrawable:</span>
            <span className="font-semibold text-green-600">
              {maxWithdraw.toFixed(4)} SUI
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Withdraw Amount (SUI)
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
              disabled={maxWithdraw === 0}
              title="Max withdrawal based on debt requirements"
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
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="font-semibold text-slate-900 mb-3">Transaction Preview</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Withdraw Amount:</span>
                <span className="font-medium text-slate-900">{amount} SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Remaining Collateral:</span>
                <span className="font-medium text-slate-900">
                  {(availableCollateral - parseFloat(amount)).toFixed(4)} SUI
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Value at ${suiPrice.toFixed(4)}/SUI:</span>
                <span className="font-medium text-slate-900">
                  ${((availableCollateral - parseFloat(amount)) * suiPrice).toFixed(2)}
                </span>
              </div>
              {currentDebt > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">New Health Factor:</span>
                  <span className={`font-medium ${getHealthColor(newHealthFactor)}`}>
                    {newHealthFactor.toFixed(0)}%
                  </span>
                </div>
              )}
            </div>
            {newHealthFactor < 100 && newHealthFactor > 75 && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-700">
                  ⚠️ Warning: Low health factor after withdrawal. Monitor closely.
                </p>
              </div>
            )}
            {newHealthFactor <= 75 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-700">
                  🚨 Danger: This withdrawal would put you at risk of liquidation!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Distribution Info */}
        {amount && !error && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
            <p className="font-semibold text-slate-900 mb-2">Withdrawal Sources</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">• From Staking:</span>
                <span className="text-sm font-medium text-slate-900">{(parseFloat(amount) * 0.5).toFixed(4)} SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">• From Short Position:</span>
                <span className="text-sm font-medium text-slate-900">{(parseFloat(amount) * 0.5).toFixed(4)} SUI</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Note: Rewards and P&L will be calculated during withdrawal
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <p className="font-semibold text-slate-900 mb-2">Withdrawal Rules</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Must maintain healthy position if debt exists</li>
            <li>• Minimum 200% collateralization ratio</li>
            <li>• Includes staking rewards and short P&L</li>
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
            availableCollateral === 0 ||
            maxWithdraw === 0
          }
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Processing...' :
           availableCollateral === 0 ? 'No Collateral to Withdraw' :
           maxWithdraw === 0 ? 'Cannot Withdraw (Debt Too High)' :
           'Withdraw Collateral'}
        </button>

        {!account && (
          <p className="text-sm text-slate-500 text-center">
            Please connect your wallet first
          </p>
        )}

        {availableCollateral === 0 && account && (
          <p className="text-sm text-slate-500 text-center">
            No collateral available for withdrawal
          </p>
        )}

        {maxWithdraw === 0 && currentDebt > 0 && account && (
          <p className="text-sm text-slate-500 text-center">
            Repay some debt first to enable withdrawals
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Confirm Withdrawal</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Withdraw Amount:</span>
                <span className="font-semibold text-slate-900">{amount} SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">From Staking:</span>
                <span className="font-semibold text-slate-900">
                  {(parseFloat(amount) * 0.5).toFixed(4)} SUI
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">From Short:</span>
                <span className="font-semibold text-slate-900">
                  {(parseFloat(amount) * 0.5).toFixed(4)} SUI
                </span>
              </div>
              {currentDebt > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">New Health:</span>
                  <span className={`font-semibold ${getHealthColor(newHealthFactor)}`}>
                    {newHealthFactor.toFixed(0)}%
                  </span>
                </div>
              )}
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