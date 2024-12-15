<script lang="ts" setup></script>

<template>
	<div class="flex flex-col gap-2">
		<div class="flex-1">
			<TheBalance class="py-12 mb-2" />
		</div>

		<div class="grid grid-cols-2 gap-2 pb-4 mt-auto">
			<UiButton
				variant="secondary"
				size="lg"
				class="h-fit px-4 py-3"
			>
				<div class="flex flex-col items-start justify-start h-full w-full">
					<span class="text-sm">Top up</span>
					<span class="text-xs text-muted-foreground">
						Create Lightning invoice</span
					>
				</div>
			</UiButton>
			<UiButton
				variant="secondary"
				size="lg"
				class="h-fit px-4 py-3"
			>
				<div class="flex flex-col items-start justify-start h-full w-full">
					<span class="text-sm">Send</span>
					<span class="text-xs text-muted-foreground">
						Pay Lightning invoice
					</span>
				</div>
			</UiButton>
			<UiButton
				variant="default"
				size="lg"
				class="h-fit px-4 py-3"
			>
				<div class="flex flex-col items-start justify-start h-full w-full">
					<span class="text-sm">Redeem ecash</span>
					<span class="text-xs text-muted-foreground">
						Redeem a Cashu token
					</span>
				</div>
			</UiButton>
			<UiButton
				variant="default"
				size="lg"
				class="h-fit px-4 py-3"
			>
				<div class="flex flex-col items-start justify-start h-full w-full">
					<span class="text-sm">Send ecash</span>
					<span class="text-xs text-muted-foreground">
						Create a Cashu token
					</span>
				</div>
			</UiButton>
		</div>
	</div>
</template>
