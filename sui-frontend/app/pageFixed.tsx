'use client'

import { useState, useEffect } from 'react'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { WalletButton } from '@/components/WalletButton'
import { DepositPanelFixed } from '@/components/DepositPanelFixed'
import { WithdrawPanelFixed } from '@/components/WithdrawPanelFixed'
import { usePositionData, useSuiPrice } from '@/hooks/usePositionData'

function ConnectButton() {
  return <WalletButton />
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('deposit')
  const [userPosition, setUserPosition] = useState({
    stakedAmount: 0,
    estimatedRewards: 0,
    stakingEpoch: 0,
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
      label: 'Total Staked',
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
    { id: 'deposit', label: 'Deposit & Stake', icon: '💰' },
    { id: 'withdraw', label: 'Unstake & Withdraw', icon: '🏦' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-spin" style={{animationDuration: '20s'}}></div>
      </div>
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50 shadow-lg shadow-blue-500/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-200">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">SUI Staking</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-slate-600 bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
                Network: <span className="text-blue-600 font-semibold">SUI Testnet</span>
              </div>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const gradients = [
              'from-blue-500 to-cyan-500',
              'from-indigo-500 to-purple-500',
              'from-purple-500 to-pink-500',
              'from-green-500 to-emerald-500'
            ]
            const bgGradients = [
              'from-blue-50 to-cyan-50',
              'from-indigo-50 to-purple-50',
              'from-purple-50 to-pink-50',
              'from-green-50 to-emerald-50'
            ]
            return (
              <div key={index} className={`bg-gradient-to-br ${bgGradients[index]} backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1 group`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">{stat.label}</p>
                    <p className={`text-3xl font-bold bg-gradient-to-r ${gradients[index]} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-200`}>{stat.value}</p>
                  </div>
                  <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                    stat.trend === 'up'
                      ? 'text-green-700 bg-green-100/80'
                      : 'text-red-700 bg-red-100/80'
                  } backdrop-blur-sm`}>
                    {stat.change}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {account ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Position Overview */}
            <div className="lg:col-span-1">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300">
                <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">Your Staking Position</h2>

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
                      <span className="text-sm text-slate-600">Staked Amount</span>
                      <span className="font-medium text-slate-900">
                        {(userPosition.stakedAmount || 0).toFixed(4)} SUI
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">Est. Rewards</span>
                      <span className="font-medium text-green-600">
                        {(userPosition.estimatedRewards || 0).toFixed(4)} SUI
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-slate-600">Staking Since</span>
                      <span className="font-medium text-slate-900">
                        Epoch {userPosition.stakingEpoch || 0}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Trading Panel */}
            <div className="lg:col-span-2">
              <div className="bg-white/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
                {/* Tab Navigation */}
                <div className="border-b border-white/20 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 backdrop-blur-sm rounded-t-2xl">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 py-4 px-3 border-b-3 font-semibold text-sm rounded-t-lg transition-all duration-200 transform hover:scale-105 ${
                          activeTab === tab.id
                            ? 'border-blue-500 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent shadow-lg'
                            : 'border-transparent text-slate-600 hover:text-blue-600 hover:bg-white/30'
                        }`}
                      >
                        <span className="text-lg">{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'deposit' && (
                    <DepositPanelFixed
                      currentStaked={userPosition.stakedAmount || 0}
                    />
                  )}
                  {activeTab === 'withdraw' && (
                    <WithdrawPanelFixed
                      stakedAmount={userPosition.stakedAmount || 0}
                      estimatedRewards={userPosition.estimatedRewards || 0}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Welcome Section for Non-connected Users
          <div className="text-center py-16 relative">
            <div className="max-w-3xl mx-auto">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-blue-500/25 animate-bounce">
                <span className="text-3xl">🏦</span>
              </div>
              <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 animate-pulse">
                Welcome to SUI Staking Protocol
              </h2>
              <p className="text-xl text-slate-700 mb-12 leading-relaxed">
                Stake your SUI tokens with validators and earn staking rewards.
                <br />Built on the SUI blockchain for secure and efficient staking.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
                <div className="text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/25 group-hover:shadow-2xl group-hover:shadow-green-500/40 transition-all duration-300">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="font-bold text-xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-3">Stake & Earn</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Stake your SUI tokens with validators and earn staking rewards.
                  </p>
                </div>

                <div className="text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/25 group-hover:shadow-2xl group-hover:shadow-blue-500/40 transition-all duration-300">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">Instant Unstaking</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Withdraw your staked SUI and earned rewards anytime.
                  </p>
                </div>

                <div className="text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/25 group-hover:shadow-2xl group-hover:shadow-purple-500/40 transition-all duration-300">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h3 className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">Secure Protocol</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Built with security-first approach and audited smart contracts.
                  </p>
                </div>
              </div>

              <div className="mt-16">
                <div className="transform hover:scale-105 transition-transform duration-200">
                  <ConnectButton />
                </div>
                <p className="text-slate-600 mt-6 text-lg">
                  Connect your wallet to start staking your SUI tokens
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-xl border-t border-white/20 mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-slate-700 font-semibold">SUI Staking Protocol</span>
            </div>

            <div className="flex items-center space-x-8 text-sm">
              <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200/50">
                <span className="text-slate-600">Network:</span>
                <span className="text-blue-600 font-semibold">SUI Testnet</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full border border-purple-200/50">
                <span className="text-slate-600">Version:</span>
                <span className="text-purple-600 font-semibold">1.0.0</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full border border-green-200/50">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 font-semibold">Online</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}