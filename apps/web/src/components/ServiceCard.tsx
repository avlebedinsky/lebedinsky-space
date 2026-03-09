import { ExternalLink } from 'lucide-react'
import type { Service } from '../services'

interface Props {
  service: Service
}

export function ServiceCard({ service }: Props) {
  const Icon = service.icon

  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:scale-[1.02] hover:shadow-xl"
    >
      <div
        className="flex size-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${service.color}20`, color: service.color }}
      >
        <Icon size={24} />
      </div>

      <div className="flex-1">
        <h2 className="text-lg font-semibold text-white">{service.name}</h2>
        <p className="mt-1 text-sm text-white/50">{service.description}</p>
      </div>

      <ExternalLink
        size={16}
        className="absolute right-5 top-5 text-white/20 transition-colors group-hover:text-white/50"
      />
    </a>
  )
}
