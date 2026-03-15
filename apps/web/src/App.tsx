import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Settings, Rss, BookOpen } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDndMonitor,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useThemeStore } from './store/themeStore'
import { useServicesStore } from './store/servicesStore'
import { useUserStore } from './store/userStore'
import { useStatus } from './hooks/useStatus'
import { ServiceCard } from './components/ServiceCard'
import { ClockWidget } from './components/widgets/ClockWidget'
import { WeatherWidget } from './components/widgets/WeatherWidget'
import { MetricsWidget } from './components/widgets/MetricsWidget'
import { NetworkWidget } from './components/widgets/NetworkWidget'
import { DockerWidget } from './components/widgets/DockerWidget'
import AdminPage from './pages/AdminPage'
import RSSPage from './pages/RSSPage'
import KnowledgePage from './pages/KnowledgePage'
import type { Service, ServiceStatus } from './lib/types'

function SortableItem({ id, colSpan, rowSpan, children }: { id: string; colSpan: number; rowSpan: number; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const didDrag = useRef(false)

  useDndMonitor({
    onDragStart: () => { didDrag.current = false },
    onDragEnd: (event) => {
      if (String(event.active.id) === id) {
        didDrag.current = true
        setTimeout(() => { didDrag.current = false }, 0)
      }
    },
    onDragCancel: () => { didDrag.current = false },
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined,
        touchAction: 'none',
        ...(colSpan > 1 ? { gridColumn: `span ${colSpan}` } : {}),
        ...(rowSpan > 1 ? { gridRow: `span ${rowSpan}` } : {}),
      }}
      {...attributes}
      {...listeners}
      onClickCapture={(e) => {
        if (didDrag.current) {
          didDrag.current = false
          e.preventDefault()
          e.stopPropagation()
        }
      }}
      className="h-full"
    >
      {children}
    </div>
  )
}

function renderBlock(id: string, services: Service[], statuses: Map<number, ServiceStatus['status']>, statusLoading: boolean) {
  if (id === 'clock') return <ClockWidget />
  if (id === 'weather') return <WeatherWidget />
  if (id === 'metrics') return <MetricsWidget />
  if (id === 'network') return <NetworkWidget />
  if (id === 'docker') return <DockerWidget />
  if (id.startsWith('service:')) {
    const service = services.find(s => s.id === Number(id.slice(8)))
    if (!service) return null
    const status = statusLoading ? 'loading' : statuses.get(service.id)
    return <ServiceCard service={service} status={status} />
  }
  return null
}

function Dashboard() {
  const { user } = useUserStore()
  const { services, loading: servicesLoading } = useServicesStore()
  const { statuses, loading: statusLoading } = useStatus()
  const { settings, updateSettings } = useThemeStore()

  const gridItems = useMemo(() => {
    const widgetIds = new Set(['clock', 'weather', 'metrics', 'network', 'docker'])
    const hiddenWidgets = new Set(settings.hiddenWidgets ?? [])
    const serviceMap = new Map(services.map(s => [s.id, s]))

    const ordered: string[] = []
    for (const id of settings.gridOrder) {
      if (widgetIds.has(id)) {
        if (!hiddenWidgets.has(id)) ordered.push(id)
      } else if (id.startsWith('service:')) {
        const sid = Number(id.slice(8))
        const svc = serviceMap.get(sid)
        if (svc && !svc.hidden) ordered.push(id)
      }
    }
    for (const w of ['clock', 'weather', 'metrics']) {
      if (!hiddenWidgets.has(w) && !ordered.includes(w)) ordered.unshift(w)
    }
    for (const w of ['network', 'docker']) {
      if (!hiddenWidgets.has(w) && !ordered.includes(w)) ordered.push(w)
    }
    for (const s of services) {
      if (s.hidden) continue
      const key = `service:${s.id}`
      if (!ordered.includes(key)) ordered.push(key)
    }
    return ordered
  }, [settings.gridOrder, settings.hiddenWidgets, services])

  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const getGridCols = () => window.innerWidth >= 1280 ? 4 : window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1
  const [gridCols, setGridCols] = useState(getGridCols)
  useEffect(() => {
    const handler = () => setGridCols(getGridCols())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = gridItems.indexOf(String(active.id))
    const newIndex = gridItems.indexOf(String(over.id))
    updateSettings({ ...settings, gridOrder: arrayMove(gridItems, oldIndex, newIndex) })
  }, [gridItems, settings, updateSettings])

  const bgStyle = settings.bgImage
    ? { backgroundImage: `url(${settings.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'var(--color-text)' }
    : { backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }

  return (
    <div className="min-h-screen overflow-x-hidden px-4 py-8" style={bgStyle}>
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <h1 className="flex min-w-0 items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            <img src="/favicon.svg" alt="logo" className="size-8 sm:size-9" />
            <span className="hidden sm:inline">lebedinsky<span style={{ color: 'var(--color-accent)' }}>.space</span></span>
          </h1>
          <div className="flex items-center gap-2">
            <Link
              to="/rss"
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-dim transition hover:border-gray-600 hover:text-medium"
            >
              <Rss size={13} /> <span className="hidden sm:inline">RSS</span>
            </Link>
            <Link
              to="/knowledge"
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-dim transition hover:border-gray-600 hover:text-medium"
            >
              <BookOpen size={13} /> <span className="hidden sm:inline">База знаний</span>
            </Link>
            {user?.isAdmin && (
              <Link
                to="/admin"
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-dim transition hover:border-gray-600 hover:text-medium"
              >
                <Settings size={13} /> <span className="hidden sm:inline">Управление</span>
              </Link>
            )}
          </div>
        </header>

        <main className="grid select-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gridAutoRows: '160px' }}>
          {servicesLoading ? (
            <>
              <ClockWidget />
              <WeatherWidget />
              <MetricsWidget />
              <NetworkWidget />
              <DockerWidget />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl border border-gray-800 bg-gray-900" />
              ))}
            </>
          ) : isMobile ? (
            gridItems.map(id => {
              const block = renderBlock(id, services, statuses, statusLoading)
              if (!block) return null
              const svc = id.startsWith('service:') ? services.find(s => s.id === Number(id.slice(8))) : null
              const rowSpan = svc ? (svc.cardRowSpan ?? 1) : (settings.widgetSpans?.[id]?.rowSpan ?? 1)
              return (
                <div key={id} className="h-full" style={rowSpan > 1 ? { gridRow: `span ${rowSpan}` } : undefined}>
                  {block}
                </div>
              )
            })
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} autoScroll={false}>
              <SortableContext items={gridItems} strategy={rectSortingStrategy}>
                {gridItems.map(id => {
                  const block = renderBlock(id, services, statuses, statusLoading)
                  if (!block) return null
                  const svc = id.startsWith('service:') ? services.find(s => s.id === Number(id.slice(8))) : null
                  const colSpan = Math.min(svc ? (svc.cardColSpan ?? 1) : (settings.widgetSpans?.[id]?.colSpan ?? 1), gridCols)
                  const rowSpan = svc ? (svc.cardRowSpan ?? 1) : (settings.widgetSpans?.[id]?.rowSpan ?? 1)
                  return (
                    <SortableItem key={id} id={id} colSpan={colSpan} rowSpan={rowSpan}>
                      {block}
                    </SortableItem>
                  )
                })}
              </SortableContext>
            </DndContext>
          )}
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { fetch: fetchUser } = useUserStore()
  const { fetch: fetchTheme } = useThemeStore()
  const { fetch: fetchServices } = useServicesStore()

  useEffect(() => {
    fetchUser()
    fetchTheme()
    fetchServices()
  }, [fetchUser, fetchTheme, fetchServices])

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/rss" element={<RSSPage />} />
      <Route path="/knowledge" element={<KnowledgePage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
