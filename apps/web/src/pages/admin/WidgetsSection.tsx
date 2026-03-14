import { Eye, EyeOff } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

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

  const toggle = (id: string) => {
    const next = hiddenWidgets.includes(id)
      ? hiddenWidgets.filter(w => w !== id)
      : [...hiddenWidgets, id]
    updateSettings({ ...settings, hiddenWidgets: next })
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-medium uppercase tracking-widest text-subtle">Виджеты</p>
      {WIDGETS.map(({ id, label }) => {
        const hidden = hiddenWidgets.includes(id)
        return (
          <div key={id} className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex-1">
              <p className={`font-medium${hidden ? ' text-muted line-through' : ''}`}>{label}</p>
            </div>
            <button
              onClick={() => toggle(id)}
              title={hidden ? 'Показать' : 'Скрыть'}
              className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-medium"
            >
              {hidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        )
      })}
    </div>
  )
}
