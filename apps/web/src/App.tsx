import { useMemo, useCallback, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Settings, Palette } from 'lucide-react'
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
import AdminPage from './pages/AdminPage'
import SettingsPage from './pages/SettingsPage'
import type { Service, ServiceStatus } from './lib/types'

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
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
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : undefined,
        touchAction: 'none',
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

function renderBlock(id: string, services: Service[], statuses: Map<number, ServiceStatus['status']>) {
  if (id === 'clock') return <ClockWidget />
  if (id === 'weather') return <WeatherWidget />
  if (id === 'metrics') return <MetricsWidget />
  if (id.startsWith('service:')) {
    const service = services.find(s => s.id === Number(id.slice(8)))
    if (!service) return null
    return <ServiceCard service={service} status={statuses.get(service.id)} />
  }
  return null
}

function Dashboard() {
  const { user, fetch: fetchUser } = useUserStore()
  const { services, loading: servicesLoading, fetch: fetchServices } = useServicesStore()
  const statuses = useStatus()
  const { settings, updateSettings, fetch: fetchTheme } = useThemeStore()

  useEffect(() => {
    fetchUser()
    fetchServices()
    fetchTheme()
  }, [])

  const gridItems = useMemo(() => {
    const widgetIds = new Set(['clock', 'weather', 'metrics'])
    const serviceMap = new Map(services.map(s => [s.id, s]))

    const ordered: string[] = []
    for (const id of settings.gridOrder) {
      if (widgetIds.has(id)) {
        ordered.push(id)
      } else if (id.startsWith('service:')) {
        const sid = Number(id.slice(8))
        if (serviceMap.has(sid)) ordered.push(id)
      }
    }
    for (const w of ['clock', 'weather', 'metrics']) {
      if (!ordered.includes(w)) ordered.unshift(w)
    }
    for (const s of services) {
      const key = `service:${s.id}`
      if (!ordered.includes(key)) ordered.push(key)
    }
    return ordered
  }, [settings.gridOrder, services])

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
    ? { backgroundImage: `url(${settings.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: 'var(--color-bg)' }

  return (
    <div className="min-h-screen px-4 py-16" style={bgStyle}>
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            <img src="/favicon.svg" alt="logo" className="size-8 sm:size-9" />
            <span>lebedinsky<span className="text-indigo-400">.space</span></span>
          </h1>
          {user?.isAdmin && (
            <div className="flex items-center gap-2">
              <Link
                to="/settings"
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70"
              >
                <Palette size={13} /> Внешний вид
              </Link>
              <Link
                to="/admin"
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70"
              >
                <Settings size={13} /> Управление
              </Link>
            </div>
          )}
        </header>

        <main className="grid select-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ gridAutoRows: '160px' }}>
          {servicesLoading ? (
            <>
              <ClockWidget />
              <WeatherWidget />
              <MetricsWidget />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              ))}
            </>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={gridItems} strategy={rectSortingStrategy}>
                {gridItems.map(id => {
                  const block = renderBlock(id, services, statuses)
                  if (!block) return null
                  return (
                    <SortableItem key={id} id={id}>
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  )
}
