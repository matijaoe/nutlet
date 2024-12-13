export type Transaction = {
	id: string
	amount: number
	date: Date
	type: 'sent' | 'redeemed' | 'minted'
}
