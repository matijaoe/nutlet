<script lang="ts" setup>
import { Button } from '~/components/ui/button'
</script>

<template>
	<div class="flex flex-col gap-2">
		<header>
			<h1 class="italic text-xl text-orange-300">nutlet</h1>
			<p class="italic">cashu web wallet</p>
		</header>

		<div class="grid grid-cols-2 gap-2 pb-4 mt-auto">
			<Button size="lg">Redeem</Button>
			<Button size="lg">Send</Button>
		</div>
	</div>
</template>
