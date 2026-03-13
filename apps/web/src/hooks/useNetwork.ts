import { useEffect, useRef, useState } from 'react'
import { api } from '../lib/api'

export interface NetworkInfo {
  uptime: number
  rateInKBps: number
  rateOutKBps: number
}

export function useNetwork(intervalMs = 15_000) {
  const [info, setInfo] = useState<NetworkInfo | null>(null)
  const prev = useRef<{ netIn: number; netOut: number; ts: number } | null>(null)

  useEffect(() => {
    const load = () =>
      api
        .metrics()
        .then((m) => {
          const now = Date.now()
          const netIn = m.netIn ?? 0
          const netOut = m.netOut ?? 0
          let rateInKBps = 0
          let rateOutKBps = 0
          if (prev.current) {
            const dtSec = (now - prev.current.ts) / 1000
            if (dtSec > 0) {
              rateInKBps = Math.max(0, (netIn - prev.current.netIn) / dtSec / 1024)
              rateOutKBps = Math.max(0, (netOut - prev.current.netOut) / dtSec / 1024)
            }
          }
          prev.current = { netIn, netOut, ts: now }
          setInfo({ uptime: m.uptime ?? 0, rateInKBps, rateOutKBps })
        })
        .catch(() => {})
    load()
    const id = setInterval(load, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return info
}
