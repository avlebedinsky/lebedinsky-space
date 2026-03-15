import { useState } from 'react'
import { Select } from '../../components/Select'

interface WidgetSpanData {
  colSpan: number
  rowSpan: number
}

export function WidgetForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: WidgetSpanData
  onSubmit: (data: WidgetSpanData) => Promise<void>
  onCancel: () => void
}) {
  const [form, setForm] = useState<WidgetSpanData>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <Select
            label="Колонок"
            value={form.colSpan}
            options={[{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }, { value: 4, label: '4' }]}
            onChange={v => setForm(prev => ({ ...prev, colSpan: Number(v) }))}
          />
        </div>
        <div className="flex-1">
          <Select
            label="Строк"
            value={form.rowSpan}
            options={[{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }]}
            onChange={v => setForm(prev => ({ ...prev, rowSpan: Number(v) }))}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
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
