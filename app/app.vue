<script lang="ts" setup>
useHead({
	title: 'nutlet',
	meta: [
		{
			name: 'color-scheme',
			content: 'dark',
		},
	],
})
</script>

<template>
	<Body class="dark">
		<div class="py-4 px-5 max-w-sm mx-auto min-h-screen flex flex-col">
			<TheTopBar />

			<NuxtPage class="grow" />

			<BottomTabs class="shrink-0 mt-auto" />
		</div>
	</Body>
</template>

<style>
.dark {
	color-scheme: dark;
}
</style>
