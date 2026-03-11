import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import type { Service } from '../lib/types'

export function useServices() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    return api.services.list()
      .then(setServices)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (data: Omit<Service, 'id' | 'createdAt'>) => {
    const s = await api.services.create(data)
    setServices(prev => [...prev, s])
    return s
  }, [])

  const update = useCallback(async (id: number, data: Omit<Service, 'id' | 'createdAt'>) => {
    const s = await api.services.update(id, data)
    setServices(prev => prev.map(x => x.id === id ? s : x))
    return s
  }, [])

  const remove = useCallback(async (id: number) => {
    await api.services.delete(id)
    setServices(prev => prev.filter(x => x.id !== id))
  }, [])

  return { services, loading, create, update, remove, reload: load }
}
