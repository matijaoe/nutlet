import { CashuMint, type GetInfoResponse } from '@cashu/cashu-ts'
import { defineStore } from 'pinia'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'

export type MintConfig = {
	url: string
	name: string
}

const defaultMints: MintConfig[] = [
	{
		url: 'https://mint.minibits.cash/Bitcoin',
		name: 'Minibits',
	},
	{
		url: 'https://mint2.nutmix.cash',
		name: 'Nutmix',
	},
] as const

export const useMintStore = defineStore('mint', () => {
	const availableMints = useLocalStorage<MintConfig[]>(
		'available_mints',
		defaultMints,
		{ serializer: StorageSerializers.object }
	)

	const mintsInfo = ref<Record<string, GetInfoResponse | null>>({})
	const mints = ref<Record<string, CashuMint>>({})

	const selectedMintUrl = useLocalStorage<string | null>(
		'selected_mint_url',
		defaultMints[0]?.url || null
	)

	const currentMint = computed(() =>
		selectedMintUrl.value ? mints.value[selectedMintUrl.value] : null
	)
	const currentMintInfo = computed(() =>
		selectedMintUrl.value ? mintsInfo.value[selectedMintUrl.value] : null
	)

	const initMint = async (mintUrl: string) => {
		const mint = new CashuMint(mintUrl)
		try {
			const info = await mint.getInfo()
			mints.value[mintUrl] = mint
			mintsInfo.value[mintUrl] = info
			return mint
		} catch (e) {
			console.error(`Failed to init mint ${mintUrl}:`, e)
			mintsInfo.value[mintUrl] = null
			return null
		}
	}

	const initAllMints = async () => {
		await Promise.all(availableMints.value.map((mint) => initMint(mint.url)))
	}

	const selectMint = (mintUrl: string) => {
		selectedMintUrl.value = mintUrl
	}

	const addMint = (mint: MintConfig) => {
		if (!availableMints.value.some((m) => m.url === mint.url)) {
			availableMints.value.push(mint)
			initMint(mint.url)
		}
	}

	const removeMint = (mintUrl: string) => {
		availableMints.value = availableMints.value.filter((m) => m.url !== mintUrl)
		delete mints.value[mintUrl]
		delete mintsInfo.value[mintUrl]

		// If we removed the selected mint, select the first available one
		if (
			selectedMintUrl.value === mintUrl &&
			availableMints.value?.length > 0 &&
			availableMints.value[0]?.url
		) {
			selectedMintUrl.value = availableMints.value[0].url
		}
	}

	return {
		availableMints,
		selectedMintUrl,
		currentMint,
		currentMintInfo,
		mints,
		mintsInfo,
		initMint,
		initAllMints,
		selectMint,
		addMint,
		removeMint,
	}
})
