import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { ContainerInfo } from '../lib/types'

export function useDocker(intervalMs = 30_000) {
  const [containers, setContainers] = useState<ContainerInfo[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = () =>
      api
        .docker()
        .then(setContainers)
        .catch(() => {})
        .finally(() => setLoading(false))
    load()
    const id = setInterval(load, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return { containers, loading }
}
