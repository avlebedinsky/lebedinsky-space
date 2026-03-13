import { useState, useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react'
import { useServicesStore } from '../store/servicesStore'
import { useThemeStore } from '../store/themeStore'
import { useUserStore } from '../store/userStore'
import { getIcon, ICON_NAMES } from '../lib/icons'
import { ColorPicker } from '../components/ColorPicker'
import { api } from '../lib/api'
import type { Service, RSSFeed } from '../lib/types'

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
            <select value={form.iconName} onChange={e => set('iconName', e.target.value)}
              className="flex-1 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm outline-none focus:border-gray-600">
              {ICON_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${form.color}20`, color: form.color }}>
              <PreviewIcon size={18} />
            </div>
          </div>
        </label>

        <ColorPicker label="Цвет" value={form.color} onChange={v => set('color', v)} />

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel}
          className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-muted cursor-pointer transition hover:border-gray-600">
          Отмена
        </button>
        <button type="submit" disabled={saving}
          className="rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition hover:opacity-85 disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text)' }}>{saving ? 'Сохраняю…' : 'Сохранить'}
        </button>
      </div>
    </form>
  )
}

export default function AdminPage() {
  const { user, loading: userLoading } = useUserStore()
  const { services, create: createService, update: updateService, remove: removeService } = useServicesStore()
  const { settings } = useThemeStore()
  const [creatingService, setCreatingService] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null)
  const [serviceDeleteError, setServiceDeleteError] = useState<string | null>(null)

  const [rssFeeds, setRssFeeds] = useState<RSSFeed[]>([])
  const [showAddFeed, setShowAddFeed] = useState(false)
  const [newFeedTitle, setNewFeedTitle] = useState('')
  const [newFeedUrl, setNewFeedUrl] = useState('')
  const [addingFeed, setAddingFeed] = useState(false)
  const [feedError, setFeedError] = useState<string | null>(null)

  useEffect(() => {
    api.rss.feeds.list().then(setRssFeeds).catch(() => {})
  }, [])

  const handleAddFeed = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddingFeed(true)
    setFeedError(null)
    try {
      const feed = await api.rss.feeds.create({ title: newFeedTitle, url: newFeedUrl })
      setRssFeeds(prev => [...prev, feed])
      setNewFeedTitle('')
      setNewFeedUrl('')
      setShowAddFeed(false)
    } catch {
      setFeedError('Ошибка добавления ленты')
    } finally {
      setAddingFeed(false)
    }
  }

  const handleDeleteFeed = async (id: number) => {
    try {
      await api.rss.feeds.delete(id)
      setRssFeeds(prev => prev.filter(f => f.id !== id))
    } catch {
      setFeedError('Ошибка удаления ленты')
    }
  }

  if (userLoading) return null
  if (!user?.isAdmin) return <Navigate to="/" replace />

  const bgStyle = settings.bgImage
    ? { backgroundImage: `url(${settings.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'var(--color-text)' }
    : { backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }

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
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-dim cursor-pointer transition hover:border-gray-600 hover:text-medium"
            >
              <ArrowLeft size={13} /> Назад
            </Link>
            <div className="h-5 w-px bg-gray-800" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Управление</h1>
          </div>
        </header>

        <div className="mb-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-subtle">RSS-ленты</p>
            {!showAddFeed && (
              <button
                onClick={() => setShowAddFeed(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-dim cursor-pointer transition hover:border-gray-600 hover:text-medium"
              >
                <Plus size={13} /> <span className="hidden sm:inline">Добавить ленту</span>
              </button>
            )}
          </div>

          {showAddFeed && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <p className="mb-4 text-sm font-medium text-soft">Новая лента</p>
              <form onSubmit={handleAddFeed} className="flex flex-col gap-3">
                {feedError && <p className="text-sm text-red-400">{feedError}</p>}
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-dim">Название *</span>
                  <input
                    required
                    value={newFeedTitle}
                    onChange={e => setNewFeedTitle(e.target.value)}
                    className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm outline-none focus:border-gray-600"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-dim">URL *</span>
                  <input
                    required
                    type="url"
                    value={newFeedUrl}
                    onChange={e => setNewFeedUrl(e.target.value)}
                    className="rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm outline-none focus:border-gray-600"
                  />
                </label>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowAddFeed(false); setFeedError(null) }}
                    className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-muted cursor-pointer transition hover:border-gray-600">
                    Отмена
                  </button>
                  <button type="submit" disabled={addingFeed}
                    className="rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition hover:opacity-85 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text)' }}>
                    {addingFeed ? 'Сохраняю…' : 'Сохранить'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {feedError && !showAddFeed && (
            <p className="rounded-xl border border-red-900 bg-red-950 px-4 py-2 text-sm text-red-400">{feedError}</p>
          )}

          {!showAddFeed && rssFeeds.length === 0 && (
            <p className="text-sm text-muted">Нет лент. Нажмите «Добавить ленту», чтобы добавить первую.</p>
          )}

          {rssFeeds.map(feed => (
            <div key={feed.id} className="flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium">{feed.title}</p>
                <p className="truncate text-sm text-muted">{feed.url}</p>
              </div>
              <button
                onClick={() => handleDeleteFeed(feed.id)}
                className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-subtle">Сервисы</p>
            {!creatingService && (
              <button
                onClick={() => setCreatingService(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-dim cursor-pointer transition hover:border-gray-600 hover:text-medium"
              >
                <Plus size={13} /> <span className="hidden sm:inline">Добавить сервис</span>
              </button>
            )}
          </div>

          {creatingService && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <p className="mb-4 text-sm font-medium text-soft">Новый сервис</p>
              <ItemForm initial={EMPTY_SERVICE} onSubmit={handleCreateService} onCancel={() => setCreatingService(false)} />
            </div>
          )}

          {serviceDeleteError && (
            <p className="rounded-xl border border-red-900 bg-red-950 px-4 py-2 text-sm text-red-400">
              {serviceDeleteError}
            </p>
          )}

          {!creatingService && services.length === 0 && (
            <p className="text-sm text-muted">Нет сервисов. Нажмите «Добавить сервис», чтобы добавить первый.</p>
          )}

          {services.map(service => {
            const Icon = getIcon(service.iconName)
            return (
              <div key={service.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
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
                        className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-medium">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleRemoveService(service.id)}
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
      </div>
    </div>
  )
}
