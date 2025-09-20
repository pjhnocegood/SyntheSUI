'use client'

import { useState, useEffect } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { WalletButton } from '@/components/WalletButton'
import { DepositPanelFixed } from '@/components/DepositPanelFixed'
import { BorrowPanelFixed } from '@/components/BorrowPanelFixed'
import { RepayPanelFixed } from '@/components/RepayPanelFixed'
import { WithdrawPanelFixed } from '@/components/WithdrawPanelFixed'
import { usePositionData, useSuiPrice } from '@/hooks/usePositionData'

function ConnectButton() {
  return <WalletButton />
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('deposit')
  const [userPosition, setUserPosition] = useState({
    collateralAmount: 0,
    debtAmount: 0,
    healthFactor: 0,
    availableCollateral: 0,
    liquidationPrice: 0,
  })

  const account = useCurrentAccount()
  const { data: positionData, isLoading: positionLoading } = usePositionData()
  const { data: suiPrice = 0.5 } = useSuiPrice()

  useEffect(() => {
    if (positionData) {
      setUserPosition(positionData)
    }
  }, [positionData])

  const stats = [
    {
      label: 'Total Value Locked',
      value: '$2.4M',
      change: '+12.5%',
      trend: 'up'
    },
    {
      label: 'Total Borrowed',
      value: '$890K',
      change: '+8.2%',
      trend: 'up'
    },
    {
      label: 'SUI Price',
      value: `$${suiPrice.toFixed(4)}`,
      change: '+5.7%',
      trend: 'up'
    },
    {
      label: 'Active Users',
      value: '1,247',
      change: '+18.3%',
      trend: 'up'
    }
  ]

  const tabs = [
    { id: 'deposit', label: 'Deposit', icon: '💰' },
    { id: 'borrow', label: 'Borrow', icon: '📊' },
    { id: 'repay', label: 'Repay', icon: '💳' },
    { id: 'withdraw', label: 'Withdraw', icon: '🏦' }
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <h1 className="text-xl font-semibold text-slate-900">SUI Lending</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600">
                Network: <span className="text-blue-600 font-medium">SUI Testnet</span>
              </div>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {account ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Position Overview */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Your Position</h2>

                {positionLoading ? (
                  <div className="space-y-4">
                    <div className="animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                      <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Collateral</span>
                      <span className="font-medium text-slate-900">
                        {(userPosition.collateralAmount || 0).toFixed(4)} SUI
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Debt</span>
                      <span className="font-medium text-slate-900">
                        ${(userPosition.debtAmount || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Health Factor</span>
                      <span className={`font-medium ${
                        (userPosition.healthFactor || 0) > 150 ? 'text-green-600' :
                        (userPosition.healthFactor || 0) > 100 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {(userPosition.healthFactor || 0) > 0 ? `${(userPosition.healthFactor || 0).toFixed(0)}%` : '∞'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-600">Available</span>
                      <span className="font-medium text-slate-900">
                        {(userPosition.availableCollateral || 0).toFixed(4)} SUI
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trading Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200">
                {/* Tab Navigation */}
                <div className="border-b border-slate-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                          activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'deposit' && (
                    <DepositPanelFixed
                      currentCollateral={userPosition.collateralAmount || 0}
                      currentDebt={userPosition.debtAmount || 0}
                    />
                  )}
                  {activeTab === 'borrow' && (
                    <BorrowPanelFixed
                      availableCollateral={userPosition.availableCollateral || 0}
                      currentDebt={userPosition.debtAmount || 0}
                      currentCollateral={userPosition.collateralAmount || 0}
                    />
                  )}
                  {activeTab === 'repay' && (
                    <RepayPanelFixed currentDebt={userPosition.debtAmount || 0} />
                  )}
                  {activeTab === 'withdraw' && (
                    <WithdrawPanelFixed
                      availableCollateral={userPosition.availableCollateral || 0}
                      currentDebt={userPosition.debtAmount || 0}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Welcome Section for Non-connected Users
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🏦</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Welcome to SUI Lending Protocol
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Deposit SUI, earn yields, and borrow stablecoins with competitive rates.
                Built on the SUI blockchain for fast and secure transactions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">💰</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Deposit & Earn</h3>
                  <p className="text-sm text-slate-600">
                    Deposit SUI tokens and earn competitive yields through our lending pool.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">📊</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Borrow Assets</h3>
                  <p className="text-sm text-slate-600">
                    Use your SUI collateral to borrow stablecoins at competitive rates.
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl">🔒</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Secure Protocol</h3>
                  <p className="text-sm text-slate-600">
                    Built with security-first approach and audited smart contracts.
                  </p>
                </div>
              </div>

              <div className="mt-12">
                <ConnectButton />
                <p className="text-sm text-slate-500 mt-4">
                  Connect your wallet to start using the lending protocol
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-slate-600 text-sm">SUI Lending Protocol</span>
            </div>

            <div className="flex items-center space-x-6 text-sm text-slate-500">
              <span>Network: SUI Testnet</span>
              <span>Version: 1.0.0</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}