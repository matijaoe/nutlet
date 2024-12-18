import {
	CashuMint,
	type GetInfoResponse,
	type MintKeys,
	type MintKeyset,
} from '@cashu/cashu-ts'
import { defineStore } from 'pinia'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'

export type MintConfig = {
	url: string
	name: string
}

export const defaultMints: MintConfig[] = [
	{
		url: 'https://mint.minibits.cash/Bitcoin',
		name: 'Minibits',
	},
	{
		url: 'https://mint2.nutmix.cash',
		name: 'Nutmix',
	},
	{
		url: 'https://mint.lnvoltz.com',
		name: 'Voltz',
	},
] as const

type StoredMint = {
	url: CashuMint['_mintUrl']
	mint: CashuMint
	info: GetInfoResponse
	keys: MintKeys[]
	keysets: MintKeyset[]
}

export const useMintStore = defineStore('mint', () => {
	const mints = useLocalStorage<StoredMint[]>('cashu.mints', [])

	const getMint = (mintUrl: string) => {
		return mints.value.find((m) => m.url === mintUrl) || null
	}

	const activeMintUrl = useLocalStorage<string | null>(
		'cashu.active_mint_url',
		defaultMints[0]?.url || null
	)

	const activeMint = computed(() =>
		activeMintUrl.value ? getMint(activeMintUrl.value) : null
	)

	const initMint = async (mintUrl: string) => {
		const mint = new CashuMint(mintUrl)
		console.log('[initMint]', mintUrl)

		try {
			const info = await mint.getInfo()
			const { keysets } = await mint.getKeySets()
			const { keysets: keys } = await mint.getKeys()

			const storedMint: StoredMint = {
				url: mintUrl,
				mint,
				info,
				keysets,
				keys,
			}

			// check if the mint is already in the list, if so, update it
			const index = mints.value.findIndex((m) => m.url === mintUrl)
			if (index !== -1) {
				mints.value[index] = storedMint
			} else {
				mints.value.push(storedMint)
			}
			return mint
		} catch (e) {
			console.error(`Failed to init mint ${mintUrl}:`, e)
			return null
		}
	}

	const initAllMints = async () => {
		await Promise.all(defaultMints.map((mint) => initMint(mint.url)))
	}

	const selectMint = (mintUrl: string) => {
		if (mints.value.some((m) => m.url === mintUrl)) {
			activeMintUrl.value = mintUrl
		} else {
			activeMintUrl.value = defaultMints[0]?.url || null
			console.error(
				`Mint ${mintUrl} not found, selecting default mint ${defaultMints[0]?.url}`
			)
		}
	}

	return {
		activeMintUrl,
		activeMint,
		mints,
		initMint,
		initAllMints,
		selectMint,
	}
})
