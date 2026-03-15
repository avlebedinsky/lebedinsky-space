import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useMood } from '../../hooks/useMood'
import { ConfirmDialog } from '../ConfirmDialog'

const MOODS = [
  { value: 1, emoji: '😞' },
  { value: 2, emoji: '🙁' },
  { value: 3, emoji: '😐' },
  { value: 4, emoji: '🙂' },
  { value: 5, emoji: '😄' },
] as const

const MOOD_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#eab308',
  4: '#84cc16',
  5: '#10b981',
}

function toLocalDateStr(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayStr(): string {
  return toLocalDateStr(new Date().toISOString())
}

export function MoodWidget() {
  const { entries, loading, logMood, deleteMood } = useMood()
  const [localNote, setLocalNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const isTall = size.h > 240
  const isWide = size.w > 240

  const emojiSize = isTall ? '2rem' : isWide ? '1.75rem' : '1.5rem'

  const today = todayStr()
  const todayEntries = entries.filter(e => toLocalDateStr(e.createdAt) === today)
  const lastTodayMood = todayEntries[0]?.mood

  const plural = todayEntries.length === 1 ? 'запись'
    : todayEntries.length < 5 ? 'записи' : 'записей'

  const handleMoodClick = async (mood: number) => {
    if (saving) return
    setSaving(true)
    try {
      await logMood(mood, localNote)
      setLocalNote('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <div
      ref={containerRef}
      className="flex h-full flex-col overflow-hidden rounded-2xl border"
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
        padding: isTall ? '1rem' : '1.5rem',
        gap: isTall ? '0.5rem' : '0.75rem',
        justifyContent: isTall ? 'flex-start' : 'center',
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-subtle">Настроение</p>
        {lastTodayMood != null && (
          <span
            className="text-xs tabular-nums font-medium"
            style={{ color: MOOD_COLORS[lastTodayMood] }}
          >
            {todayEntries.length} {plural}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        {MOODS.map(({ value, emoji }) => {
          const isActive = lastTodayMood === value
          return (
            <button
              key={value}
              onClick={() => handleMoodClick(value)}
              disabled={saving || loading}
              className="relative flex cursor-pointer flex-col items-center gap-0.5 rounded-xl p-1 transition-colors hover:bg-gray-800/60 disabled:cursor-not-allowed"
              style={{ minWidth: '2.25rem' }}
            >
              <span
                style={{
                  fontSize: emojiSize,
                  lineHeight: 1.3,
                  opacity: lastTodayMood == null ? 1 : isActive ? 1 : 0.35,
                  transition: 'opacity 0.15s',
                  display: 'block',
                }}
              >
                {emoji}
              </span>
              <span
                style={{
                  display: 'block',
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? MOOD_COLORS[value] : 'transparent',
                  transition: 'background-color 0.15s',
                }}
              />
            </button>
          )
        })}
      </div>

      <input
        type="text"
        value={localNote}
        onChange={e => setLocalNote(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && localNote.trim()) {
            handleMoodClick(lastTodayMood ?? 3)
          }
        }}
        placeholder="Заметка к следующей записи…"
        maxLength={200}
        className="w-full rounded-lg border border-gray-700 bg-gray-800/60 px-2.5 py-1.5 text-xs text-soft placeholder:text-subtle outline-none focus:border-gray-600"
      />

      {isTall && (
        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-700">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-7 animate-pulse rounded-lg bg-gray-800/60" />
            ))
          ) : todayEntries.length === 0 ? (
            <p className="mt-1 text-xs text-subtle">Записей сегодня нет — выбери настроение выше</p>
          ) : (
            todayEntries.map(e => (
              <div key={e.id} className="group flex items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-gray-800/40">
                <span
                  className="shrink-0 rounded-full"
                  style={{ width: '3px', height: '16px', backgroundColor: MOOD_COLORS[e.mood], opacity: 0.8 }}
                />
                <span className="shrink-0 tabular-nums text-subtle">
                  {new Date(e.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="shrink-0">{MOODS.find(m => m.value === e.mood)?.emoji}</span>
                {e.note
                  ? <span className="min-w-0 flex-1 truncate text-muted">{e.note}</span>
                  : <span className="flex-1" />
                }
                <button
                  onClick={() => setConfirmDeleteId(e.id)}
                  className="ml-auto shrink-0 cursor-pointer text-subtle opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                >
                  <X size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>

      {confirmDeleteId != null && (
        <ConfirmDialog
          title="Удалить запись?"
          destructive
          confirmLabel="Удалить"
          onConfirm={() => { deleteMood(confirmDeleteId); setConfirmDeleteId(null) }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </>
  )
}

