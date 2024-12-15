import { CashuMint, type GetInfoResponse } from '@cashu/cashu-ts'
import { defineStore } from 'pinia'

export const useMintStore = defineStore('mint', () => {
	const availableMints = [
		{
			url: 'https://mint.minibits.cash/Bitcoin',
			name: 'Minibits',
		},
		{
			url: 'https://mint2.nutmix.cash',
			name: 'Nutmix',
		},
	] as const

	const mintUrl = ref<CashuMint['_mintUrl']>(availableMints[0].url)
	const mintInfo = ref<GetInfoResponse | null>(null)
	const mint = ref<CashuMint>()

	const initMint = async () => {
		mint.value = new CashuMint(mintUrl.value)
		mintInfo.value = await mint.value.getInfo()
		return mint.value
	}

	// Update watcher to use store
	watch(mintUrl, () => {
		initMint()
	})

	return {
		availableMints,
		mintUrl,
		mintInfo,
		mint,
		initMint,
	}
})
