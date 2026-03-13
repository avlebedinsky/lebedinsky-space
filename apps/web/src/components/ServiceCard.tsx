import { createElement } from 'react'
import { ExternalLink } from 'lucide-react'
import type { Service, ServiceStatus } from '../lib/types'
import { getIcon } from '../lib/icons'
import { StatusDot } from './StatusDot'

interface Props {
  service: Service
  status?: ServiceStatus['status'] | 'loading'
}

export function ServiceCard({ service, status }: Props) {
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => window.open(service.url, '_blank', 'noopener,noreferrer')}
      onKeyDown={(e) => e.key === 'Enter' && window.open(service.url, '_blank', 'noopener,noreferrer')}
      className="group relative flex h-full cursor-pointer flex-col gap-4 rounded-2xl border p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
      style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
    >
      <div
        className="flex size-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${service.color}20`, color: service.color }}
      >
        {createElement(getIcon(service.iconName), { size: 24 })}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{service.name}</h2>
          {status && <StatusDot status={status} />}
        </div>
        <p className="mt-1 text-sm text-muted">{service.description}</p>
      </div>

      <ExternalLink
        size={16}
        className="absolute right-5 top-5 text-subtle transition-colors group-hover:text-muted"
      />
    </div>
  )
}
