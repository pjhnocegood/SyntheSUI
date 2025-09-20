'use client'

import { LIQUIDATION_THRESHOLD, MAX_LTV, STAKING_APY } from '@/lib/constants'

interface PositionDashboardProps {
  collateralAmount: number
  collateralValue: number
  borrowedAmount: number
  stakingRewards: number
  shortPnL: number
  suiPrice: number
}

export function PositionDashboard({
  collateralAmount,
  collateralValue,
  borrowedAmount,
  stakingRewards,
  shortPnL,
  suiPrice,
}: PositionDashboardProps) {
  const ltv = collateralValue > 0 ? (borrowedAmount / collateralValue) * 100 : 0
  const healthFactor = borrowedAmount > 0 ? (collateralValue * 100) / borrowedAmount : 100

  const getHealthStatus = () => {
    if (healthFactor >= 150) return { color: 'text-green-600', status: 'Healthy' }
    if (healthFactor >= 100) return { color: 'text-yellow-600', status: 'Warning' }
    return { color: 'text-red-600', status: 'Danger' }
  }

  const health = getHealthStatus()

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">Your Position</h2>

      <div className="grid grid-cols-2 gap-4">
        {/* Collateral Info */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Collateral</h3>
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-gray-600">Amount</p>
            <p className="text-lg font-bold">{collateralAmount.toFixed(4)} SUI</p>
            <p className="text-sm text-gray-500">≈ ${collateralValue.toFixed(2)}</p>
          </div>
        </div>

        {/* Debt Info */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Debt</h3>
          <div className="bg-red-50 p-3 rounded">
            <p className="text-sm text-gray-600">Borrowed</p>
            <p className="text-lg font-bold">${borrowedAmount.toFixed(2)}</p>
            <p className="text-sm text-gray-500">SUSD</p>
          </div>
        </div>

        {/* Staking Info */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Staking (50%)</h3>
          <div className="bg-green-50 p-3 rounded">
            <p className="text-sm text-gray-600">Rewards Earned</p>
            <p className="text-lg font-bold">+{stakingRewards.toFixed(4)} SUI</p>
            <p className="text-sm text-gray-500">APY: {STAKING_APY}%</p>
          </div>
        </div>

        {/* Short Position Info */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700">Short Position (50%)</h3>
          <div className={`${shortPnL >= 0 ? 'bg-green-50' : 'bg-red-50'} p-3 rounded`}>
            <p className="text-sm text-gray-600">P&L</p>
            <p className={`text-lg font-bold ${shortPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {shortPnL >= 0 ? '+' : ''}{shortPnL.toFixed(4)} SUI
            </p>
            <p className="text-sm text-gray-500">Mock</p>
          </div>
        </div>
      </div>

      {/* Health Metrics */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">SUI Price</span>
            <span className="font-semibold">${suiPrice.toFixed(4)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">LTV Ratio</span>
            <div className="text-right">
              <span className="font-semibold">{ltv.toFixed(1)}%</span>
              <span className="text-sm text-gray-500"> / {MAX_LTV}%</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Health Factor</span>
            <div className="text-right">
              <span className={`font-semibold ${health.color}`}>
                {healthFactor.toFixed(0)}%
              </span>
              <span className={`text-sm ${health.color}`}> ({health.status})</span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-600">Liquidation Threshold</span>
            <span className="text-sm text-gray-500">{LIQUIDATION_THRESHOLD}%</span>
          </div>
        </div>

        {/* Health Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                healthFactor >= 150 ? 'bg-green-500' :
                healthFactor >= 100 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(healthFactor, 200) / 2}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}