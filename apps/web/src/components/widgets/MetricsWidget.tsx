import { useMetrics } from '../../hooks/useMetrics'

function Bar({ label, value }: { label: string; value: number }) {
  const color = value > 85 ? 'bg-red-500' : value > 65 ? 'bg-amber-400' : 'bg-indigo-400'
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span className="text-white/50">{label}</span>
        <span className="tabular-nums text-white/50">{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function MetricsWidget() {
  const metrics = useMetrics()

  return (
    <div className="flex flex-col justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="text-xs font-medium uppercase tracking-widest text-white/30">
        {metrics?.hostname ?? 'Сервер'}
      </p>
      {metrics ? (
        <>
          <Bar label="CPU" value={metrics.cpu} />
          <Bar label="RAM" value={metrics.ram} />
          <Bar label="Диск" value={metrics.disk} />
        </>
      ) : (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      )}
    </div>
  )
}
