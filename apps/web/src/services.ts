import type { LucideIcon } from 'lucide-react'
import { Shield, Workflow, MessageSquare } from 'lucide-react'

export interface Service {
  name: string
  description: string
  url: string
  icon: LucideIcon
  color: string
}

export const services: Service[] = [
  {
    name: 'Xray Panel',
    description: 'Управление прокси и VPN',
    url: 'https://panel.lebedinsky.space',
    icon: Shield,
    color: '#6366f1',
  },
  {
    name: 'n8n',
    description: 'Автоматизация рабочих процессов',
    url: 'https://n8n.lebedinsky.space',
    icon: Workflow,
    color: '#f59e0b',
  },
  {
    name: 'WebUI',
    description: 'AI интерфейс',
    url: 'https://webui.lebedinsky.space',
    icon: MessageSquare,
    color: '#10b981',
  },
]
