import { useWeather, getWeatherEmoji, getWeatherDesc } from '../../hooks/useWeather'

export function WeatherWidget() {
  const weather = useWeather()

  return (
    <div className="flex h-full flex-col justify-center gap-1 rounded-2xl border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
      {weather.status === 'loading' && (
        <p className="text-sm text-subtle">Определяю геолокацию…</p>
      )}
      {weather.status === 'denied' && (
        <p className="text-sm text-subtle">Нет доступа к геолокации</p>
      )}
      {weather.status === 'error' && (
        <p className="text-sm text-subtle">Не удалось загрузить погоду</p>
      )}
      {weather.status === 'ok' && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{getWeatherEmoji(weather.data.weatherCode)}</span>
            <p className="text-3xl font-bold tracking-tight">{weather.data.temp}°C</p>
          </div>
          <p className="text-sm text-muted">{getWeatherDesc(weather.data.weatherCode)}</p>
          {weather.data.city && (
            <p className="text-xs text-subtle">{weather.data.city}</p>
          )}
        </>
      )}
    </div>
  )
}
