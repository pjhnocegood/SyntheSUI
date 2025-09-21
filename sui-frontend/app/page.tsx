'use client'

import { WalletButton } from '@/components/WalletButton'
import { UserPositions } from '@/components/UserPositions'
import { LendingActions } from '@/components/LendingActions'
import { WithdrawActions } from '@/components/WithdrawActions'
import { useCurrentAccount } from '@mysten/dapp-kit'

export default function HomePage() {
  const currentAccount = useCurrentAccount()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-sui-blue rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">NeuSUI</h1>
                <p className="text-sm text-gray-500">Decentralized lending protocol</p>
              </div>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Dashboard */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* User Positions */}
          <div className="xl:col-span-1">
            <UserPositions />
          </div>

          {/* Actions */}
          <div className="xl:col-span-2 space-y-8">
            {/* Lending Actions */}
            <div>
              <LendingActions />
            </div>

            {/* Withdrawal Actions */}
            <div>
              <WithdrawActions />
            </div>
          </div>
        </div>

        {/* Delta Neutral Strategy Section */}
        <div className="mt-12 max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-8 border border-blue-100">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Delta Neutral Strategy</h3>
                <div className="prose prose-sm text-gray-700 space-y-4">
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      How Does It Work?
                    </h4>
                    <p className="text-gray-600 leading-relaxed">
                      When you deposit SUI as collateral, the system automatically allocates <strong>50% to staking</strong> and <strong>50% to short positions</strong>.
                      This implements a delta neutral strategy that generates stable returns regardless of SUI price movements.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 rounded-lg p-5 border border-green-200">
                      <h5 className="font-semibold text-green-800 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Staking Returns (50%)
                      </h5>
                      <p className="text-green-700 text-sm">
                        50% of your collateral is staked on the SUI network to earn validator rewards.
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-5 border border-purple-200">
                      <h5 className="font-semibold text-purple-800 mb-2 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Short Position Returns (50%)
                      </h5>
                      <p className="text-purple-700 text-sm">
                        The remaining 50% is invested in short positions to create additional return opportunities.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                    <h4 className="text-lg font-semibold text-orange-900 mb-3 flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      Return Guarantee
                    </h4>
                    <p className="text-orange-800 font-medium">
                      💰 <strong>Key Benefit:</strong> When repaying SUSD, you receive SUI with <span className="bg-yellow-200 px-2 py-1 rounded">higher value</span> than when you initially borrowed!
                    </p>
                    <p className="text-orange-700 text-sm mt-2">
                      The combination of staking rewards and short position returns allows you to recover SUI with higher value than your initial deposit. Because of the 50:50 long-short balance, even if SUI price rises significantly, you receive fewer SUI tokens but with much higher value.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="ml-3 text-lg font-semibold text-gray-900">Collateral Lending & Returns</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Borrow SUSD using SUI as collateral and earn stable returns through delta neutral strategy. Generate profits without price volatility risk.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <h4 className="ml-3 text-lg font-semibold text-gray-900">Enhanced Value Recovery</h4>
            </div>
            <p className="text-gray-600 text-sm">
              When you repay SUSD, you can receive SUI with higher value than your original investment. Staking and short position returns automatically accumulate.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="ml-3 text-lg font-semibold text-gray-900">Secure Protocol</h4>
            </div>
            <p className="text-gray-600 text-sm">
              Protected by smart contracts on the Sui blockchain. Oracle-based pricing ensures fair and transparent operations.
            </p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <div className="text-center">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">How It Works</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 max-w-6xl mx-auto">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-sui-blue rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold">1</span>
                </div>
                <h5 className="font-medium text-gray-900 mb-2">Connect Wallet</h5>
                <p className="text-sm text-gray-600">Connect your Sui wallet to get started</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-sui-blue rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold">2</span>
                </div>
                <h5 className="font-medium text-gray-900 mb-2">Lend SUI</h5>
                <p className="text-sm text-gray-600">Lend your SUI tokens to earn interest</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-sui-blue rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold">3</span>
                </div>
                <h5 className="font-medium text-gray-900 mb-2">Track Earnings</h5>
                <p className="text-sm text-gray-600">Monitor your lending positions and interest earned</p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-sui-blue rounded-full flex items-center justify-center mb-3">
                  <span className="text-white font-bold">4</span>
                </div>
                <h5 className="font-medium text-gray-900 mb-2">Withdraw Anytime</h5>
                <p className="text-sm text-gray-600">Withdraw your funds and earnings whenever needed</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}