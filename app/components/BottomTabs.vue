<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router'

type TabId = 'ecash' | 'activity' | 'mints'

type Tab = {
	id: TabId
	label: string
	icon: string
	route?: RouteLocationRaw
}
const tabs: Tab[] = [
	{ id: 'ecash', label: 'ecash', icon: 'lucide:bitcoin', route: '/' },
	{
		id: 'activity',
		label: 'activity',
		icon: 'lucide:list-ordered',
		route: '/activity' as RouteLocationRaw,
	},
	{ id: 'mints', label: 'mints', icon: 'lucide:landmark', route: '/mints' },
]

const route = useRoute()
</script>

<template>
	<div class="flex items-center gap-2 justify-evenly py-2">
		<NuxtLink
			v-for="tab in tabs"
			:key="tab.id"
			:to="tab.route"
			:class="{
				'text-primary': route.path === tab.route,
				'text-muted-foreground': route.path !== tab.route,
			}"
			class="flex flex-col items-center"
			exact-active-class="text-primary"
		>
			<Icon
				:name="tab.icon"
				size="24"
			/>
			<span class="text-xs mt-0.5">{{ tab.label }}</span>
		</NuxtLink>
	</div>
</template>
