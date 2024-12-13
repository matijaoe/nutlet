<script lang="ts" setup>
import Avatar from 'vue-boring-avatars'

const exchangeRate = ref(990)
const avatarColors = ['#615050', '#776A6A', '#AD9A6F', '#F2E8D5', '#FCFCFC']
</script>

<template>
	<header>
		<div class="grid grid-cols-3 justify-between items-center gap-3 w-full">
			<Icon
				name="lucide:scan"
				size="24"
				class="text-left"
			/>
			<span class="justify-self-center text-muted-foreground font-mono text-sm">
				{{ exchangeRate }} sats/$
			</span>
			<Avatar
				class="justify-self-end"
				:size="28"
				variant="marble"
				name="hodler"
				:colors="avatarColors"
			/>
		</div>
	</header>
</template>
