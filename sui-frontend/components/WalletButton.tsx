'use client'

import { ConnectButton } from '@mysten/dapp-kit'

export function WalletButton() {
  return (
    <ConnectButton
      className="!bg-blue-600 !text-white hover:!bg-blue-700 !px-4 !py-2 !rounded-lg !font-semibold transition-colors"
    />
  )
}