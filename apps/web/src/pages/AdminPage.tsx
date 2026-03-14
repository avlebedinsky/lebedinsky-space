import { Link, Navigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useUserStore } from '../store/userStore'
import { useThemeStore } from '../store/themeStore'
import { WidgetsSection } from './admin/WidgetsSection'
import { ServicesSection } from './admin/ServicesSection'
import { RSSSection } from './admin/RSSSection'

export default function AdminPage() {
  const { user, loading: userLoading } = useUserStore()
  const { settings } = useThemeStore()

  if (userLoading) return null
  if (!user?.isAdmin) return <Navigate to="/" replace />

  const bgStyle = settings.bgImage
    ? { backgroundImage: `url(${settings.bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', color: 'var(--color-text)' }
    : { backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }

  return (
    <div className="min-h-screen px-4 py-16" style={bgStyle}>
      <div className="mx-auto max-w-4xl">
        <header className="mb-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-dim cursor-pointer transition hover:border-gray-600 hover:text-medium"
            >
              <ArrowLeft size={13} /> Назад
            </Link>
            <div className="h-5 w-px bg-gray-800" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Управление</h1>
          </div>
        </header>

        <div className="flex flex-col gap-10">
          <WidgetsSection />
          <ServicesSection />
          <RSSSection />
        </div>
      </div>
    </div>
  )
}
