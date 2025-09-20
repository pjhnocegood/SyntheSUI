'use client'

import { useState } from 'react'
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit'
import { Transaction } from '@mysten/sui/transactions'
import { ORACLE_OBJECT_ID, ORACLE_PACKAGE_ID, TREASURY_OBJECT_ID, PRICE_ORACLE_ID } from '@/lib/suiClient'

const SUI_PRICE = 128.11 // Fixed SUI price
const SUI_NETWORK = process.env.NEXT_PUBLIC_SUI_NETWORK || 'devnet'

// 디버깅을 위한 환경 변수 출력
console.log('🔧 Environment Variables:')
console.log('SUI_NETWORK:', process.env.NEXT_PUBLIC_SUI_NETWORK)


export function LendingActions() {
  const [depositAmount, setDepositAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentAccount = useCurrentAccount()
  const { mutate: signAndExecute } = useSignAndExecuteTransaction()
  const suiClient = useSuiClient() // 지갑에서 제공하는 SuiClient 사용 (CORS 문제 없음)

  const calculateUSDValue = (suiAmount: string) => {
    if (!suiAmount || isNaN(parseFloat(suiAmount))) return 0
    return parseFloat(suiAmount) * SUI_PRICE
  }

  const formatUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const handleDeposit = async () => {
    console.log('🚀 Deposit started')
    console.log('Current account:', currentAccount?.address)
    console.log('Deposit amount:', depositAmount)
    console.log('Oracle Object ID:', ORACLE_OBJECT_ID)
    console.log('Oracle Package ID:', ORACLE_PACKAGE_ID)

    if (!currentAccount || !depositAmount || !ORACLE_OBJECT_ID || ORACLE_OBJECT_ID === '0x0') {
      const errorMsg = 'Please connect wallet and ensure contract is deployed'
      console.error('❌ Validation failed:', errorMsg)
      setError(errorMsg)
      return
    }

    try {
      setLoading(true)
      setError(null)
      console.log('💰 Creating transaction...')

      const tx = new Transaction()
      const amountInMist = Math.floor(parseFloat(depositAmount) * 1_000_000_000) // Convert SUI to MIST
      console.log('Amount in MIST:', amountInMist)

      // ZKLogin epoch 문제 해결을 위한 설정
      tx.setSender(currentAccount.address)

      // 가스 예산 설정 (줄임)
      tx.setGasBudget(30000000) // 0.03 SUI
      console.log('👤 Sender set:', currentAccount.address)
      console.log('⛽ Gas budget set: 0.03 SUI')

      // Split coin for deposit
      const [coin] = tx.splitCoins(tx.gas, [amountInMist])
      console.log('✂️ Coin split created')

      // Sui System 객체, Treasury 및 Oracle 참조
      tx.moveCall({
        target: `${ORACLE_PACKAGE_ID}::lending_pool_with_staking::deposit_and_stake_sui`,
        arguments: [
          tx.object(ORACLE_OBJECT_ID),
          tx.object(TREASURY_OBJECT_ID), // Treasury Object
          tx.object(PRICE_ORACLE_ID), // Price Oracle Object
          tx.object('0x5'), // Sui System Object (고정값)
          coin,
        ],
      })
      console.log('📞 Move call added to transaction')

      console.log('🔐 Sending to wallet for signature...')

      // 지갑을 통한 트랜잭션 실행 (지갑 RPC 사용으로 CORS 문제 없음)
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: (result) => {
            console.log('✅ Transaction successful:', result)
            console.log('Transaction digest:', result?.digest)
            setDepositAmount('')
            alert('Your SUI collateral deposit was successful! You received SUSD. Transaction: ' + result?.digest)
            // Refresh the page to update user positions
            setTimeout(() => window.location.reload(), 1000)
          },
          onError: (error) => {
            console.error('❌ Deposit failed:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))
            setError('Deposit failed: ' + (error?.message || 'Unknown error'))
            setLoading(false)
          },
        }
      )
    } catch (err) {
      console.error('❌ Error creating deposit transaction:', err)
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack trace')
      setError('Error creating transaction: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  if (!currentAccount) {
    return null
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Lend SUI</h3>
        <p className="text-sm text-gray-600">Deposit your SUI tokens to earn interest from borrowers</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lend Amount (SUI)
          </label>
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sui-blue focus:border-transparent"
            step="0.01"
            min="0"
          />

          {/* USD Value Display */}
          <div className="mt-2 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">SUI Price:</span> ${SUI_PRICE}
            </div>
            {depositAmount && parseFloat(depositAmount) > 0 && (
              <div className="text-right">
                <div className="text-lg font-semibold text-green-600">
                  {formatUSD(calculateUSDValue(depositAmount))}
                </div>
                <div className="text-xs text-gray-500">
                  USD Value
                </div>
              </div>
            )}
          </div>

          {depositAmount && parseFloat(depositAmount) > 0 && (
            <div className="mt-2 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <div className="flex items-center">
                <div className="text-green-600 mr-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    You will lend: {parseFloat(depositAmount).toFixed(4)} SUI
                  </p>
                  <p className="text-xs text-green-700">
                    Worth approximately {formatUSD(calculateUSDValue(depositAmount))} at current price
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleDeposit}
          disabled={loading || !depositAmount || parseFloat(depositAmount) <= 0}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Processing...' : 'Lend SUI'}
        </button>

        <div className="text-xs text-gray-500">
          <p>• Lending earns interest from borrowers</p>
          <p>• You can withdraw your funds anytime (subject to liquidity)</p>
          <p>• Your SUI helps provide liquidity to the pool</p>
        </div>
      </div>
    </div>
  )
}