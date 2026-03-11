import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { useServices } from './hooks/useServices'
import { useStatus } from './hooks/useStatus'
import { useMe } from './hooks/useMe'
import { ServiceCard } from './components/ServiceCard'
import AdminPage from './pages/AdminPage'

function Dashboard() {
  const { user } = useMe()
  const { services, loading } = useServices()
  const statuses = useStatus()

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 flex items-start justify-between">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              lebedinsky<span className="text-indigo-400">.space</span>
            </h1>
            <p className="mt-2 text-sm text-white/40">
              {user ? `${user.username} · личные сервисы` : 'личные сервисы'}
            </p>
          </div>
          {user?.isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/40 transition hover:border-white/20 hover:text-white/70"
            >
              <Settings size={13} /> Управление
            </Link>
          )}
        </header>

        <main className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
