'use client'

import { useState, useEffect } from 'react'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { ORACLE_OBJECT_ID, SUSD_COIN_TYPE } from '@/lib/suiClient'

const SUI_PRICE = 128.11 // Fixed SUI price

export function UserPositions() {
  const [userDeposit, setUserDeposit] = useState(0)
  const [susdBalance, setSusdBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const currentAccount = useCurrentAccount()
  const suiClient = useSuiClient() // 지갑에서 제공하는 SuiClient 사용

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentAccount?.address || !ORACLE_OBJECT_ID || ORACLE_OBJECT_ID === '0x0') {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        // Parallel fetch: 스테이킹 풀 포지션과 SUSD 잔고 동시 조회
        const [stakingPoolData, susdCoins] = await Promise.all([
          // 스테이킹 풀에서 사용자 포지션 조회
          suiClient.getObject({
            id: ORACLE_OBJECT_ID,
            options: { showContent: true },
          }),
          // SUSD 잔고 조회
          suiClient.getCoins({
            owner: currentAccount.address,
            coinType: SUSD_COIN_TYPE,
          })
        ])

        // 스테이킹 포지션 처리
        let deposit = 0
        if (stakingPoolData.data?.content) {
          const content = stakingPoolData.data.content as any
          const fields = content.fields

          if (fields.positions?.fields?.id) {
            try {
              const userPositionResult = await suiClient.getDynamicFieldObject({
                parentId: fields.positions.fields.id.id,
                name: {
                  type: 'address',
                  value: currentAccount.address,
                },
              })
              if (userPositionResult.data?.content) {
                deposit = parseInt((userPositionResult.data.content as any).fields.value.fields.deposited_amount)
              }
            } catch (error) {
              console.warn('No position found for user')
            }
          }
        }

        // SUSD 잔고 처리
        let totalSusdBalance = 0
        if (susdCoins.data && susdCoins.data.length > 0) {
          totalSusdBalance = susdCoins.data.reduce((total, coin) => {
            return total + parseInt(coin.balance)
          }, 0)
        }

        setUserDeposit(deposit)
        setSusdBalance(totalSusdBalance)
      } catch (error) {
        console.warn('Error fetching user data via wallet:', error)
        setUserDeposit(0)
        setSusdBalance(0)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [currentAccount?.address, suiClient])

  if (!currentAccount) {
    return null
  }

  if (false && false) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-500">Connect your wallet to view your positions and start lending</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                <div className="h-8 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatSUI = (amount: number) => {
    return (amount / 1_000_000_000).toFixed(4) + ' SUI'
  }

  const formatSUSD = (amount: number) => {
    return (amount / 1_000_000_000).toFixed(4) + ' SUSD'
  }

  const formatUSD = (suiAmount: number) => {
    const usdValue = (suiAmount / 1_000_000_000) * SUI_PRICE
    return '$' + usdValue.toFixed(2)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Your Positions</h2>

      {/* SUI Price Display */}
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">SUI Price</span>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-700">${SUI_PRICE}</div>
            <div className="text-xs text-blue-600">Fixed Rate</div>
          </div>
        </div>
      </div>

      <div className="space-y-6 mb-6">
        {/* Lending Position */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Your Lending</span>
            <span className="text-green-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-green-700">
            {formatSUI(userDeposit)}
          </div>
          <div className="text-sm text-green-600 mt-1">
            {formatUSD(userDeposit)}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Earning interest from borrowers
          </div>
        </div>

        {/* SUSD Balance */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">SUSD Balance</span>
            <span className="text-blue-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {formatSUSD(susdBalance)}
          </div>
          <div className="text-sm text-blue-600 mt-1">
            ≈ ${(susdBalance / 1_000_000_000).toFixed(2)} USD
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Stablecoin earned from lending
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-gray-200 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Total Lent</span>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              {formatSUI(userDeposit)}
            </div>
            <div className="text-sm text-gray-500">
              {formatUSD(userDeposit)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">SUSD Earned</span>
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">
              {formatSUSD(susdBalance)}
            </div>
            <div className="text-sm text-gray-500">
              ≈ ${(susdBalance / 1_000_000_000).toFixed(2)}
            </div>
          </div>
        </div>

        {(userDeposit > 0 || susdBalance > 0) && (
          <div className="mt-2 text-xs text-gray-500">
            Earning interest • Withdraw anytime
          </div>
        )}
      </div>
    </div>
  )
}