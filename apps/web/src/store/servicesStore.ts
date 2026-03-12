import { create } from 'zustand'
import { api } from '../lib/api'
import type { Service } from '../lib/types'

interface ServicesStore {
  services: Service[]
  loading: boolean
  fetch: () => Promise<void>
  create: (data: Omit<Service, 'id' | 'createdAt'>) => Promise<Service>
  update: (id: number, data: Omit<Service, 'id' | 'createdAt'>) => Promise<Service>
  remove: (id: number) => Promise<void>
}

export const useServicesStore = create<ServicesStore>((set) => ({
  services: [],
  loading: true,

  fetch: async () => {
    set({ loading: true })
    try {
      const services = await api.services.list()
      set({ services })
    } finally {
      set({ loading: false })
    }
  },

  create: async (data) => {
    const s = await api.services.create(data)
    set(state => ({ services: [...state.services, s] }))
    return s
  },

  update: async (id, data) => {
    const s = await api.services.update(id, data)
    set(state => ({ services: state.services.map(x => x.id === id ? s : x) }))
    return s
  },

  remove: async (id) => {
    await api.services.delete(id)
    set(state => ({ services: state.services.filter(x => x.id !== id) }))
  },
}))
