import { useEffect, useState } from 'react'

export function useClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

export const fmtTime = (d: Date) => d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
export const fmtDate = (d: Date) =>
  d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
