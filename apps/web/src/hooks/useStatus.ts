import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { ServiceStatus } from '../lib/types'

export function useStatus(intervalMs = 60_000) {
  const [statuses, setStatuses] = useState<Map<number, ServiceStatus['status']>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () =>
      api.status()
        .then(list => setStatuses(new Map(list.map(s => [s.id, s.status]))))
        .catch(() => {})
        .finally(() => setLoading(false))

    load()
    const id = setInterval(load, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return { statuses, loading }
}
