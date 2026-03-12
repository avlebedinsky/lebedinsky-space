import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { ServerMetrics } from '../lib/types'

export function useMetrics(intervalMs = 15_000) {
  const [metrics, setMetrics] = useState<ServerMetrics | null>(null)

  useEffect(() => {
    const load = () => api.metrics().then(setMetrics).catch(() => {})
    load()
    const id = setInterval(load, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return metrics
}
