import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { useServices } from './hooks/useServices'
import { useStatus } from './hooks/useStatus'
import { useMe } from './hooks/useMe'
import { ServiceCard } from './components/ServiceCard'
import { ClockWidget } from './components/widgets/ClockWidget'
import { WeatherWidget } from './components/widgets/WeatherWidget'
import { MetricsWidget } from './components/widgets/MetricsWidget'
import AdminPage from './pages/AdminPage'

function Dashboard() {
  const { user } = useMe()
  const { services, loading } = useServices()
  const statuses = useStatus()
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            <img src="/favicon.svg" alt="logo" className="size-8 sm:size-9" />
            <span>lebedinsky<span className="text-indigo-400">.space</span></span>
          </h1>
          {user?.isAdmin && (
            <Link
              to="/admin"
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70"
            >
              <Settings size={13} /> Управление
            </Link>
          )}
        </header>

        <main className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ClockWidget />
          <WeatherWidget />
          <MetricsWidget />
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              ))
            : services.map(service => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  status={statuses.get(service.id)}
                />
              ))}
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
      </Routes>
    </BrowserRouter>
  )
}
