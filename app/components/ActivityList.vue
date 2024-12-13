<script lang="ts" setup>
defineProps<{
	transactions: Transaction[]
}>()

type Transaction = {
	id: string
	amount: number
	date: Date
	type: 'sent' | 'redeemed' | 'minted'
}

const formatAmount = (amount: number) => {
	return Intl.NumberFormat('en-US', {
		maximumFractionDigits: 0,
	}).format(amount)
}

const prefixAmount = (amount: number, type: string) => {
	switch (type) {
		case 'sent':
			return ''
		case 'redeemed':
			return '+'
		case 'minted':
			return '+'
	}
}

const formatDate = (date: Date) => {
	return Intl.DateTimeFormat('en-GB', {
		dateStyle: 'medium',
		timeStyle: 'short',
	}).format(date)
}

const formatFiat = (sats: number, rate: number = 990) => {
	return Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 2,
	}).format(sats / rate)
}
</script>

<template>
	<div class="flex flex-col gap-2">
		<div
			v-for="tx in transactions"
			:key="tx.id"
			class="flex items-start justify-between py-1"
		>
			<div class="flex flex-col gap-1">
				<span class="text-sm text-foreground">
					{{ tx.type }}
					{{ tx.type === 'minted' ? '⚡' : '' }}
				</span>
				<span class="text-xs text-muted-foreground">
					{{ formatDate(tx.date) }}
				</span>
			</div>
			<div class="flex flex-col items-end">
				<span
					class="text-sm"
					:class="{
						'text-foreground': tx.type === 'sent',
						'text-green-500': tx.type === 'redeemed',
						'text-yellow-500': tx.type === 'minted',
					}"
				>
					{{ prefixAmount(tx.amount, tx.type)
					}}{{ formatAmount(tx.amount) }} sats
				</span>
				<span class="text-xs text-muted-foreground">
					{{ formatFiat(tx.amount) }}
				</span>
			</div>
		</div>
	</div>
</template>
