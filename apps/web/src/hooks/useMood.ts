import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import type { MoodEntry } from '../lib/types'

interface UseMoodResult {
  entries: MoodEntry[]
  loading: boolean
  logMood: (mood: number, note: string) => Promise<void>
  deleteMood: (id: number) => Promise<void>
}

export function useMood(): UseMoodResult {
  const [entries, setEntries] = useState<MoodEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.mood.list()
      .then(setEntries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const logMood = async (mood: number, note: string) => {
    const entry = await api.mood.create({ mood, note })
    setEntries(prev => [entry, ...prev])
  }

  const deleteMood = async (id: number) => {
    await api.mood.delete(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  return { entries, loading, logMood, deleteMood }
}
