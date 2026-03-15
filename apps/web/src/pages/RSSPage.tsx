import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Rss, Search, X } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { api } from '../lib/api'
import { ErrorBlock } from '../components/ErrorBlock'
import type { RSSFeedWithItems } from '../lib/types'

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).replace(' г.', '')
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export default function RSSPage() {
  const { settings } = useThemeStore()
  const [feeds, setFeeds] = useState<RSSFeedWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    api.rss.items()
      .then(data => setFeeds(data))
      .catch(() => setError('Не удалось загрузить ленты'))
      .finally(() => setLoading(false))
  }, [])

  const allItems = useMemo(() => {
    return feeds
      .flatMap(({ feed, items }) => items.map(item => ({ ...item, feedTitle: feed.title, feedUrl: feed.url })))
      .sort((a, b) => {
        if (!a.published && !b.published) return 0
        if (!a.published) return 1
        if (!b.published) return -1
        return new Date(b.published).getTime() - new Date(a.published).getTime()
      })
  }, [feeds])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allItems
    return allItems.filter(item =>
      item.title.toLowerCase().includes(q) ||
      stripHtml(item.description).toLowerCase().includes(q) ||
      item.feedTitle.toLowerCase().includes(q)
    )
  }, [allItems, query])

  const bgStyle = settings.bgImage
    ? { backgroundImage: `url(${settings.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'var(--color-text)' }
    : { backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }

  return (
    <div className="flex h-screen flex-col overflow-hidden px-4" style={bgStyle}>
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col min-h-0">
        <header className="shrink-0 py-6 flex items-center gap-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-dim cursor-pointer transition hover:border-gray-600 hover:text-medium"
          >
            <ArrowLeft size={13} /> <span className="hidden sm:inline">Назад</span>
          </Link>
          <div className="h-5 w-px bg-gray-800" />
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">RSS</h1>
          {!loading && !error && (
            <span className="ml-auto rounded-full bg-gray-800 px-3 py-1 text-xs tabular-nums text-muted">
              {query ? `${filteredItems.length} / ${allItems.length}` : allItems.length}
            </span>
          )}
        </header>

        {!loading && !error && allItems.length > 0 && (
          <div className="relative mb-5">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск по заголовку, описанию, источнику…"
              className="w-full rounded-xl border border-gray-700 bg-gray-900 py-2.5 pl-9 pr-9 text-sm outline-none placeholder:text-subtle focus:border-gray-600"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle hover:text-medium transition"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-gray-800 bg-gray-900" />
            ))}
          </div>
        )}

        {error && <ErrorBlock message={error} />}

        {!loading && !error && allItems.length === 0 && (
          <p className="text-sm text-muted">Нет RSS-лент. Добавьте их в панели управления.</p>
        )}

        {!loading && !error && allItems.length > 0 && filteredItems.length === 0 && (
          <p className="text-sm text-muted">Ничего не найдено по запросу «{query}»</p>
        )}

        {!loading && !error && filteredItems.length > 0 && (
          <div className="kb-scroll flex-1 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 divide-y divide-gray-800/70 mb-4">
            {filteredItems.map((item, i) => {
              const desc = stripHtml(item.description)
              return (
                <a
                  key={i}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex flex-col gap-2 px-5 py-5 transition hover:bg-gray-800/40"
                >
                  <span className="absolute inset-y-0 left-0 w-0.5 scale-y-0 rounded-full bg-[var(--color-accent)] transition-transform duration-150 group-hover:scale-y-100" />
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-base font-semibold leading-snug transition-colors group-hover:text-[var(--color-accent)]">{item.title}</span>
                    {item.published && (
                      <span className="mt-0.5 shrink-0 text-sm tabular-nums text-soft">
                        {formatDate(item.published)}
                      </span>
                    )}
                  </div>
                  {desc && (
                    <p className="line-clamp-2 text-sm leading-relaxed text-soft">{desc}</p>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-subtle">
                    <Rss size={11} />
                    <span>{item.feedTitle}</span>
                    <a
                      href={item.feedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto rounded-md p-0.5 transition hover:bg-gray-700 hover:text-medium"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
