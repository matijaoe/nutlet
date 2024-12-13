// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2024-11-01',
	ssr: false,
	devtools: { enabled: true },
	modules: ['@nuxtjs/tailwindcss', '@nuxt/icon', '@nuxt/fonts'],
	future: {
		compatibilityVersion: 4,
	},
	typescript: {
		tsConfig: {
			compilerOptions: {
				baseUrl: '.',
			},
		},
	},
	fonts: {
		families: [
			{
				name: 'Geist',
				provider: 'google',
			},
			{
				name: 'Geist Mono',
				provider: 'google',
			},
		],
	},
})
