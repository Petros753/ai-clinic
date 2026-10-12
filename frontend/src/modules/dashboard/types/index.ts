// Доменные типы AI Dashboard директора клиники.
// Структура повторяет то, что позже будет отдавать API (Home Assistant / BMS / VMS → backend → dashboard).

export type RoomStatus = 'ok' | 'active' | 'warning' | 'alarm' | 'idle'
export type Severity = 'info' | 'warning' | 'alarm' | 'ai'
export type PageId =
  | 'home'
  | 'rooms'
  | 'security'
  | 'cameras'
  | 'analytics'
  | 'reports'
  | 'assistant'
  | 'settings'

export type RoomKind = 'clinical' | 'staff' | 'public' | 'service' | 'sanitary'

export interface DeviceState {
  ac: boolean | null // null — в помещении нет устройства
  vent: boolean | null
  light: boolean | null
  blinds: number | null // % закрытия
}

export interface Equipment {
  id: string
  name: string
  online: boolean
}

export interface RoomEvent {
  time: string // HH:MM
  text: string
  severity: Severity
}

export interface Room {
  id: number
  name: string
  shortName: string
  kind: RoomKind
  status: RoomStatus
  occupied: boolean
  /** Рабочее помещение, учитывается в KPI «Активные кабинеты» */
  workplace: boolean
  temperature: number
  targetTemperature: number
  humidity: number
  co2: number | null // null — нет датчика
  devices: DeviceState
  equipment: Equipment[]
  activity: string
  lastActivity: string // «сейчас», «18 мин назад»
  usageToday: string // «6 ч 24 мин»
  loadPercent: number
  events: RoomEvent[]
  /** Полигон на плане, координаты в системе viewBox 0 0 1447 1087 (пиксели src/assets/clinic-plan.webp) */
  shape: string
  labelAt: [number, number]
}

export interface Camera {
  id: number
  name: string
  zone: string
  online: boolean
  outdoor: boolean
  people: number
  motion: boolean
  lastEvent: string
}

export interface SecurityEvent {
  id: string
  time: string
  text: string
  severity: Severity
  source: string
}

export interface CameraInsight {
  id: string
  title: string
  text: string
  severity: Severity
  metric?: string
}

export interface AppNotification {
  id: string
  severity: Severity
  title: string
  text: string
  time: string
  read: boolean
}

export interface Kpi {
  id: string
  label: string
  value: string
  sub: string
  tone: 'accent' | 'ok' | 'warn' | 'crit' | 'ai' | 'neutral'
  trend?: number[]
}

export interface ReportData {
  period: 'day' | 'week' | 'month'
  title: string
  range: string
  summary: string
  metrics: { label: string; value: string; delta?: string; good?: boolean }[]
  deviations: string[]
  events: { time: string; text: string; severity: Severity }[]
  recommendations: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'ai'
  text: string
}

export interface ClinicOverview {
  name: string
  subtitle: string
  open: boolean
  systemsOk: boolean
  director: { name: string; role: string; initials: string }
  version: string
}
