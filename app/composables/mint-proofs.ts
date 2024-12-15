import type { CashuMint, Proof } from '@cashu/cashu-ts'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'

export const useMintProofs = () =>
	useLocalStorage<Record<CashuMint['_mintUrl'], Proof[]>>(
		'proofs_by_mint',
		{},
		{ serializer: StorageSerializers.object }
	)
