import { useState, useEffect } from 'react'
import { Shuffle, ExternalLink } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { DEFAULT_SETTINGS } from '../lib/theme'
import { ColorPicker } from './ColorPicker'
import { ConfirmDialog } from './ConfirmDialog'
import type { SiteSettings } from '../lib/types'

interface AppearanceFormProps {
  onCancel?: () => void
  onSaved?: () => void
}

export function AppearanceForm({ onCancel, onSaved }: AppearanceFormProps) {
  const { settings, updateSettings } = useThemeStore()
  const [draft, setDraft] = useState<SiteSettings>(settings)
  const [bgMode, setBgMode] = useState<'color' | 'image'>(settings.bgImage ? 'image' : 'color')
  const [saving, setSaving] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    setDraft(settings)
    setBgMode(settings.bgImage ? 'image' : 'color')
  }, [settings])

  const set = <K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) => {
    setDraft(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings(draft)
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    const resetAppearance: SiteSettings = {
      ...settings,
      bgColor: DEFAULT_SETTINGS.bgColor,
      bgImage: DEFAULT_SETTINGS.bgImage,
      cardColor: DEFAULT_SETTINGS.cardColor,
      accentColor: DEFAULT_SETTINGS.accentColor,
      borderColor: DEFAULT_SETTINGS.borderColor,
      textColor: DEFAULT_SETTINGS.textColor,
    }
    setDraft(resetAppearance)
    setBgMode('color')
    setSaving(true)
    try {
      await updateSettings(resetAppearance)
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-subtle">Фон</p>
        <div className="mb-4 inline-flex rounded-xl border border-gray-700 bg-gray-800 p-0.5">
          <button
            onClick={() => { setBgMode('color'); set('bgImage', '') }}
            className={`cursor-pointer rounded-[10px] px-4 py-1.5 text-sm transition ${bgMode === 'color' ? 'bg-gray-700 text-soft shadow-sm' : 'text-dim hover:text-soft'}`}
          >
            Цвет
          </button>
          <button
            onClick={() => setBgMode('image')}
            className={`cursor-pointer rounded-[10px] px-4 py-1.5 text-sm transition ${bgMode === 'image' ? 'bg-gray-700 text-soft shadow-sm' : 'text-dim hover:text-soft'}`}
          >
            Изображение
          </button>
        </div>
        {bgMode === 'color' ? (
          <ColorPicker label="Цвет фона" value={draft.bgColor} onChange={v => set('bgColor', v)} />
        ) : (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-xs text-dim">URL изображения</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft.bgImage}
                  onChange={e => set('bgImage', e.target.value)}
                  placeholder="https://…"
                  className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-soft placeholder:text-dim outline-none transition focus:border-gray-600"
                />
                <button
                  type="button"
                  onClick={() => set('bgImage', `https://picsum.photos/1920/1080?random=${Date.now()}`)}
                  title="Случайное фото с Picsum"
                  className="flex items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-dim cursor-pointer transition hover:border-gray-600 hover:text-medium"
                >
                  <Shuffle size={14} /> Случайное
                </button>
              </div>
            </label>
            {draft.bgImage && (
              <div
                className="h-32 w-full rounded-xl border border-gray-700"
                style={{ backgroundImage: `url(${draft.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-subtle">Карточки</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-4">
            <ColorPicker label="Фон карточки" value={draft.cardColor} onChange={v => set('cardColor', v)} />
            <ColorPicker
              label="Цвет рамки"
              value={draft.borderColor.startsWith('#') && draft.borderColor.length === 9
                ? `#${draft.borderColor.slice(1, 7)}`
                : draft.borderColor.startsWith('#') ? draft.borderColor : '#ffffff'}
              onChange={v => set('borderColor', v)}
            />
          </div>
          <div
            className="relative flex flex-col justify-between rounded-2xl border p-4"
            style={{ backgroundColor: draft.cardColor, borderColor: draft.borderColor }}
          >
            <div className="flex items-start justify-between">
              <div
                className="flex size-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${draft.accentColor}20`, color: draft.accentColor }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <ExternalLink size={13} className="text-faint" />
            </div>
            <div className="mt-3">
              <p className="text-sm font-semibold" style={{ color: draft.textColor }}>Пример сервиса</p>
              <p className="mt-0.5 text-xs text-dim">Описание сервиса</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-800 bg-gray-800/30 p-4">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-subtle">Текст и акцент</p>
        <div className="grid grid-cols-2 gap-4">
          <ColorPicker label="Цвет текста" value={draft.textColor} onChange={v => set('textColor', v)} />
          <ColorPicker label="Акцентный цвет" value={draft.accentColor} onChange={v => set('accentColor', v)} />
        </div>
        <div className="mt-4 flex items-center gap-0.5">
          <span className="text-sm font-medium" style={{ color: draft.textColor }}>lebedinsky</span>
          <span className="text-sm font-medium" style={{ color: draft.accentColor }}>.space</span>
        </div>
      </section>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          disabled={saving}
          className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-dim cursor-pointer transition hover:border-red-800 hover:text-red-400 disabled:opacity-50"
        >
          Сбросить
        </button>

        {confirmReset && (
          <ConfirmDialog
            title="Сбросить внешний вид?"
            message="Все настройки цветов и фона вернутся к значениям по умолчанию."
            confirmLabel="Сбросить"
            destructive
            onConfirm={() => { setConfirmReset(false); handleReset() }}
            onCancel={() => setConfirmReset(false)}
          />
        )}
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-dim cursor-pointer transition hover:border-gray-600 hover:text-soft"
            >
              Отмена
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition hover:opacity-85 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text)' }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  )
}
