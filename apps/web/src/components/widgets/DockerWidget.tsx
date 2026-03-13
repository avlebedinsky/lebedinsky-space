import { useDocker } from '../../hooks/useDocker'

function StateDot({ state }: { state: string }) {
  const color =
    state === 'running' ? 'bg-emerald-400' : state === 'exited' ? 'bg-red-500' : 'bg-gray-500'
  return <span className={`inline-block h-2 w-2 flex-shrink-0 rounded-full ${color}`} />
}

export function DockerWidget() {
  const { containers, loading } = useDocker()
  const running = containers?.filter((c) => c.state === 'running').length ?? 0

  return (
    <div
      className="flex h-full flex-col gap-2 rounded-2xl border p-6"
      style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-subtle">Docker</p>
        {!loading && containers && containers.length > 0 && (
          <span className="text-xs text-muted">{running} / {containers.length}</span>
        )}
      </div>
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-gray-900" />
          ))}
        </div>
      ) : !containers || containers.length === 0 ? (
        <p className="text-sm text-muted">Нет данных</p>
      ) : (
        <div className="flex flex-col gap-1.5 overflow-y-auto">
          {containers.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <StateDot state={c.state} />
              <span className="min-w-0 flex-1 truncate text-sm">{c.name || c.id}</span>
              {c.status && <span className="shrink-0 text-xs text-muted">{c.status}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
