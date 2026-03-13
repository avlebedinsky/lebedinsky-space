import { useNetwork } from '../../hooks/useNetwork'

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}д ${h}ч ${m}м`
  if (h > 0) return `${h}ч ${m}м`
  return `${m}м`
}

function formatRate(kbps: number): string {
  if (kbps >= 1024) return `${(kbps / 1024).toFixed(1)} MB/s`
  return `${kbps.toFixed(1)} KB/s`
}

export function NetworkWidget() {
  const info = useNetwork()

  return (
    <div
      className="flex h-full flex-col justify-center gap-3 rounded-2xl border p-6"
      style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
    >
      <p className="text-xs font-medium uppercase tracking-widest text-subtle">Сеть</p>
      {info ? (
        <>
          <div className="flex justify-between text-sm">
            <span className="text-muted">Аптайм</span>
            <span className="tabular-nums">{formatUptime(info.uptime)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">↓ Входящий</span>
            <span className="tabular-nums">{formatRate(info.rateInKBps)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted">↑ Исходящий</span>
            <span className="tabular-nums">{formatRate(info.rateOutKBps)}</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-gray-900" />
          ))}
        </div>
      )}
    </div>
  )
}
