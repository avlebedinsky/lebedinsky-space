import type { SiteSettings } from './types'

export const DEFAULT_SETTINGS: SiteSettings = {
  bgColor: '#030712',
  bgImage: '',
  cardColor: '#111827',
  accentColor: '#818cf8',
  borderColor: '#1f2937',
  textColor: '#ffffff',
  gridOrder: ['clock', 'weather', 'metrics'],
  hiddenWidgets: [],
  widgetSpans: {},
  kbRepoURL: '',
  kbGithubToken: '',
  kbAllowedFolders: [],
}

export function applyTheme(settings: SiteSettings) {
  document.documentElement.style.setProperty('--color-bg', settings.bgColor)
  document.documentElement.style.setProperty('--color-card', settings.cardColor)
  document.documentElement.style.setProperty('--color-accent', settings.accentColor)
  document.documentElement.style.setProperty('--color-border', settings.borderColor)
  document.documentElement.style.setProperty('--color-text', settings.textColor || '#ffffff')
}
