import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft, Shuffle, ExternalLink } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useThemeStore } from '../store/themeStore'
import { applyTheme, DEFAULT_SETTINGS } from '../lib/theme'
import { ColorPicker } from '../components/ColorPicker'
import type { SiteSettings } from '../lib/types'

export default function SettingsPage() {
  const { user, loading: userLoading } = useUserStore()
  const { settings, updateSettings } = useThemeStore()

  const [draft, setDraft] = useState<SiteSettings>(settings)
  const [bgMode, setBgMode] = useState<'color' | 'image'>(settings.bgImage ? 'image' : 'color')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setDraft(settings)
    setBgMode(settings.bgImage ? 'image' : 'color')
  }, [settings])

  useEffect(() => {
    applyTheme(draft)
  }, [draft])

  if (userLoading) return null
  if (!user?.isAdmin) return <Navigate to="/" replace />

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings(draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    setDraft(DEFAULT_SETTINGS)
    setBgMode('color')
    setSaving(true)
    try {
      await updateSettings(DEFAULT_SETTINGS)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleRandomPhoto = () => {
    set('bgImage', `https://picsum.photos/1920/1080?random=${Date.now()}`)
  }

  const bgPreviewStyle = bgMode === 'image' && draft.bgImage
    ? { backgroundImage: `url(${draft.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: draft.bgColor }

  return (
    <div className="min-h-screen px-4 py-16" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 flex items-center gap-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70"
          >
            <ArrowLeft size={13} /> Назад
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Внешний вид</h1>
        </header>

        <div className="flex flex-col gap-4">
          {/* Фон */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-white/25">Фон</h2>

            <div className="mb-5 flex gap-2">
              <button
                onClick={() => { setBgMode('color'); set('bgImage', '') }}
                className={`rounded-xl border px-4 py-2 text-sm transition ${bgMode === 'color' ? 'border-white/25 bg-white/10 text-white' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}
              >
                Цвет
              </button>
              <button
                onClick={() => setBgMode('image')}
                className={`rounded-xl border px-4 py-2 text-sm transition ${bgMode === 'image' ? 'border-white/25 bg-white/10 text-white' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'}`}
              >
                Изображение
              </button>
            </div>

            {bgMode === 'color' ? (
              <ColorPicker label="Цвет фона" value={draft.bgColor} onChange={v => set('bgColor', v)} />
            ) : (
              <div className="flex flex-col gap-3">
                <label className="flex flex-col gap-2">
                  <span className="text-xs text-white/40">URL изображения</span>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={draft.bgImage}
                      onChange={e => set('bgImage', e.target.value)}
                      placeholder="https://…"
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition focus:border-white/25"
                    />
                    <button
                      type="button"
                      onClick={handleRandomPhoto}
                      title="Случайное фото с Picsum"
                      className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/40 transition hover:border-white/20 hover:text-white/70"
                    >
                      <Shuffle size={14} /> Случайное
                    </button>
                  </div>
                </label>
                {draft.bgImage && (
                  <div className="h-28 w-full rounded-xl border border-white/10" style={bgPreviewStyle} />
                )}
              </div>
            )}
          </section>

          {/* Карточки */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-white/25">Карточки</h2>
            <div className="mb-5 grid grid-cols-2 gap-4">
              <ColorPicker label="Фон карточки" value={draft.cardColor} onChange={v => set('cardColor', v)} />
              <ColorPicker
                label="Цвет рамки"
                value={draft.borderColor.startsWith('#') && draft.borderColor.length === 9
                  ? `#${draft.borderColor.slice(1, 7)}`
                  : draft.borderColor.startsWith('#') ? draft.borderColor : '#ffffff'}
                onChange={v => set('borderColor', v)}
              />
            </div>
            {/* Превью карточки */}
            <div
              className="relative flex flex-col gap-3 rounded-2xl border p-5"
              style={{ backgroundColor: draft.cardColor, borderColor: draft.borderColor }}
            >
              <div className="flex size-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${draft.accentColor}20`, color: draft.accentColor }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Пример сервиса</p>
                <p className="mt-0.5 text-xs text-white/40">Описание сервиса</p>
              </div>
              <ExternalLink size={14} className="absolute right-4 top-4 text-white/20" />
            </div>
          </section>

          {/* Акцент */}
          <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-5 text-xs font-semibold uppercase tracking-widest text-white/25">Акцент</h2>
            <div className="flex items-center gap-6">
              <ColorPicker label="Акцентный цвет" value={draft.accentColor} onChange={v => set('accentColor', v)} />
              <div className="flex flex-col gap-1 pt-5">
                <span className="text-sm text-white/60">lebedinsky<span style={{ color: draft.accentColor }}>.space</span></span>
              </div>
            </div>
          </section>

          {/* Кнопки */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/40 transition hover:bg-white/5 hover:text-white/60 disabled:opacity-50"
            >
              Сбросить к умолчаниям
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
            >
              {saving ? 'Сохраняю…' : saved ? 'Сохранено ✓' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
