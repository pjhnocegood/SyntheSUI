'use client'

import { useState, useEffect } from 'react'
import { useLendingProtocolFixed } from '@/hooks/useLendingProtocolFixed'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { useSuiPrice } from '@/hooks/usePositionData'
import { CONTRACT_ADDRESSES } from '@/lib/constants'
import { suiToMist } from '@/lib/decimal-utils'

interface BorrowPanelFixedProps {
  availableCollateral?: number
  currentDebt?: number
  currentCollateral?: number
}

export function BorrowPanelFixed({
  availableCollateral = 0,
  currentDebt = 0,
  currentCollateral = 0
}: BorrowPanelFixedProps) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [estimatedGas, setEstimatedGas] = useState(0)
  const [newHealthFactor, setNewHealthFactor] = useState(100)
  const [maxBorrow, setMaxBorrow] = useState(0)

  const { borrowFunds, isLoading, validateAmount, estimateGas } = useLendingProtocolFixed()
  const account = useCurrentAccount()
  const { data: suiPrice = 0.5 } = useSuiPrice()

  // Calculate maximum borrowable amount (50% LTV)
  useEffect(() => {
    const collateralValue = currentCollateral * suiPrice
    const maxBorrowAmount = collateralValue * 0.5 // 50% LTV
    const availableToBorrow = Math.max(0, maxBorrowAmount - currentDebt)
    setMaxBorrow(availableToBorrow)
  }, [currentCollateral, currentDebt, suiPrice])

  // Validate input and calculate new health factor
  useEffect(() => {
    if (amount) {
      const borrowAmount = parseFloat(amount)

      if (isNaN(borrowAmount) || borrowAmount <= 0) {
        setError('Amount must be greater than 0')
      } else if (borrowAmount < 1) {
        setError('Minimum borrow is $1')
      } else if (borrowAmount > maxBorrow) {
        setError('Amount exceeds maximum borrowable')
      } else if (currentCollateral === 0) {
        setError('No collateral available')
      } else {
        setError(null)

        // Calculate new health factor
        const newTotalDebt = currentDebt + borrowAmount
        const collateralValue = currentCollateral * suiPrice
        const newHealth = (collateralValue * 100) / newTotalDebt
        setNewHealthFactor(newHealth)
      }
    } else {
      setError(null)
      if (currentCollateral > 0 && currentDebt > 0) {
        const collateralValue = currentCollateral * suiPrice
        setNewHealthFactor((collateralValue * 100) / currentDebt)
      } else {
        setNewHealthFactor(100)
      }
    }
  }, [amount, maxBorrow, currentCollateral, currentDebt, suiPrice])

  const handleBorrow = async () => {
    if (error || !amount) return

    setShowConfirm(true)

    // Estimate gas
    try {
      const { Transaction } = await import('@mysten/sui/transactions')
      const tx = new Transaction()
      const amountInMist = suiToMist(amount)

      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::lending_pool::borrow`,
        arguments: [
          tx.object(CONTRACT_ADDRESSES.LENDING_POOL),
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

  const confirmBorrow = async () => {
    setShowConfirm(false)

    try {
      await borrowFunds(amount, maxBorrow)
      alert('✅ Borrow successful!')
      setAmount('')
      setError(null)
    } catch (error) {
      console.error('Borrow failed:', error)
      alert('❌ Borrow failed: ' + (error as Error).message)
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
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Borrow Funds</h3>
        <p className="text-sm text-slate-600">Borrow stablecoins against your SUI collateral</p>
      </div>

      <div className="space-y-6">
        {/* Collateral Info */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Total Collateral:</span>
            <span className="font-semibold text-slate-900">{currentCollateral.toFixed(4)} SUI</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Collateral Value:</span>
            <span className="font-semibold text-slate-900">${(currentCollateral * suiPrice).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Current Debt:</span>
            <span className="font-semibold text-slate-900">${currentDebt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Max Borrowable:</span>
            <span className="font-semibold text-green-600">
              ${maxBorrow.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Borrow Amount (USD)
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
              } ${maxBorrow === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="0.0"
              step="0.01"
              min="1"
              max={maxBorrow}
              disabled={maxBorrow === 0}
            />
            <button
              onClick={() => setAmount(maxBorrow.toString())}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium disabled:bg-slate-300 disabled:cursor-not-allowed"
              disabled={maxBorrow === 0}
              title="Maximum borrowable amount at 50% LTV"
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

        {/* Borrow Preview */}
        {amount && !error && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="font-semibold text-slate-900 mb-3">Transaction Preview</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Borrow Amount:</span>
                <span className="font-medium text-slate-900">${amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">New Total Debt:</span>
                <span className="font-medium text-slate-900">
                  ${(currentDebt + parseFloat(amount)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">LTV Ratio:</span>
                <span className="font-medium text-slate-900">
                  {(((currentDebt + parseFloat(amount)) / (currentCollateral * suiPrice)) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">New Health Factor:</span>
                <span className={`font-medium ${getHealthColor(newHealthFactor)}`}>
                  {newHealthFactor.toFixed(0)}%
                </span>
              </div>
            </div>
            {newHealthFactor < 110 && newHealthFactor > 90 && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-700">
                  ⚠️ Warning: Health factor will be close to liquidation threshold
                </p>
              </div>
            )}
            {newHealthFactor <= 90 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-700">
                  🚨 Danger: This borrow would put you at risk of liquidation!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Interest Rate Info */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <p className="font-semibold text-slate-900 mb-2">Interest Rate Information</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Current Rate:</span>
              <span className="text-sm font-medium text-green-600">0% APY (Testnet)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Maximum LTV:</span>
              <span className="text-sm font-medium text-slate-900">50%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Liquidation Threshold:</span>
              <span className="text-sm font-medium text-red-600">75%</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <p className="font-semibold text-slate-900 mb-2">Borrowing Information</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Minimum borrow: $1 USD</li>
            <li>• Conservative 50% maximum LTV for safety</li>
            <li>• Monitor health factor to avoid liquidation</li>
            <li>• 0% interest rate during testnet phase</li>
          </ul>
        </div>

        {/* Borrow Button */}
        <button
          onClick={handleBorrow}
          disabled={
            !account ||
            isLoading ||
            !!error ||
            !amount ||
            currentCollateral === 0 ||
            maxBorrow === 0
          }
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Processing...' :
           currentCollateral === 0 ? 'No Collateral Available' :
           maxBorrow === 0 ? 'Maximum Borrowed Already' :
           'Borrow Funds'}
        </button>

        {!account && (
          <p className="text-sm text-slate-500 text-center">
            Please connect your wallet first
          </p>
        )}

        {currentCollateral === 0 && account && (
          <p className="text-sm text-slate-500 text-center">
            Deposit SUI collateral first to start borrowing
          </p>
        )}

        {maxBorrow === 0 && currentCollateral > 0 && account && (
          <p className="text-sm text-slate-500 text-center">
            You've reached the maximum borrowing limit
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Confirm Borrow</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Borrow Amount:</span>
                <span className="font-semibold text-slate-900">${amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Interest Rate:</span>
                <span className="font-semibold text-green-600">0% APY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">New Total Debt:</span>
                <span className="font-semibold text-slate-900">
                  ${(currentDebt + parseFloat(amount)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">New Health Factor:</span>
                <span className={`font-semibold ${getHealthColor(newHealthFactor)}`}>
                  {newHealthFactor.toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Estimated Gas:</span>
                <span className="font-semibold text-slate-900">~{estimatedGas.toFixed(6)} SUI</span>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={confirmBorrow}
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