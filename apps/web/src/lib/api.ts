import type { Service, User, ServiceStatus, ServerMetrics, SiteSettings, ContainerInfo, RSSFeed, RSSFeedWithItems, KBNode, KBFileContent } from './types'

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `${res.status} ${res.statusText}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  me: (): Promise<User> => request('/me'),

  services: {
    list: (): Promise<Service[]> => request('/services'),
    create: (data: Omit<Service, 'id' | 'createdAt'>): Promise<Service> =>
      request('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Omit<Service, 'id' | 'createdAt'>): Promise<Service> =>
      request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number): Promise<void> =>
      request(`/services/${id}`, { method: 'DELETE' }),
  },

  status: (): Promise<ServiceStatus[]> => request('/status'),

  metrics: (): Promise<ServerMetrics> => request('/metrics'),

  docker: (): Promise<ContainerInfo[]> => request('/docker'),

  settings: {
    get: (): Promise<SiteSettings> => request('/settings'),
    update: (data: SiteSettings): Promise<SiteSettings> =>
      request('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },

  rss: {
    feeds: {
      list: (): Promise<RSSFeed[]> => request('/rss/feeds'),
      create: (data: { title: string; url: string }): Promise<RSSFeed> =>
        request('/rss/feeds', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: number, data: { title: string; url: string; hidden: boolean }): Promise<RSSFeed> =>
        request(`/rss/feeds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: (id: number): Promise<void> =>
        request(`/rss/feeds/${id}`, { method: 'DELETE' }),
    },
    items: (): Promise<RSSFeedWithItems[]> => request('/rss/items'),
  },

  knowledge: {
    tree: (): Promise<KBNode[]> => request('/knowledge/tree'),
    file: (path: string): Promise<KBFileContent> => request(`/knowledge/file?path=${encodeURIComponent(path)}`),
  },
}
