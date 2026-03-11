import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import type { User } from '../lib/types'

export function useMe() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.me()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  return { user, loading }
}
