import type { Proof } from '@cashu/cashu-ts'
import { useLocalStorage } from '@vueuse/core'

export const useProofs = () => useLocalStorage<Proof[]>('nutlet.proofs', [])
