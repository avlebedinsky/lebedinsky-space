import { create } from 'zustand'
import { api } from '../lib/api'
import { DEFAULT_SETTINGS, applyTheme } from '../lib/theme'
import type { SiteSettings } from '../lib/types'

interface ThemeStore {
  settings: SiteSettings
  loading: boolean
  fetch: () => Promise<void>
  updateSettings: (next: SiteSettings) => Promise<void>
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loading: true,

  fetch: async () => {
    try {
      const s = await api.settings.get()
      set({ settings: s })
      applyTheme(s)
    } catch {
      applyTheme(get().settings)
    } finally {
      set({ loading: false })
    }
  },

  updateSettings: async (next: SiteSettings) => {
    set({ settings: next })
    applyTheme(next)
    await api.settings.update(next)
  },
}))
