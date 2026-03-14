import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Eye, EyeOff } from 'lucide-react'
import { api } from '../../lib/api'
import type { RSSFeed } from '../../lib/types'

export function RSSSection() {
  const [feeds, setFeeds] = useState<RSSFeed[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  useEffect(() => {
    api.rss.feeds.list().then(setFeeds).catch(() => {})
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setError(null)
    try {
      const feed = await api.rss.feeds.create({ title, url })
      setFeeds(prev => [...prev, feed])
      setTitle('')
      setUrl('')
      setShowAdd(false)
    } catch {
      setError('Ошибка добавления ленты')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.rss.feeds.delete(id)
      setFeeds(prev => prev.filter(f => f.id !== id))
    } catch {
      setError('Ошибка удаления ленты')
    }
  }

  const handleStartEdit = (feed: RSSFeed) => {
    setEditingId(feed.id)
    setEditTitle(feed.title)
    setEditUrl(feed.url)
    setEditError(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditError(null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId === null) return
    setSaving(true)
    setEditError(null)
    const current = feeds.find(f => f.id === editingId)
    try {
      const updated = await api.rss.feeds.update(editingId, { title: editTitle, url: editUrl, hidden: current?.hidden ?? false })
      setFeeds(prev => prev.map(f => (f.id === editingId ? updated : f)))
      setEditingId(null)
    } catch {
      setEditError('Ошибка сохранения ленты')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleHidden = async (feed: RSSFeed) => {
    try {
      const updated = await api.rss.feeds.update(feed.id, { title: feed.title, url: feed.url, hidden: !feed.hidden })
      setFeeds(prev => prev.map(f => (f.id === feed.id ? updated : f)))
    } catch {
      setError('Ошибка изменения видимости ленты')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-subtle">RSS-ленты</h2>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-dim cursor-pointer transition hover:border-gray-600 hover:text-medium"
          >
            <Plus size={13} /> <span className="hidden sm:inline">Добавить ленту</span>
          </button>
        )}
      </div>

      {showAdd && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <p className="mb-4 text-sm font-medium text-soft">Новая лента</p>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <label className="flex flex-col gap-1">
              <span className="text-xs text-dim">Название *</span>
              <input required value={title} onChange={e => setTitle(e.target.value)}
                className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm outline-none transition focus:border-gray-600" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs text-dim">URL *</span>
              <input required type="url" value={url} onChange={e => setUrl(e.target.value)}
                className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm outline-none transition focus:border-gray-600" />
            </label>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowAdd(false); setError(null) }}
                className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-2 text-sm text-muted cursor-pointer transition hover:border-gray-600">
                Отмена
              </button>
              <button type="submit" disabled={adding}
                className="rounded-xl px-4 py-2 text-sm font-medium cursor-pointer transition hover:opacity-85 disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-text)' }}>
                {adding ? 'Сохраняю…' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && !showAdd && (
        <p className="rounded-xl border border-red-900 bg-red-950 px-4 py-2 text-sm text-red-400">{error}</p>
      )}

      {!showAdd && feeds.length === 0 && (
        <p className="text-sm text-muted">Нет лент. Нажмите «Добавить ленту», чтобы добавить первую.</p>
      )}

      {feeds.map(feed => (
        <div key={feed.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
          {editingId === feed.id ? (
            <>
              <p className="mb-4 text-sm font-medium text-soft">Редактировать ленту</p>
              <form onSubmit={handleUpdate} className="flex flex-col gap-3">
                {editError && <p className="text-sm text-red-400">{editError}</p>}
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-dim">Название *</span>
                  <input required value={editTitle} onChange={e => setEditTitle(e.target.value)}
                    className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm outline-none transition focus:border-gray-600" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-dim">URL *</span>
                  <input required type="url" value={editUrl} onChange={e => setEditUrl(e.target.value)}
                    className="rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm outline-none transition focus:border-gray-600" />
                </label>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={handleCancelEdit}
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
            </>
          ) : (
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className={`font-medium ${feed.hidden ? 'opacity-40' : ''}`}>{feed.title}</p>
                <p className="truncate text-sm text-muted">{feed.url}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleToggleHidden(feed)}
                  title={feed.hidden ? 'Показать' : 'Скрыть'}
                  className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-medium"
                >
                  {feed.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => handleStartEdit(feed)}
                  className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-medium"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(feed.id)}
                  className="flex size-8 items-center justify-center rounded-lg text-subtle cursor-pointer transition hover:bg-gray-800 hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
