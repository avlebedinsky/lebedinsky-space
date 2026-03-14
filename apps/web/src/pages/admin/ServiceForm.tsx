import { useState } from 'react'
import { getIcon, ICON_NAMES } from '../../lib/icons'
import { ColorPicker } from '../../components/ColorPicker'
import { Select } from '../../components/Select'
import type { ServiceFormData } from './serviceFormTypes'

export function ServiceForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: ServiceFormData
  onSubmit: (data: ServiceFormData) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<ServiceFormData>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (k: keyof ServiceFormData, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const PreviewIcon = getIcon(form.iconName)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs text-dim">Название *</span>
        <input required value={form.name} onChange={e => set('name', e.target.value)}
          className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm outline-none focus:border-gray-600" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-dim">Описание</span>
        <input value={form.description} onChange={e => set('description', e.target.value)}
          className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm outline-none focus:border-gray-600" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-dim">URL *</span>
        <input required value={form.url} onChange={e => set('url', e.target.value)}
          className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm outline-none focus:border-gray-600" />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-dim">Иконка</span>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Select
              value={form.iconName}
              options={ICON_NAMES.map(n => ({ value: n, label: n }))}
              onChange={v => set('iconName', v)}
            />
          </div>
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${form.color}20`, color: form.color }}>
            <PreviewIcon size={18} />
          </div>
        </div>
      </label>

      <ColorPicker label="Цвет" value={form.color} onChange={v => set('color', v)} />

      <div className="flex gap-3">
        <div className="flex-1">
          <Select
            label="Колонок"
            value={form.cardColSpan}
            options={[{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }]}
            onChange={v => set('cardColSpan', Number(v))}
          />
        </div>
        <div className="flex-1">
          <Select
            label="Строк"
            value={form.cardRowSpan}
            options={[{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }]}
            onChange={v => set('cardRowSpan', Number(v))}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-muted cursor-pointer transition hover:border-gray-600">
          Отмена
        </button>
        <button type="submit" disabled={saving}
          className="rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition hover:opacity-85 disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text)' }}>
          {saving ? 'Сохраняю…' : 'Сохранить'}
        </button>
      </div>
    </form>
  )
}
