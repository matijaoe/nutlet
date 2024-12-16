import { CashuWallet, type CashuMint } from '@cashu/cashu-ts'
import { defineStore } from 'pinia'
import type { WalletOptions } from '~/types'
		
export const useWalletStore = defineStore('wallet', () => {
	const wallet = shallowRef<CashuWallet>()

	const initWallet = async (mint: CashuMint, opts?: WalletOptions) => {
		wallet.value = new CashuWallet(mint, {
			unit: 'sat',
			...opts,
		})
	}

	return {
		wallet,
		initWallet,
	}
})
