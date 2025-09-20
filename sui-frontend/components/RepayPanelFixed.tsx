'use client'

import { useState, useEffect } from 'react'
import { useLendingProtocolFixed } from '@/hooks/useLendingProtocolFixed'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { CONTRACT_ADDRESSES } from '@/lib/constants'
import { suiToMist } from '@/lib/decimal-utils'

interface RepayPanelFixedProps {
  currentDebt: number
}

export function RepayPanelFixed({ currentDebt }: RepayPanelFixedProps) {
  const [amount, setAmount] = useState('')
  const [repayMode, setRepayMode] = useState<'partial' | 'full'>('partial')
  const [susdBalance, setSusdBalance] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [estimatedGas, setEstimatedGas] = useState(0)

  const { repayDebt, isLoading, validateAmount, estimateGas } = useLendingProtocolFixed()
  const account = useCurrentAccount()
  const client = useSuiClient()

  // Fetch user's SUSD balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (!account) return

      try {
        const balance = await client.getBalance({
          owner: account.address,
          coinType: CONTRACT_ADDRESSES.SUSD_COIN_TYPE,
        })
        setSusdBalance(Number(balance.totalBalance) / 1e9)
      } catch (err) {
        console.error('Error fetching SUSD balance:', err)
        setSusdBalance(0)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 5000)
    return () => clearInterval(interval)
  }, [account, client])

  // Auto-set amount for full repayment
  useEffect(() => {
    if (repayMode === 'full') {
      setAmount(currentDebt.toString())
    } else if (repayMode === 'partial' && amount === currentDebt.toString()) {
      setAmount('')
    }
  }, [repayMode, currentDebt])

  // Validate input
  useEffect(() => {
    if (amount) {
      const repayAmount = parseFloat(amount)

      if (isNaN(repayAmount) || repayAmount <= 0) {
        setError('Amount must be greater than 0')
      } else if (repayAmount < 0.01) {
        setError('Minimum repay is $0.01')
      } else if (repayAmount > currentDebt) {
        setError('Amount exceeds current debt')
      } else if (repayAmount > susdBalance) {
        setError('Insufficient SUSD balance')
      } else {
        setError(null)
      }
    } else {
      setError(null)
    }
  }, [amount, currentDebt, susdBalance])

  const handleRepay = async () => {
    if (error || !amount) return

    setShowConfirm(true)

    // Estimate gas
    try {
      const { Transaction } = await import('@mysten/sui/transactions')
      const tx = new Transaction()
      const amountInMist = suiToMist(amount)

      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::lending_pool::repay`,
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

  const confirmRepay = async () => {
    setShowConfirm(false)

    try {
      await repayDebt(amount, repayMode === 'full')
      alert('✅ Repayment successful!')
      setAmount('')
      setError(null)
    } catch (error) {
      console.error('Repayment failed:', error)
      alert('❌ Repayment failed: ' + (error as Error).message)
    }
  }

  const getMaxRepayable = () => {
    return Math.min(currentDebt, susdBalance)
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Repay Debt</h3>
        <p className="text-sm text-slate-600">Repay your borrowed funds to reduce debt and improve health factor</p>
      </div>

      <div className="space-y-6">
        {/* Repay Mode Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Repayment Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setRepayMode('partial')}
              className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                repayMode === 'partial'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Partial Repayment
            </button>
            <button
              onClick={() => setRepayMode('full')}
              className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                repayMode === 'full'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              Full Repayment
            </button>
          </div>
        </div>

        {/* Debt Info */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Current Debt:</span>
            <span className="font-semibold text-slate-900">${currentDebt.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">SUSD Balance:</span>
            <span className="font-semibold text-slate-900">{susdBalance.toFixed(2)} SUSD</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">Max Repayable:</span>
            <span className="font-semibold text-green-600">
              ${getMaxRepayable().toFixed(2)}
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {repayMode === 'full' ? 'Full Repayment Amount (USD)' : 'Repay Amount (USD)'}
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
              } ${repayMode === 'full' ? 'opacity-50 cursor-not-allowed' : ''} ${currentDebt === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="0.0"
              step="0.01"
              min="0.01"
              max={getMaxRepayable()}
              disabled={repayMode === 'full' || currentDebt === 0}
              readOnly={repayMode === 'full'}
            />
            {repayMode === 'partial' && (
              <button
                onClick={() => setAmount(getMaxRepayable().toString())}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium disabled:bg-slate-300 disabled:cursor-not-allowed"
                disabled={currentDebt === 0 || getMaxRepayable() === 0}
              >
                MAX
              </button>
            )}
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

        {/* Repayment Preview */}
        {amount && !error && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <p className="font-semibold text-slate-900 mb-3">Transaction Preview</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Repay Amount:</span>
                <span className="font-medium text-slate-900">${amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Remaining Debt:</span>
                <span className="font-medium text-slate-900">
                  ${Math.max(0, currentDebt - parseFloat(amount)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Remaining SUSD:</span>
                <span className="font-medium text-slate-900">
                  {(susdBalance - parseFloat(amount)).toFixed(2)} SUSD
                </span>
              </div>
              {repayMode === 'full' && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Status:</span>
                  <span className="font-medium text-green-600">Debt Fully Paid</span>
                </div>
              )}
            </div>
            {parseFloat(amount) === currentDebt && (
              <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded">
                <p className="text-xs text-green-700">
                  🎉 This will fully repay your debt and unlock all collateral!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Interest Info */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <p className="font-semibold text-slate-900 mb-2">Interest Information</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Current Interest Rate:</span>
              <span className="text-sm font-medium text-green-600">0% APY (Testnet)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Accrued Interest:</span>
              <span className="text-sm font-medium text-slate-900">$0.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Total to Repay:</span>
              <span className="text-sm font-medium text-slate-900">${currentDebt.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
          <p className="font-semibold text-slate-900 mb-2">Repayment Information</p>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• Minimum repay: $0.01 USD</li>
            <li>• Repay with SUSD tokens</li>
            <li>• Improves health factor and reduces liquidation risk</li>
            <li>• Full repayment unlocks all collateral</li>
          </ul>
        </div>

        {/* Repay Button */}
        <button
          onClick={handleRepay}
          disabled={
            !account ||
            isLoading ||
            !!error ||
            !amount ||
            currentDebt === 0 ||
            susdBalance === 0
          }
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Processing...' :
           currentDebt === 0 ? 'No Debt to Repay' :
           susdBalance === 0 ? 'No SUSD Balance' :
           repayMode === 'full' ? 'Repay Full Debt' : 'Repay Debt'}
        </button>

        {!account && (
          <p className="text-sm text-slate-500 text-center">
            Please connect your wallet first
          </p>
        )}

        {currentDebt === 0 && account && (
          <p className="text-sm text-slate-500 text-center">
            No outstanding debt to repay
          </p>
        )}

        {susdBalance === 0 && currentDebt > 0 && account && (
          <p className="text-sm text-slate-500 text-center">
            You need SUSD tokens to repay debt
          </p>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Confirm Repayment</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Repay Amount:</span>
                <span className="font-semibold text-slate-900">${amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Repayment Type:</span>
                <span className="font-semibold text-slate-900">
                  {repayMode === 'full' ? 'Full Repayment' : 'Partial Repayment'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Remaining Debt:</span>
                <span className="font-semibold text-slate-900">
                  ${Math.max(0, currentDebt - parseFloat(amount)).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Interest Saved:</span>
                <span className="font-semibold text-green-600">$0.00 (0% APY)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Estimated Gas:</span>
                <span className="font-semibold text-slate-900">~{estimatedGas.toFixed(6)} SUI</span>
              </div>
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={confirmRepay}
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