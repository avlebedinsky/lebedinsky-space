import { useState } from 'react'
import { Eye, EyeOff, Pencil } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'
import { WidgetForm } from './WidgetForm'

const WIDGETS = [
  { id: 'clock',   label: 'Часы' },
  { id: 'weather', label: 'Погода' },
  { id: 'metrics', label: 'Метрики' },
  { id: 'network', label: 'Сеть' },
  { id: 'docker',  label: 'Docker' },
] as const

export function WidgetsSection() {
  const { settings, updateSettings } = useThemeStore()
  const hiddenWidgets = settings.hiddenWidgets ?? []
  const widgetSpans = settings.widgetSpans ?? {}
  const [editingId, setEditingId] = useState<string | null>(null)

  const toggle = (id: string) => {
    const next = hiddenWidgets.includes(id)
      ? hiddenWidgets.filter(w => w !== id)
      : [...hiddenWidgets, id]
    updateSettings({ ...settings, hiddenWidgets: next })
  }

  const handleSaveSpan = async (id: string, data: { colSpan: number; rowSpan: number }) => {
    await updateSettings({ ...settings, widgetSpans: { ...widgetSpans, [id]: data } })
    setEditingId(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-widest text-subtle">Виджеты</p>
      {WIDGETS.map(({ id, label }) => {
        const hidden = hiddenWidgets.includes(id)
        const span = widgetSpans[id] ?? { colSpan: 1, rowSpan: 1 }
        return (
          <div key={id} className="rounded-2xl border border-gray-800 bg-gray-900 px-4 py-2.5">
            {editingId === id ? (
              <>
                <p className="mb-4 text-sm font-medium text-soft">{label}</p>
                <WidgetForm
                  initial={span}
                  onSubmit={data => handleSaveSpan(id, data)}
                  onCancel={() => setEditingId(null)}
                />
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className={`font-medium${hidden ? ' text-muted line-through' : ''}`}>{label}</p>
                  <p className="text-xs text-muted">{span.colSpan} кол · {span.rowSpan} стр</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggle(id)}
                    title={hidden ? 'Показать' : 'Скрыть'}
                    className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-medium"
                  >
                    {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    onClick={() => setEditingId(id)}
                    className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-medium"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
