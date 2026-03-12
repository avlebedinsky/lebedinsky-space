import type { Service, User, ServiceStatus } from './types'

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
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

}
