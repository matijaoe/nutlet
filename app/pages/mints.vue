<script lang="ts" setup>
import {
	CashuMint,
	CashuWallet,
	MintQuoteState,
	type GetInfoResponse,
	type MintQuoteResponse,
	type Proof,
} from '@cashu/cashu-ts'
import { StorageSerializers, useLocalStorage } from '@vueuse/core'

// Add available mints
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

// Change mintUrl to be writable
const mintUrl = ref<CashuMint['_mintUrl']>(availableMints[0].url)

const mint = ref<CashuMint>()
const mintInfo = ref<GetInfoResponse | null>(null)

// Store the wallet state
const wallet = shallowRef<CashuWallet>()

// Add amount to the stored quote type
type StoredQuote = MintQuoteResponse & { amount: number }

// Update the storage type
const pendingMintQuotes = useLocalStorage<StoredQuote[]>(
	'pending_mint_quotes',
	[],
	{
		serializer: StorageSerializers.object,
	}
)

// Change the proofs storage to be organized by mint URL
const proofsByMint = useLocalStorage<Record<string, Proof[]>>(
	'proofs_by_mint',
	{},
	{
		serializer: StorageSerializers.object,
	}
)

const amount = ref()
const invoice = ref('')
const currentQuote = ref<MintQuoteResponse | null>(null)

const error = ref<string | null>(null)

// Add watcher for mint changes
watch(mintUrl, () => {
	initializeMint()
})

async function initializeMint() {
	try {
		error.value = null
		mint.value = new CashuMint(mintUrl.value)

		// Just store current mint info in ref
		mintInfo.value = await mint.value.getInfo()
		console.log('[mint info]', mintInfo.value)

		wallet.value = new CashuWallet(mint.value, {
			unit: 'sat',
		})

		checkPendingQuotes()
	} catch (e) {
		console.error('Mint initialization error:', e)
		error.value = 'Failed to connect to mint.'
	}
}

async function requestMint() {
	if (!wallet.value) return

	try {
		// 1. Create mint quote (get Lightning invoice)
		const mintQuote = await wallet.value.createMintQuote(amount.value)
		console.log('[mint quote]', mintQuote)

		// Store the quote for later with the amount
		currentQuote.value = mintQuote
		pendingMintQuotes.value.push({
			...mintQuote,
			amount: amount.value, // Store the original amount with the quote
		})

		invoice.value = mintQuote.request
	} catch (e) {
		console.error('Mint quote error:', e)
	}
}

async function checkPendingQuotes() {
	if (!wallet.value || !mint.value?.mintUrl) return

	for (const quote of pendingMintQuotes.value) {
		try {
			// Add delay between checks to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const mintQuoteChecked = await wallet.value.checkMintQuote(quote.quote)
			console.log('[mint quote checked]', mintQuoteChecked)

			if (mintQuoteChecked?.state === MintQuoteState.PAID) {
				const mintedProofs = await wallet.value.mintProofs(
					quote.amount,
					quote.quote
				)
				console.log('[proofs]', mintedProofs)

				proofsByMint.value[mint.value.mintUrl] ??= []

				proofsByMint.value[mint.value.mintUrl] = [
					...proofsByMint.value[mint.value.mintUrl]!,
					...mintedProofs,
				]

				pendingMintQuotes.value = pendingMintQuotes.value.filter(
					(q: StoredQuote) => q.quote !== quote.quote
				)
			}
		} catch (e) {
			console.error('Error checking quote:', e)
			// Check if it's a rate limit error (429 status code)
			if (e instanceof Error && e.message.includes('429')) {
				error.value =
					'Rate limited by mint. Please wait a moment and try again.'
				return // Stop checking other quotes
			}
		}
	}
}

// Update the balance calculation
const currentBalance = computed(() => {
	if (!mint.value?.mintUrl) return 0
	const mintProofs = proofsByMint.value[mint.value.mintUrl] || []
	return mintProofs.reduce(
		(total: number, proof: Proof) => total + proof.amount,
		0
	)
})

onMounted(() => {
	initializeMint()
})
</script>

<template>
	<div class="pt-5">
		<h1 class="mb-4 text-2xl font-medium">Mints</h1>

		<!-- Add mint selector -->
		<UiCard class="mb-4">
			<UiCardHeader>
				<UiCardTitle>Select Mint</UiCardTitle>
			</UiCardHeader>
			<UiCardContent>
				<div class="flex flex-wrap gap-2">
					<UiButton
						v-for="availableMint in availableMints"
						:key="availableMint.url"
						:variant="mintUrl === availableMint.url ? 'default' : 'outline'"
						@click="mintUrl = availableMint.url"
					>
						{{ availableMint.name }}
					</UiButton>
				</div>
			</UiCardContent>
		</UiCard>

		<UiCard
			v-if="error"
			class="mb-4 border-red-700 bg-red-500/10"
		>
			<UiCardHeader>
				<UiCardTitle class="text-red-600">Error</UiCardTitle>
				<UiCardDescription class="text-red-700">{{ error }}</UiCardDescription>
			</UiCardHeader>
		</UiCard>

		<UiCard v-if="mintInfo">
			<UiCardHeader>
				<UiCardTitle>{{ mintInfo.name }}</UiCardTitle>
				<UiCardDescription>{{ mint?.mintUrl }}</UiCardDescription>
				<UiCardDescription>{{ mintInfo.description }}</UiCardDescription>
			</UiCardHeader>
			<UiCardContent>
				<p class="text-lg font-medium">Balance: {{ currentBalance }} sats</p>
			</UiCardContent>
		</UiCard>

		<div class="mt-4 space-y-4">
			<div class="flex items-center gap-2">
				<UiInput
					v-model.number="amount"
					type="number"
				/>
				<UiButton
					@click="requestMint"
					:disabled="!amount || amount <= 0"
					>Mint</UiButton
				>
			</div>

			<div
				v-if="pendingMintQuotes.length > 0"
				class="flex items-center gap-2"
			>
				<UiButton @click="checkPendingQuotes">Check Payment</UiButton>
			</div>

			<UiCard v-if="invoice">
				<UiCardHeader>
					<UiCardTitle>Lightning Invoice</UiCardTitle>
				</UiCardHeader>
				<UiCardContent>
					<pre class="whitespace-pre-wrap break-all font-mono text-sm">{{
						invoice
					}}</pre>
				</UiCardContent>
			</UiCard>
		</div>
	</div>
</template>
