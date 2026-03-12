import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react'
import { useServicesStore } from '../store/servicesStore'
import { useThemeStore } from '../store/themeStore'
import { getIcon, ICON_NAMES } from '../lib/icons'
import { ColorPicker } from '../components/ColorPicker'
import type { Service } from '../lib/types'

const EMPTY_SERVICE = { name: '', description: '', url: '', iconName: 'Globe', color: '#6366f1', sortOrder: 0 }

type ServiceFormData = Omit<Service, 'id' | 'createdAt'>

function ItemForm({
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-xs text-dim">Название *</span>
          <input required value={form.name} onChange={e => set('name', e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25" />
        </label>

        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-xs text-dim">Описание</span>
          <input value={form.description} onChange={e => set('description', e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25" />
        </label>

        <label className="col-span-2 flex flex-col gap-1">
          <span className="text-xs text-dim">URL *</span>
          <input required value={form.url} onChange={e => set('url', e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-white/25" />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs text-dim">Иконка</span>
          <div className="flex items-center gap-2">
            <select value={form.iconName} onChange={e => set('iconName', e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-gray-900 px-3 py-2 text-sm outline-none focus:border-white/25">
              {ICON_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${form.color}20`, color: form.color }}>
              <PreviewIcon size={18} />
            </div>
          </div>
        </label>

        <ColorPicker label="Цвет" value={form.color} onChange={v => set('color', v)} />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-muted transition hover:bg-white/5">
          Отмена
        </button>
        <button type="submit" disabled={saving}
          className="rounded-xl px-4 py-2 text-sm font-medium transition hover:opacity-85 disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text)' }}>{saving ? 'Сохраняю…' : 'Сохранить'}
        </button>
      </div>
    </form>
  )
}

export default function AdminPage() {
  const { services, create: createService, update: updateService, remove: removeService } = useServicesStore()
  const { settings } = useThemeStore()

  const bgStyle = settings.bgImage
    ? { backgroundImage: `url(${settings.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'var(--color-text)' }
    : { backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }

  const [creatingService, setCreatingService] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null)
  const [serviceDeleteError, setServiceDeleteError] = useState<string | null>(null)

  const handleCreateService = async (data: ServiceFormData) => {
    await createService(data)
    setCreatingService(false)
  }

  const handleUpdateService = async (id: number, data: ServiceFormData) => {
    await updateService(id, data)
    setEditingServiceId(null)
  }

  const handleRemoveService = async (id: number) => {
    setServiceDeleteError(null)
    try {
      await removeService(id)
    } catch (err) {
      setServiceDeleteError(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  return (
    <div className="min-h-screen px-4 py-16" style={bgStyle}>
      <div className="mx-auto max-w-2xl">
        <header className="mb-10 flex items-center gap-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-dim transition hover:border-white/20 hover:text-medium"
          >
            <ArrowLeft size={13} /> Назад
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Управление</h1>
        </header>

        <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-subtle">Сервисы</h2>

        {creatingService ? (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="mb-4 text-sm font-medium text-soft">Новый сервис</p>
            <ItemForm initial={EMPTY_SERVICE} onSubmit={handleCreateService} onCancel={() => setCreatingService(false)} />
          </div>
        ) : (
          <button
            onClick={() => setCreatingService(true)}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-4 text-sm text-dim transition hover:border-white/25 hover:text-soft"
          >
            <Plus size={16} /> Добавить сервис
          </button>
        )}

        {serviceDeleteError && (
          <p className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {serviceDeleteError}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {services.map(service => {
            const Icon = getIcon(service.iconName)
            return (
              <div key={service.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                {editingServiceId === service.id ? (
                  <>
                    <p className="mb-4 text-sm font-medium text-soft">Редактировать</p>
                    <ItemForm
                      initial={{ name: service.name, description: service.description, url: service.url, iconName: service.iconName, color: service.color, sortOrder: service.sortOrder }}
                      onSubmit={data => handleUpdateService(service.id, data)}
                      onCancel={() => setEditingServiceId(null)}
                    />
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${service.color}20`, color: service.color }}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{service.name}</p>
                      <p className="truncate text-sm text-muted">{service.url}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingServiceId(service.id)}
                        className="flex size-8 items-center justify-center rounded-lg text-subtle transition hover:bg-white/10 hover:text-medium">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleRemoveService(service.id)}
                        className="flex size-8 items-center justify-center rounded-lg text-subtle transition hover:bg-white/10 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
