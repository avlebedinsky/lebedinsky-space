import { useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { useServicesStore } from '../../store/servicesStore'
import { getIcon } from '../../lib/icons'
import { ServiceForm } from './ServiceForm'
import { EMPTY_SERVICE, type ServiceFormData } from './serviceFormTypes'

export function ServicesSection() {
  const { services, create, update, remove } = useServicesStore()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleCreate = async (data: ServiceFormData) => {
    await create(data)
    setCreating(false)
  }

  const handleUpdate = async (id: number, data: ServiceFormData) => {
    await update(id, data)
    setEditingId(null)
  }

  const handleRemove = async (id: number) => {
    setDeleteError(null)
    try {
      await remove(id)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-subtle">Сервисы</p>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-dim cursor-pointer transition hover:border-gray-600 hover:text-medium"
          >
            <Plus size={13} /> <span className="hidden sm:inline">Добавить сервис</span>
          </button>
        )}
      </div>

      {creating && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="mb-4 text-sm font-medium text-soft">Новый сервис</p>
          <ServiceForm initial={EMPTY_SERVICE} onSubmit={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {deleteError && (
        <p className="rounded-xl border border-red-900 bg-red-950 px-4 py-2 text-sm text-red-400">{deleteError}</p>
      )}

      {!creating && services.length === 0 && (
        <p className="text-sm text-muted">Нет сервисов. Нажмите «Добавить сервис», чтобы добавить первый.</p>
      )}

      {services.map(service => {
        const Icon = getIcon(service.iconName)
        return (
          <div key={service.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            {editingId === service.id ? (
              <>
                <p className="mb-4 text-sm font-medium text-soft">Редактировать</p>
                <ServiceForm
                  initial={{ name: service.name, description: service.description, url: service.url, iconName: service.iconName, color: service.color, sortOrder: service.sortOrder, hidden: service.hidden, cardColSpan: service.cardColSpan ?? 1, cardRowSpan: service.cardRowSpan ?? 1 }}
                  onSubmit={data => handleUpdate(service.id, data)}
                  onCancel={() => setEditingId(null)}
                />
              </>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${service.color}20`, color: service.color }}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium${service.hidden ? ' text-muted line-through' : ''}`}>{service.name}</p>
                  <p className="truncate text-sm text-muted">{service.url}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => update(service.id, { name: service.name, description: service.description, url: service.url, iconName: service.iconName, color: service.color, sortOrder: service.sortOrder, hidden: !service.hidden, cardColSpan: service.cardColSpan, cardRowSpan: service.cardRowSpan })}
                    title={service.hidden ? 'Показать' : 'Скрыть'}
                    className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-medium">
                    {service.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => setEditingId(service.id)}
                    className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-medium">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleRemove(service.id)}
                    className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-red-400">
                    <Trash2 size={14} />
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
