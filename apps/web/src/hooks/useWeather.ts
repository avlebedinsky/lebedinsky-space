import { useEffect, useRef, useState } from 'react'

interface WeatherData {
  temp: number
  weatherCode: number
  city: string
}

type WeatherState =
  | { status: 'loading' }
  | { status: 'denied' }
  | { status: 'error' }
  | { status: 'ok'; data: WeatherData }

function getWeatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 3) return '⛅'
  if (code <= 48) return '🌫️'
  if (code <= 55) return '🌦️'
  if (code <= 65) return '🌧️'
  if (code <= 77) return '❄️'
  if (code <= 82) return '🌦️'
  if (code <= 86) return '🌨️'
  return '⛈️'
}

function getWeatherDesc(code: number): string {
  if (code === 0) return 'Ясно'
  if (code === 1) return 'Преимущественно ясно'
  if (code === 2) return 'Переменная облачность'
  if (code === 3) return 'Пасмурно'
  if (code <= 48) return 'Туман'
  if (code <= 55) return 'Морось'
  if (code <= 65) return 'Дождь'
  if (code <= 77) return 'Снег'
  if (code <= 82) return 'Ливень'
  if (code <= 86) return 'Снегопад'
  return 'Гроза'
}

export { getWeatherEmoji, getWeatherDesc }

const CACHE_KEY = 'weather_cache'

function loadCache(): WeatherData | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as WeatherData) : undefined
  } catch {
    return undefined
  }
}

export function useWeather(intervalMs = 30 * 60 * 1000) {
  const [state, setState] = useState<WeatherState>(() => {
    const cached = loadCache()
    return cached ? { status: 'ok', data: cached } : { status: 'loading' }
  })
  const lastDataRef = useRef<WeatherData | undefined>(loadCache())

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ status: 'denied' })
      return
    }

    let cancelled = false
    let timerId: ReturnType<typeof setTimeout>

    const fetchWeather = (lat: number, lon: number) => {
      Promise.all([
        fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
        ).then(r => r.json()),
        fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ru`,
        ).then(r => r.json()),
      ])
        .then(([weather, geo]) => {
          if (cancelled) return
          const data: WeatherData = {
            temp: Math.round(weather.current.temperature_2m),
            weatherCode: weather.current.weather_code,
            city: geo.city || geo.locality || geo.principalSubdivision || '',
          }
          lastDataRef.current = data
          localStorage.setItem(CACHE_KEY, JSON.stringify(data))
          setState({ status: 'ok', data })
        })
        .catch(() => {
          if (!cancelled && !lastDataRef.current) setState({ status: 'error' })
        })
        .finally(() => {
          if (!cancelled) {
            timerId = setTimeout(() => fetchWeather(lat, lon), intervalMs)
          }
        })
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        if (!cancelled) fetchWeather(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        if (!cancelled) setState({ status: 'denied' })
      },
      { timeout: 10_000 },
    )

    return () => {
      cancelled = true
      clearTimeout(timerId)
    }
  }, [intervalMs])

  return state
}
