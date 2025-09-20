'use client'

import { useState } from 'react'
import {
  useCurrentAccount,
  useConnectWallet,
  useDisconnectWallet,
  useWallets,
} from '@mysten/dapp-kit'

export function WalletButton() {
  const [isOpen, setIsOpen] = useState(false)
  const currentAccount = useCurrentAccount()
  const { mutate: connect } = useConnectWallet()
  const { mutate: disconnect } = useDisconnectWallet()
  const wallets = useWallets()


  const handleConnect = async (walletName: string) => {
    try {
      connect(
        { wallet: wallets.find(w => w.name === walletName) },
        {
          onSuccess: () => {
            setIsOpen(false)
          },
          onError: (error) => {
            console.error('Failed to connect wallet:', error)
          }
        }
      )
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    }
  }

  const handleDisconnect = () => {
    disconnect()
    setIsOpen(false)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (currentAccount) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-sui-blue text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          {formatAddress(currentAccount.address)}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            <div className="p-4 border-b border-gray-200">
              <p className="text-sm text-gray-500">Connected Account</p>
              <p className="font-mono text-xs break-all">{currentAccount.address}</p>
            </div>
            <button
              onClick={handleDisconnect}
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-sui-blue text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
      >
        Connect Wallet
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Connect a Wallet</h3>
            <p className="text-sm text-gray-500 mt-1">
              Choose a wallet to connect to the Sui network
            </p>
          </div>

          <div className="p-2">
            {wallets.length === 0 ? (
              <div className="px-3 py-6 text-center">
                <p className="text-sm text-gray-500 mb-2">No wallets detected</p>
                <p className="text-xs text-gray-400">
                  Please install a Sui wallet extension like Sui Wallet, Suiet, or Ethos
                </p>
              </div>
            ) : (
              wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  onClick={() => handleConnect(wallet.name)}
                  className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {wallet.icon && (
                    <img
                      src={wallet.icon}
                      alt={wallet.name}
                      className="w-8 h-8"
                    />
                  )}
                  <span className="font-medium text-gray-900">
                    {wallet.name}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}