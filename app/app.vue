<template>
  <div class="p-6 max-w-md mx-auto min-h-screen flex flex-col" >
    <NuxtPage class="grow" />
  </div>
</template>

<style lang="postcss">
:root {
  color-scheme: dark;
}

body {
  @apply bg-black text-zinc-100
}
</style>

<script setup>
useHead({
  title: 'nutlet',
  description: 'cashu web wallet',
  meta: [
    {
      name: 'color-scheme',
      content: 'dark'
    }
  ]
})
</script>
