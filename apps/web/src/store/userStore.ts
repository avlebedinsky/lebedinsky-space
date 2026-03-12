import { create } from 'zustand'
import { api } from '../lib/api'
import type { User } from '../lib/types'

interface UserStore {
  user: User | null
  loading: boolean
  fetch: () => Promise<void>
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  loading: true,

  fetch: async () => {
    try {
      const user = await api.me()
      set({ user })
    } catch {
      set({ user: null })
    } finally {
      set({ loading: false })
    }
  },
}))
