<script lang="ts" setup>
import {
	getDecodedToken,
	getEncodedTokenV4,
	MintQuoteState,
	type MintQuoteResponse,
	type Proof,
	type Token,
} from '@cashu/cashu-ts'
import { StorageSerializers, useClipboard, useLocalStorage } from '@vueuse/core'
import { useQRCode } from '@vueuse/integrations/useQRCode'
import { sum } from '~/lib/array'
import { useMintStore } from '~/store/mint'
import { useWalletStore } from '~/store/wallet'
import type { StoredQuote } from '~/types'

const pendingMintQuotes = useLocalStorage<StoredQuote[]>(
	'nutlet.pending_mint_quotes',
	[],
	{ serializer: StorageSerializers.object }
)

const proofs = useProofs()
const amount = ref()
const invoice = ref('')
const invoiceQR = useQRCode(invoice)
const currentQuote = ref<MintQuoteResponse>()

const ecashAmount = ref()

const error = ref<string | null>(null)

const mintStore = useMintStore()
const walletStore = useWalletStore()

/**
 * Get proofs owned by a mint
 * @param mintUrl - The URL of the mint
 * @returns Proofs owned by the mint
 */
const getMintProofs = (mintUrl: string) => {
	const mint = mintStore.mints.find((mint) => mint.url === mintUrl)
	return proofs.value.filter((proof) =>
		mint?.keysets.some((keyset) => keyset.id === proof.id)
	)
}

/**
 * Remove proofs from the wallet
 * @param proofsToRemove - The proofs to remove
 */
const removeProofsFromWallet = (proofsToRemove: Proof[]) => {
	proofs.value = proofs.value.filter(
		(p) =>
			!proofsToRemove.some(
				(remove) =>
					remove.id === p.id &&
					remove.secret === p.secret &&
					remove.amount === p.amount
			)
	)
}

/**
 * Send ecash to a mint
 * @param amount - The amount of ecash to send
 * @returns The token to redeem
 */
const sendEcash = async (amount: number) => {
	if (!walletStore.wallet || !mintStore.activeMint?.url) return

	try {
		// Store pending transaction to prevent double-sends
		const pendingKey = `pending_${Date.now()}`
		localStorage.setItem(pendingKey, 'true')

		// 1. Get the split with current proofs
		console.log('active mint', mintStore.activeMint.url)
		console.log('wallet mint', walletStore.wallet?.mint.mintUrl)
		const proofsForMint = getMintProofs(mintStore.activeMint.url)
		const { keep, send } = await walletStore.wallet.send(amount, proofsForMint)

		// 2. Create and verify token first
		const tokenToSend = {
			proofs: send,
			mint: mintStore.activeMint?.url,
			unit: 'sat',
		} as Token

		const token = getEncodedTokenV4(tokenToSend)
		console.log('[token]', token)

		try {
			// 3. Verify token is valid and not spent
			const decodedToken = getDecodedToken(token)
			console.log('[decodedToken]', decodedToken)
			// Optional: Add mint verification here

			// 4. Only if verification passes, remove proofs
			removeProofsFromWallet(send)

			// Clear pending status
			localStorage.removeItem(pendingKey)

			return token
		} catch (error) {
			console.error('Token verification failed:', error)
			// Don't remove proofs if verification fails
			return null
		}
	} catch (error) {
		console.error('Error creating token:', error)
		return null
	}
}

const recoverMultipleLostTokens = async (tokens: string[]) => {
	try {
		for (const token of tokens) {
			try {
				const decodedToken = getDecodedToken(token)
				console.log(
					'Recovered amount:',
					decodedToken.proofs.reduce((sum, p) => sum + p.amount, 0)
				)
				proofs.value = [...proofs.value, ...decodedToken.proofs]
			} catch (error) {
				console.error('Error recovering token:', token.slice(0, 20) + '...')
			}
		}
		console.log('Recovery complete')
	} catch (error) {
		console.error('Error in recovery process:', error)
	}
}

// Manual recovery of lost proofs
const recoverLostProofs = async (token: string) => {
	try {
		const decodedToken = getDecodedToken(token)
		// Add these proofs back to wallet
		proofs.value = [...proofs.value, ...decodedToken.proofs]
		console.log('Recovered proofs from token')
	} catch (error) {
		console.error('Error recovering proofs:', error)
	}
}

const { copy: copyInvoice, copied } = useClipboard({
	source: invoice,
})

const getMintForProof = (proof: Proof) => {
	const mint = mintStore.mints.find((mint) =>
		mint.keysets.some((keyset) => keyset.id === proof.id)
	)
	return mint?.url
}

const getMintBalance = (mintUrl: string) => {
	const mint = mintStore.mints.find((mint) => mint.url === mintUrl)
	const mintKeysetIds = mint?.keysets.map((keyset) => keyset.id)
	const mintProofs = proofs.value.filter((proof) =>
		mintKeysetIds?.includes(proof.id)
	)
	return sum(mintProofs.map((proof) => proof.amount))
}

async function setupMintsAndWallet() {
	try {
		error.value = null
		await mintStore.initAllMints()

		// TODO: update wallet mint on active mint change?
		if (mintStore.activeMint) {
			walletStore.initWallet(mintStore.activeMint.mint, {
				keys: mintStore.activeMint.keys,
				keysets: mintStore.activeMint.keysets,
				mintInfo: mintStore.activeMint.info,
			})
		}

		checkPendingQuotes()
	} catch (e) {
		console.error('Mints initialization error:', e)
		error.value = 'Failed to connect to mints.'
	}
}

watch(
	() => mintStore.activeMint,
	(newActiveMint) => {
		if (newActiveMint) {
			walletStore.initWallet(newActiveMint.mint)
		}
	}
)

const isInvoiceRequestLoading = ref(false)
async function requestMint(mintUrl?: string) {
	if (!walletStore.wallet || !mintStore.activeMint?.url) return

	try {
		isInvoiceRequestLoading.value = true
		// 1. Create mint quote (get Lightning invoice)
		currentQuote.value = await walletStore.wallet.createMintQuote(amount.value)
		console.log('[mint quote]', currentQuote.value)
		console.log('active mint url', mintUrl || mintStore.activeMint?.url)

		// Store the quote for later with the amount
		pendingMintQuotes.value.push({
			...currentQuote.value,
			amount: amount.value, // Store the original amount with the quote
			mintUrl: mintUrl || mintStore.activeMint?.url,
		})

		invoice.value = currentQuote.value.request
		amount.value = undefined
	} catch (e) {
		console.error('Mint quote error:', e)
	} finally {
		isInvoiceRequestLoading.value = false
	}
}

async function checkPendingQuotes() {
	if (!walletStore.wallet || !mintStore.activeMint?.url) return

	for (const quote of pendingMintQuotes.value) {
		try {
			// Add delay between checks to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 500))

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

				proofs.value = [...proofs.value, ...(mintedProofs ?? [])]

				removeQuoteFromPending(quote.quote)

				invoice.value = ''
				currentQuote.value = undefined
				amount.value = undefined
			}
		} catch (e) {
			console.error('Error checking quote:', e)
			return
		}
	}
}

const checkQuote = async (quote: StoredQuote) => {
	const mintQuoteChecked = await walletStore.wallet?.checkMintQuote(quote.quote)
	console.log({ quote, mintQuoteChecked })
	console.log('[mint quote checked]', mintQuoteChecked)
	if (mintQuoteChecked?.state === MintQuoteState.PAID) {
		const mintedProofs = await walletStore.wallet?.mintProofs(
			quote.amount,
			quote.quote
		)
		console.log('[proofs]', mintedProofs)

		proofs.value = [...proofs.value, ...(mintedProofs ?? [])]

		removeQuoteFromPending(quote.quote)
	}
}

const totalBalance = computed(() => {
	const balances = mintStore.mints.map((mint) => getMintBalance(mint.url))
	return sum(balances)
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
		amount.value = undefined
	}
}

// Manual removal of spent token
const removeSpentToken = async (tokenString: string) => {
	try {
		// Decode the token
		const decodedToken = getDecodedToken(tokenString)
		console.log(
			'Token amount:',
			decodedToken.proofs.reduce((sum, p) => sum + p.amount, 0)
		)

		// Remove these proofs from wallet
		removeProofsFromWallet(decodedToken.proofs)

		// Log success
		console.log('Successfully removed spent token proofs')

		// // Optional: Update token history
		// const tokenHistory = JSON.parse(
		// 	localStorage.getItem('tokenHistory') || '[]'
		// ) as TokenHistory[]
		// const updatedHistory = tokenHistory.map((entry) =>
		// 	entry.token === tokenString ? { ...entry, status: 'sent' } : entry
		// )
		// localStorage.setItem('tokenHistory', JSON.stringify(updatedHistory))
	} catch (error) {
		console.error('Error removing spent token:', error)
	}
}

onMounted(() => {
	setupMintsAndWallet()
})
</script>

<template>
	<div class="pt-5">
		<div>wallet: {{ walletStore.wallet?.mint.mintUrl }}</div>
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

		<UiCard class="mb-4">
			<UiCardHeader>
				<UiCardTitle class="text-muted-foreground">Total</UiCardTitle>
				<UiCardDescription>
					<span class="text-2xl font-medium text-primary"
						>{{ totalBalance }} sats</span
					>
				</UiCardDescription>
			</UiCardHeader>
		</UiCard>

		<div class="flex flex-col gap-4">
			<UiCard
				v-for="mint in mintStore.mints"
				:key="mint.url"
				:class="{
					'border-primary': mintStore.activeMintUrl === mint.url,
				}"
			>
				<UiCardHeader class="pb-3">
					<UiCardTitle class="flex items-center justify-between">
						<span>{{ mint.info.name }}</span>
						<UiBadge
							v-if="mintStore.activeMintUrl === mint.url"
							variant="default"
						>
							Selected
						</UiBadge>
					</UiCardTitle>
					<UiCardDescription>{{ mint.url }}</UiCardDescription>
					<UiCardDescription v-if="mint.info.description">
						{{ mint.info.description }}
					</UiCardDescription>
				</UiCardHeader>
				<UiCardContent>
					<div class="flex flex-col items-start gap-2">
						<p class="text-lg font-medium">
							{{ getMintBalance(mint.url) }} sats
						</p>
						<UiButton
							size="sm"
							v-if="mintStore.activeMintUrl !== mint.url"
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
			v-if="mintStore.activeMint?.info"
			class="mt-8"
		>
			<section>
				<h2 class="mb-4 text-xl font-medium">Mint Tokens</h2>
				<div class="mt-4 space-y-4">
					<div class="flex items-center gap-2">
						<UiInput
							v-model.number="amount"
							type="number"
							:disabled="isInvoiceRequestLoading"
						/>
						<UiButton
							@click="requestMint()"
							:disabled="!amount || amount <= 0 || isInvoiceRequestLoading"
						>
							{{ isInvoiceRequestLoading ? 'Requesting...' : 'Mint' }}
						</UiButton>
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
						<UiCardContent class="flex flex-col gap-3">
							<span class="whitespace-pre-wrap break-all font-mono text-sm">
								{{ invoice }}
							</span>

							<data>
								<img
									:src="invoiceQR"
									alt="Lightning invoice QR code"
								/>
							</data>

							<div class="flex items-center justify-between gap-2">
								<UiButton
									@click="copyInvoice()"
									size="sm"
									variant="secondary"
								>
									{{ copied ? 'Copied!' : 'Copy invoice' }}
								</UiButton>
								<UiButton
									@click="cancelQuote(currentQuote!.quote)"
									size="sm"
									variant="outline"
								>
									Cancel
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
												:variant="
													quote.state === MintQuoteState.PAID
														? 'default'
														: 'destructive'
												"
											>
												{{ quote.state }}
											</UiBadge>
										</div>
										<UiBadge
											size="sm"
											variant="outline"
											class="w-fit"
										>
											{{ quote.mintUrl }}
										</UiBadge>
										<span class="text-sm text-muted-foreground break-all">
											{{ quote.quote }}
										</span>
										<div class="flex items-center gap-2">
											<UiButton
												@click="checkQuote(quote)"
												size="sm"
												variant="secondary"
											>
												Check payment
											</UiButton>
											<UiButton
												@click="cancelQuote(quote.quote)"
												size="sm"
												variant="outline"
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
			</section>

			<section class="flex flex-col gap-3 mt-3">
				<div class="flex items-center gap-2">
					<UiInput
						v-model.number="ecashAmount"
						type="number"
					/>
					<UiButton
						@click="sendEcash(ecashAmount)"
						:disabled="!ecashAmount || ecashAmount <= 0"
					>
						Generate ecash token
					</UiButton>
				</div>
				<UiButton @click="recoverMultipleLostTokens(lostTokens)"
					>Recover lost tokens</UiButton
				>
			</section>
		</div>
	</div>
</template>
