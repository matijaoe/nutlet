<script lang="ts" setup>
import type { Transaction } from '~~/types'

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
	<div class="pt-5">
		<h1 class="mb-4 text-2xl font-medium">Activity</h1>
		<ActivityList :transactions />
	</div>
</template>
