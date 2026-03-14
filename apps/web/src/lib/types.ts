export interface Service {
  id: number
  name: string
  description: string
  url: string
  iconName: string
  color: string
  sortOrder: number
  hidden: boolean
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
  uptime?: number
  netIn?: number
  netOut?: number
}

export interface ContainerInfo {
  id: string
  name: string
  image: string
  state: string
  status: string
}

export interface RSSFeed {
  id: number
  title: string
  url: string
  createdAt: string
}

export interface RSSItem {
  title: string
  link: string
  description: string
  published: string
}

export interface RSSFeedWithItems {
  feed: RSSFeed
  items: RSSItem[]
}

export interface SiteSettings {
  bgColor: string
  bgImage: string
  cardColor: string
  accentColor: string
  borderColor: string
  textColor: string
  gridOrder: string[]
  hiddenWidgets: string[]
}
