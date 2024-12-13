<script lang="ts" setup>
import { useId } from 'vue'

type Transaction = {
	id: string
	amount: number
	date: Date
	type: 'sent' | 'redeemed' | 'minted'
}

const transactions: Transaction[] = [
	{
		id: crypto.randomUUID(),
		amount: 150_000,
		date: new Date('2024-11-15T10:30:00'),
		type: 'redeemed',
	},
	{
		id: crypto.randomUUID(),
		amount: 50_000,
		date: new Date('2024-11-14T15:45:00'),
		type: 'sent',
	},
	{
		id: crypto.randomUUID(),
		amount: 25_000,
		date: new Date('2024-11-13T18:15:00'),
		type: 'sent',
	},
	{
		id: crypto.randomUUID(),
		amount: 200_000,
		date: new Date('2024-11-12T11:00:00'),
		type: 'redeemed',
	},
	{
		id: crypto.randomUUID(),
		amount: 100_000,
		date: new Date('2024-11-11T14:30:00'),
		type: 'sent',
	},
	{
		id: crypto.randomUUID(),
		amount: 500_000,
		date: new Date('2024-11-12T11:00:00'),
		type: 'minted',
	},
]
</script>

<template>
	<div class="flex flex-col gap-2">
		<TheTopBar />

		<div class="flex-1">
			<TheBalance class="py-6 mb-2" />

			<div class="flex-1">
				<TransactionList :transactions />
			</div>
		</div>

		<div class="grid grid-cols-2 gap-2 pb-4 mt-auto">
			<UiButton
				variant="outline"
				size="lg"
			>
				Mint
			</UiButton>
			<UiButton
				variant="outline"
				size="lg"
			>
				Melt
			</UiButton>
			<UiButton
				variant="secondary"
				size="lg"
			>
				Redeem
			</UiButton>
			<UiButton
				variant="secondary"
				size="lg"
			>
				Send
			</UiButton>
		</div>
	</div>
</template>
