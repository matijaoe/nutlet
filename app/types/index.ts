import type { MintKeys, MintQuoteResponse } from '@cashu/cashu-ts'

import type { MintKeyset } from '@cashu/cashu-ts'

import type { GetInfoResponse } from '@cashu/cashu-ts'

export type Transaction = {
	id: string
	amount: number
	date: Date
	type: 'sent' | 'redeemed' | 'minted'
}

export type WalletOptions = {
	unit?: string
	keys?: Array<MintKeys> | MintKeys
	keysets?: Array<MintKeyset>
	mintInfo?: GetInfoResponse
	bip39seed?: Uint8Array
	denominationTarget?: number
}

export type StoredQuote = MintQuoteResponse & { amount: number }
