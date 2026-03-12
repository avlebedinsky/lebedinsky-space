import { useEffect, useState } from 'react'

export function ClockWidget() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const timeAmPm = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const timeUtc = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' })
  const date = now.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex flex-col justify-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="text-3xl font-bold tabular-nums tracking-tight text-white">{time}</p>
      <p className="text-sm tabular-nums text-white/30">{timeAmPm}</p>
      <p className="text-sm tabular-nums text-white/20">UTC {timeUtc}</p>
      <p className="text-sm capitalize text-white/40">{date}</p>
    </div>
  )
}
