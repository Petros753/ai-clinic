import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ROLE_LABEL, useUser } from '../../../shell/auth'
import { api } from '../api/client'
import type {
  AppNotification,
  Camera,
  CameraInsight,
  ClinicOverview,
  ReportData,
  Room,
  SecurityEvent,
} from '../types'

interface RawData {
  overview: ClinicOverview
  rooms: Room[]
  cameras: Camera[]
  securityEvents: { day: string; items: SecurityEvent[] }[]
  insights: CameraInsight[]
  notifications: AppNotification[]
  reports: ReportData[]
}

interface DataCtx extends RawData {
  /** Демо-режим: смоделированная тревога (движение в зоне хранения отходов) */
  alarm: boolean
  setAlarm: (v: boolean) => void
  markAllRead: () => void
  unread: number
  alarmsCount: number
}

const Ctx = createContext<DataCtx | null>(null)

const ALARM_ROOM = 12
const ALARM_NOTE: AppNotification = {
  id: 'alarm-demo',
  severity: 'alarm',
  title: 'Тревога · Хранение отходов',
  text: 'Движение в помещении хранения отходов. Дверь открыта без авторизации. Камера 9 ведёт запись.',
  time: 'сейчас',
  read: false,
}
const ALARM_EVENT: SecurityEvent = {
  id: 'alarm-ev',
  time: 'сейчас',
  text: 'Движение в помещении хранения отходов, дверь открыта без авторизации',
  severity: 'alarm',
  source: 'Камера 9 · датчик двери',
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<RawData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [alarm, setAlarm] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const user = useUser()

  useEffect(() => {
    let alive = true
    Promise.all([
      api.overview(), api.rooms(), api.cameras(), api.securityEvents(),
      api.cameraInsights(), api.notifications(), api.reports(),
    ])
      .then(([overview, rooms, cameras, securityEvents, insights, notifications, reports]) => {
        if (alive) setRaw({ overview, rooms, cameras, securityEvents, insights, notifications, reports })
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [])

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev)
      raw?.notifications.forEach((n) => next.add(n.id))
      next.add(ALARM_NOTE.id)
      return next
    })
  }, [raw])

  const value = useMemo<DataCtx | null>(() => {
    if (!raw) return null
    const rooms = raw.rooms.map((r) =>
      alarm && r.id === ALARM_ROOM
        ? { ...r, status: 'alarm' as const, activity: 'Движение без авторизации', lastActivity: 'сейчас' }
        : r,
    )
    const notifications = (alarm ? [ALARM_NOTE, ...raw.notifications] : raw.notifications).map((n) => ({
      ...n,
      read: n.read || readIds.has(n.id),
    }))
    const securityEvents = alarm
      ? raw.securityEvents.map((g, i) => (i === 0 ? { ...g, items: [ALARM_EVENT, ...g.items] } : g))
      : raw.securityEvents
    // Приветствие и карточка в сайдбаре — для того, кто вошёл
    const director = {
      name: user.name,
      role: user.is_director ? raw.overview.director.role : ROLE_LABEL[user.role],
      initials: user.name.trim().charAt(0).toUpperCase(),
    }
    return {
      ...raw,
      overview: { ...raw.overview, director },
      rooms,
      notifications,
      securityEvents,
      alarm,
      setAlarm,
      markAllRead,
      unread: notifications.filter((n) => !n.read).length,
      alarmsCount: alarm ? 1 : 0,
    }
  }, [raw, alarm, readIds, markAllRead, user])

  if (error) {
    return (
      <div className="grid min-h-[calc(100vh_-_var(--shell-h))] place-items-center p-6 text-center text-fg-2">
        Не удалось загрузить данные клиники: {error}
      </div>
    )
  }
  if (!value) {
    return (
      <div className="grid min-h-[calc(100vh_-_var(--shell-h))] place-items-center">
        <div className="flex items-center gap-3 text-sm text-fg-2">
          <span className="h-2 w-2 animate-ping rounded-full bg-accent" />
          Подключение к клинике…
        </div>
      </div>
    )
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useData must be used inside DataProvider')
  return v
}
