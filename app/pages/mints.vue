<script lang="ts" setup>
import {
	CashuMint,
	CashuWallet,
	MintQuoteState,
	type MintQuoteResponse,
	type Proof,
} from '@cashu/cashu-ts'
import { StorageSerializers, useClipboard, useLocalStorage } from '@vueuse/core'
import { formatDate } from 'date-fns'
import { sum } from '~/lib/array'
import { useMintStore } from '~/store/mint'
import { useWalletStore } from '~/store/wallet'
import type { StoredQuote } from '~/types'

const pendingMintQuotes = useLocalStorage<StoredQuote[]>(
	'pending_mint_quotes',
	[],
	{ serializer: StorageSerializers.object }
)

const proofsByMint = useMintProofs()

const amount = ref()
const invoice = ref('')
const currentQuote = ref<MintQuoteResponse>()

const error = ref<string | null>(null)

const mintStore = useMintStore()
const walletStore = useWalletStore()

const { copy: copyInvoice, copied } = useClipboard({
	source: () => invoice.value,
})

function getMintBalance(mintUrl: string) {
	const mintProofs = proofsByMint.value[mintUrl] || []
	return sum(mintProofs.map((proof) => proof.amount))
}

async function setupMintsAndWallet() {
	try {
		error.value = null
		await mintStore.initAllMints()

		if (mintStore.currentMint) {
			walletStore.initWallet(mintStore.currentMint)
		}

		checkPendingQuotes()
	} catch (e) {
		console.error('Mints initialization error:', e)
		error.value = 'Failed to connect to mints.'
	}
}

async function requestMint() {
	if (!walletStore.wallet) return

	try {
		// 1. Create mint quote (get Lightning invoice)
		const mintQuote = await walletStore.wallet.createMintQuote(amount.value)
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
	if (!walletStore.wallet || !mintStore.currentMint?.mintUrl) return

	for (const quote of pendingMintQuotes.value) {
		try {
			// Add delay between checks to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 1000))

			const mintQuoteChecked = await walletStore.wallet.checkMintQuote(
				quote.quote
			)
			console.log('[mint quote checked]', mintQuoteChecked)

			if (mintQuoteChecked?.state === MintQuoteState.PAID) {
				const mintedProofs = await walletStore.wallet.mintProofs(
					quote.amount,
					quote.quote
				)
				console.log('[proofs]', mintedProofs)

				proofsByMint.value[mintStore.currentMint.mintUrl] ??= []

				proofsByMint.value[mintStore.currentMint.mintUrl] = [
					...proofsByMint.value[mintStore.currentMint.mintUrl]!,
					...mintedProofs,
				]

				removeQuoteFromPending(quote.quote)
			}
		} catch (e) {
			console.error('Error checking quote:', e)
			return
		}
	}
}

const currentBalance = computed(() => {
	if (!mintStore.currentMint?.mintUrl) {
		return 0
	}
	const mintProofs = proofsByMint.value[mintStore.currentMint.mintUrl] || []
	return sum(mintProofs.map((proof) => proof.amount))
})

const removeQuoteFromPending = (quoteId: string) => {
	pendingMintQuotes.value = pendingMintQuotes.value.filter(
		(q) => q.quote !== quoteId
	)
}

async function cancelQuote(quoteId: string) {
	removeQuoteFromPending(quoteId)

	// Clear invoice if it's the current quote
	if (currentQuote.value?.quote === quoteId) {
		invoice.value = ''
		currentQuote.value = undefined
	}
}

onMounted(() => {
	setupMintsAndWallet()
})
</script>

<template>
	<div class="pt-5">
		<h1 class="mb-4 text-2xl font-medium">Mints</h1>

		<UiCard
			v-if="error"
			class="mb-4 border-red-700 bg-red-500/10"
		>
			<UiCardHeader>
				<UiCardTitle class="text-red-600">Error</UiCardTitle>
				<UiCardDescription class="text-red-700">{{ error }}</UiCardDescription>
			</UiCardHeader>
		</UiCard>

		<div class="flex flex-col gap-4">
			<UiCard
				v-for="mint in mintStore.availableMints"
				:key="mint.url"
				:class="{
					'border-primary': mintStore.selectedMintUrl === mint.url,
				}"
			>
				<UiCardHeader>
					<UiCardTitle class="flex items-center justify-between">
						<span>{{ mint.name }}</span>
						<UiBadge
							v-if="mintStore.selectedMintUrl === mint.url"
							variant="outline"
						>
							Selected
						</UiBadge>
					</UiCardTitle>
					<UiCardDescription>{{ mint.url }}</UiCardDescription>
					<UiCardDescription v-if="mintStore.mintsInfo[mint.url]">
						{{ mintStore.mintsInfo[mint.url]?.description }}
					</UiCardDescription>
				</UiCardHeader>
				<UiCardContent>
					<div class="space-y-2">
						<p class="text-lg font-medium">
							Balance: {{ getMintBalance(mint.url) }} sats
						</p>
						<UiButton
							v-if="mintStore.selectedMintUrl !== mint.url"
							variant="outline"
							@click="mintStore.selectMint(mint.url)"
						>
							Set as default
						</UiButton>
					</div>
				</UiCardContent>
			</UiCard>
		</div>

		<div
			v-if="mintStore.currentMintInfo"
			class="mt-8"
		>
			<h2 class="mb-4 text-xl font-medium">Mint Tokens</h2>
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
					<UiButton @click="checkPendingQuotes">Check payment</UiButton>
				</div>

				<UiCard v-if="invoice">
					<UiCardHeader>
						<UiCardTitle>Lightning Invoice</UiCardTitle>
					</UiCardHeader>
					<UiCardContent>
						<pre class="whitespace-pre-wrap break-all font-mono text-sm">{{
							invoice
						}}</pre>

						<div class="flex items-center gap-2 mt-2">
							<UiButton
								@click="copyInvoice"
								size="sm"
								variant="secondary"
							>
								{{ copied ? 'Copied!' : 'Copy' }}
							</UiButton>
						</div>
					</UiCardContent>
				</UiCard>

				<UiCard v-if="pendingMintQuotes.length > 0">
					<UiCardHeader>
						<UiCardTitle>Pending Quotes</UiCardTitle>
					</UiCardHeader>
					<UiCardContent>
						<div class="flex flex-col gap-5">
							<div
								v-for="quote in pendingMintQuotes"
								:key="quote.quote"
							>
								<div class="flex flex-col gap-2">
									<div class="flex items-center gap-2">
										<span>{{ quote.amount }} sats</span>
										<UiBadge
											size="sm"
											:variant="
												quote.state === MintQuoteState.PAID
													? 'default'
													: 'destructive'
											"
										>
											{{ quote.state }}
										</UiBadge>
									</div>
									<span class="text-sm text-muted-foreground break-all">
										{{ quote.quote }}
									</span>
									<div class="flex items-center gap-2">
										<UiButton
											@click="checkPendingQuotes"
											size="sm"
											variant="secondary"
										>
											Check payment
										</UiButton>
										<UiButton
											@click="cancelQuote(quote.quote)"
											size="sm"
											variant="secondary"
										>
											Cancel
										</UiButton>
									</div>
								</div>
							</div>
						</div>
					</UiCardContent>
				</UiCard>
			</div>
		</div>
	</div>
</template>
