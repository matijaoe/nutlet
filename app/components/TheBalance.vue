<script lang="ts" setup>
// $1 to sats
const exchangeRate = ref(990)

const sats = ref(2193875)

const fiatValue = computed(() => {
	return sats.value / exchangeRate.value
})

const formattedSats = computed(() => {
	return Intl.NumberFormat('en-US', {
		maximumFractionDigits: 0,
	}).format(sats.value)
})

const formattedFiat = computed(() => {
	return Intl.NumberFormat('en-US', {
		maximumFractionDigits: 2,
		style: 'currency',
		currency: 'USD',
	}).format(fiatValue.value)
})
</script>

<template>
	<div
		class="grid place-content-center items-center justify-center text-center"
	>
		<span class="text-secondary-foreground text-sm mb-2.5 italic">
			{{ formattedFiat }}
		</span>
		<span class="text-5xl font-black text-primary flex items-center italic">
			{{ formattedSats }}
		</span>
		<span class="text-muted-foreground mt-2 italic">sats</span>
	</div>
</template>
