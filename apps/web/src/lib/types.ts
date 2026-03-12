export interface Service {
  id: number
  name: string
  description: string
  url: string
  iconName: string
  color: string
  sortOrder: number
  createdAt: string
}

export interface User {
  username: string
  isAdmin: boolean
}

export interface ServiceStatus {
  id: number
  status: 'up' | 'down' | 'unknown'
}

export interface ServerMetrics {
  hostname: string
  cpu: number
  ram: number
  disk: number
}

export interface SiteSettings {
  bgColor: string
  bgImage: string
  cardColor: string
  accentColor: string
  borderColor: string
  textColor: string
  gridOrder: string[]
}
