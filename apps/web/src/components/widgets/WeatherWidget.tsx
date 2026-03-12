import { useWeather, getWeatherEmoji, getWeatherDesc } from '../../hooks/useWeather'

export function WeatherWidget() {
  const weather = useWeather()

  return (
    <div className="flex flex-col justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-6">
      {weather.status === 'loading' && (
        <p className="text-sm text-white/30">Определяю геолокацию…</p>
      )}
      {weather.status === 'denied' && (
        <p className="text-sm text-white/30">Нет доступа к геолокации</p>
      )}
      {weather.status === 'error' && (
        <p className="text-sm text-white/30">Не удалось загрузить погоду</p>
      )}
      {weather.status === 'ok' && (
        <>
          <div className="flex items-center gap-3">
            <span className="text-3xl leading-none">{getWeatherEmoji(weather.data.weatherCode)}</span>
            <p className="text-3xl font-bold tracking-tight text-white">{weather.data.temp}°C</p>
          </div>
          <p className="text-sm text-white/40">{getWeatherDesc(weather.data.weatherCode)}</p>
          {weather.data.city && (
            <p className="text-xs text-white/25">{weather.data.city}</p>
          )}
        </>
      )}
    </div>
  )
}
