'use client'

import { useState, useEffect } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { ORACLE_OBJECT_ID, ORACLE_PACKAGE_ID, TREASURY_OBJECT_ID, PRICE_ORACLE_ID, SUSD_COIN_TYPE } from '@/lib/suiClient'

const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'devnet'

export function WithdrawActions() {
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userDeposit, setUserDeposit] = useState(0)
  const [userSusdBalance, setUserSusdBalance] = useState(0)
  const [dataLoading, setDataLoading] = useState(true)

  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const suiClient = useSuiClient() // 지갑에서 제공하는 SuiClient 사용

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentAccount?.address || !ORACLE_OBJECT_ID || ORACLE_OBJECT_ID === '0x0') {
        setDataLoading(false)
        return
      }

      try {
        setDataLoading(true)

        // 사용자의 SUSD 잔고 조회
        const susdCoins = await suiClient.getCoins({
          owner: currentAccount.address,
          coinType: SUSD_COIN_TYPE,
        })

        const totalSusdBalance = susdCoins.data?.reduce((total, coin) => total + parseInt(coin.balance), 0) || 0
        setUserSusdBalance(totalSusdBalance)

        // 스테이킹 풀에서 사용자 포지션 조회 (참고용)
        const stakingPoolObject = await suiClient.getObject({
          id: ORACLE_OBJECT_ID,
          options: { showContent: true },
        })

        if (stakingPoolObject.data?.content) {
          const content = stakingPoolObject.data.content as any
          const fields = content.fields

          let deposit = 0
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
          setUserDeposit(deposit)
        }
      } catch (error) {
        console.warn('Error fetching user data via wallet:', error)
        setUserDeposit(0)
        setUserSusdBalance(0)
      } finally {
        setDataLoading(false)
      }
    }

    fetchUserData()
  }, [currentAccount?.address, suiClient])

  const handleWithdraw = async () => {
    if (!currentAccount || !withdrawAmount || !ORACLE_OBJECT_ID || ORACLE_OBJECT_ID === '0x0') {
      setError('Please connect wallet and ensure contract is deployed')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const tx = new Transaction()
      const amountInMist = Math.floor(parseFloat(withdrawAmount) * 1_000_000_000) // Convert SUSD to MIST

      // ZKLogin epoch 문제 해결을 위한 설정
      tx.setSender(currentAccount.address)
      tx.setGasBudget(30000000) // 0.03 SUI (가스비 줄임)
      console.log('👤 Sender set for withdrawal:', currentAccount.address)
      console.log('⛽ Gas budget set: 0.03 SUI')

      // 사용자의 SUSD 코인들을 가져와서 필요한 만큼 합치기
      const susdCoins = await suiClient.getCoins({
        owner: currentAccount.address,
        coinType: SUSD_COIN_TYPE,
      })

      if (!susdCoins.data || susdCoins.data.length === 0) {
        setError('No SUSD balance available.')
        setLoading(false)
        return
      }

      let totalSusdBalance = susdCoins.data.reduce((total, coin) => total + parseInt(coin.balance), 0)

      if (totalSusdBalance < amountInMist) {
        setError('Insufficient SUSD balance.')
        setLoading(false)
        return
      }

      // SUSD 코인들을 하나로 합치기
      if (susdCoins.data.length > 1) {
        const [primaryCoin, ...otherCoins] = susdCoins.data
        if (otherCoins.length > 0) {
          tx.mergeCoins(
            tx.object(primaryCoin.coinObjectId),
            otherCoins.map(coin => tx.object(coin.coinObjectId))
          )
        }
      }

      // 필요한 양만큼 분할
      const [paymentCoin] = tx.splitCoins(tx.object(susdCoins.data[0].coinObjectId), [amountInMist])

      // Withdrawal 함수 호출 (SUSD를 burn하고 SUI를 받음)
      tx.moveCall({
        target: `${ORACLE_PACKAGE_ID}::lending_pool_with_staking::unstake_and_withdraw_sui`,
        arguments: [
          tx.object(ORACLE_OBJECT_ID),
          tx.object(TREASURY_OBJECT_ID), // Treasury Object
          tx.object(PRICE_ORACLE_ID), // Price Oracle Object
          tx.object('0x5'), // Sui System Object (고정값)
          paymentCoin, // SUSD payment
        ],
      })

      // 지갑을 통한 트랜잭션 실행 (순수 지갑 서명 방식)
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('Withdrawal successful:', result)
            setWithdrawAmount('')
            alert('Withdrawal successful!')
            // Refresh the page to update user positions
            setTimeout(() => window.location.reload(), 1000)
          },
          onError: (error) => {
            console.error('Withdrawal failed:', error)
            setError('Withdrawal failed: ' + (error?.message || 'Unknown error'))
          },
        }
      )
    } catch (err) {
      console.error('Error creating withdraw transaction:', err)
      setError('Error creating transaction: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return (amount / 1_000_000_000).toFixed(4); // Convert from MIST to token units
  };

  if (!currentAccount) {
    return null
  }

  if (dataLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sui-blue mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your positions...</p>
        </div>
      </div>
    )
  }

  const hasDeposits = userDeposit > 0;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Withdraw</h3>
        <p className="text-sm text-gray-600">Withdraw your lent SUI tokens</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-700">Your SUSD Balance</span>
          <span className="text-lg font-bold text-blue-700">
            {formatCurrency(userSusdBalance)} SUSD
          </span>
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-green-700">Collateral Deposited</span>
          <span className="text-lg font-bold text-green-700">
            {formatCurrency(userDeposit)} SUI
          </span>
        </div>
      </div>

      {userSusdBalance === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </div>
          <p className="text-gray-500">No SUSD to repay</p>
          <p className="text-sm text-gray-400">You need SUSD tokens to withdraw your SUI collateral</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SUSD Amount to Repay
            </label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sui-blue focus:border-transparent"
              step="0.01"
              min="0"
              max={formatCurrency(userSusdBalance)}
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>Available: {formatCurrency(userSusdBalance)} SUSD</span>
              <button
                onClick={() => setWithdrawAmount(formatCurrency(userSusdBalance))}
                className="text-sui-blue hover:text-blue-700"
              >
                Max
              </button>
            </div>
          </div>

          <button
            onClick={handleWithdraw}
            disabled={
              loading ||
              !withdrawAmount ||
              parseFloat(withdrawAmount) <= 0 ||
              parseFloat(withdrawAmount) > parseFloat(formatCurrency(userSusdBalance))
            }
            className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Repay SUSD & Withdraw SUI'}
          </button>

          <div className="text-xs text-gray-500">
            <p>• Repay SUSD to withdraw your SUI collateral with earned returns</p>
            <p>• You'll receive SUI with higher value due to staking and short position profits</p>
          </div>
        </div>
      )}
    </div>
  )
}