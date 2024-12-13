<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router'

type TabId = 'ecash' | 'history' | 'mints'
type Tab = {
	id: TabId
	label: string
	icon: string
	route?: RouteLocationRaw
}
const tabs: Tab[] = [
	{ id: 'ecash', label: 'ecash', icon: 'lucide:bitcoin' },
	{ id: 'history', label: 'history', icon: 'lucide:list-ordered' },
	{ id: 'mints', label: 'mints', icon: 'lucide:landmark' },
]

const getTabById = (id: TabId) => tabs.find((tab) => tab.id === id)

const selectedTabId = ref<TabId>('ecash')
const selectedTab = computed(() => getTabById(selectedTabId.value!))

const setTab = (tab: TabId) => {
	selectedTabId.value = tab
}
</script>

<template>
	<div class="flex items-center gap-2 justify-evenly py-2">
		<button
			v-for="tab in tabs"
			:key="tab.id"
			@click="setTab(tab.id)"
			:class="{
				'text-primary': selectedTabId === tab.id,
				'text-muted-foreground': selectedTabId !== tab.id,
			}"
			class="flex flex-col items-center"
		>
			<Icon
				:name="tab.icon"
				size="24"
			/>
			<span class="text-xs mt-0.5">{{ tab.label }}</span>
		</button>
	</div>
</template>
