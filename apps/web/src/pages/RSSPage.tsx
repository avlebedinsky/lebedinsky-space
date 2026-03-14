import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, ChevronDown, Rss } from 'lucide-react'
import { useThemeStore } from '../store/themeStore'
import { api } from '../lib/api'
import type { RSSFeedWithItems } from '../lib/types'

function formatDate(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export default function RSSPage() {
  const { settings } = useThemeStore()
  const [feeds, setFeeds] = useState<RSSFeedWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set())

  useEffect(() => {
    api.rss.items()
      .then(data => {
        setFeeds(data)
      })
      .catch(() => setError('Не удалось загрузить ленты'))
      .finally(() => setLoading(false))
  }, [])

  const toggleCollapsed = (id: number) =>
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const bgStyle = settings.bgImage
    ? { backgroundImage: `url(${settings.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'var(--color-text)' }
    : { backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }

  return (
    <div className="min-h-screen px-4 py-8" style={bgStyle}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center gap-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-dim cursor-pointer transition hover:border-gray-600 hover:text-medium"
          >
            <ArrowLeft size={13} /> <span className="hidden sm:inline">Назад</span>
          </Link>
          <div className="h-5 w-px bg-gray-800" />
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">RSS</h1>
        </header>

        {loading && (
          <div className="flex flex-col gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <div className="h-5 w-40 animate-pulse rounded-lg bg-gray-800" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-16 animate-pulse rounded-2xl border border-gray-800 bg-gray-900" />
                ))}
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-red-900 bg-red-950 px-4 py-3 text-sm text-red-400">{error}</p>
        )}

        {!loading && !error && feeds.length === 0 && (
          <p className="text-sm text-muted">Нет RSS-лент. Добавьте их в панели управления.</p>
        )}

        {!loading && !error && (
          <div className="flex flex-col gap-4">
            {feeds.map(({ feed, items }) => {
              const isCollapsed = collapsed.has(feed.id)
              return (
                <section key={feed.id} className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-900">
                  <button
                    onClick={() => toggleCollapsed(feed.id)}
                    className="flex w-full cursor-pointer items-center gap-3 px-5 py-4 text-left transition hover:bg-gray-800/50"
                  >
                    <Rss size={14} className="shrink-0 text-[var(--color-accent)]" />
                    <span className="flex-1 text-sm font-semibold">{feed.title}</span>
                    <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs tabular-nums text-muted">
                      {items.length}
                    </span>
                    <a
                      href={feed.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-1 text-subtle transition hover:bg-gray-700 hover:text-medium"
                      onClick={e => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                    </a>
                    <ChevronDown
                      size={14}
                      className="shrink-0 text-subtle transition-transform duration-200"
                      style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {!isCollapsed && (
                    <div className="border-t border-gray-800">
                      {items.length === 0 ? (
                        <p className="px-5 py-4 text-sm text-muted">Нет записей</p>
                      ) : (
                        items.map((item, i) => {
                          const desc = stripHtml(item.description)
                          return (
                            <a
                              key={i}
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative flex flex-col gap-1.5 px-5 py-4 transition hover:bg-gray-800/40"
                            >
                              <span
                                className="absolute inset-y-0 left-0 w-0.5 scale-y-0 rounded-full bg-[var(--color-accent)] transition-transform duration-150 group-hover:scale-y-100"
                              />
                              <div className="flex items-start justify-between gap-4">
                                <span className="text-sm font-medium leading-snug transition-colors group-hover:text-[var(--color-accent)]">{item.title}</span>
                                {item.published && (
                                  <span className="mt-0.5 shrink-0 rounded-full bg-gray-800 px-2 py-0.5 text-xs tabular-nums text-muted">
                                    {formatDate(item.published)}
                                  </span>
                                )}
                              </div>
                              {desc && (
                                <p className="line-clamp-2 text-xs leading-relaxed text-muted">{desc}</p>
                              )}
                            </a>
                          )
                        })
                      )}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
