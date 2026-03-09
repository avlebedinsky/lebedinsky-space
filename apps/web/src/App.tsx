import { services } from './services'
import { ServiceCard } from './components/ServiceCard'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-950 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <header className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            lebedinsky<span className="text-indigo-400">.space</span>
          </h1>
          <p className="mt-2 text-sm text-white/40">личные сервисы</p>
        </header>

        <main className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.name} service={service} />
          ))}
        </main>
      </div>
    </div>
  )
}
