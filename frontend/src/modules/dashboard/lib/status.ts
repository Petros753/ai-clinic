import { CircleAlert, Info, Siren, Sparkles, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { RoomStatus, Severity } from '../types'

export const ROOM_STATUS: Record<RoomStatus, { label: string; color: string; text: string; bg: string; ring: string }> = {
  ok: { label: 'Норма', color: '#22b35e', text: 'text-ok', bg: 'bg-ok/10', ring: 'ring-ok/30' },
  active: { label: 'Активно', color: '#5cc8ff', text: 'text-accent', bg: 'bg-accent/10', ring: 'ring-accent/30' },
  warning: { label: 'Предупреждение', color: '#f5b020', text: 'text-warn', bg: 'bg-warn/10', ring: 'ring-warn/30' },
  alarm: { label: 'Тревога', color: '#e5484d', text: 'text-crit', bg: 'bg-crit/10', ring: 'ring-crit/40' },
  idle: { label: 'Не используется', color: '#5b6778', text: 'text-fg-3', bg: 'bg-white/5', ring: 'ring-white/10' },
}

export const SEVERITY: Record<Severity, { label: string; icon: LucideIcon; text: string; bg: string; dot: string }> = {
  info: { label: 'Информация', icon: Info, text: 'text-accent', bg: 'bg-accent/10', dot: 'bg-accent' },
  warning: { label: 'Предупреждение', icon: TriangleAlert, text: 'text-warn', bg: 'bg-warn/10', dot: 'bg-warn' },
  alarm: { label: 'Тревога', icon: Siren, text: 'text-crit', bg: 'bg-crit/10', dot: 'bg-crit' },
  ai: { label: 'AI-рекомендация', icon: Sparkles, text: 'text-ai', bg: 'bg-ai/10', dot: 'bg-ai' },
}

export const AlertIcon = CircleAlert

/** Цвет температуры относительно заданной */
export function tempTone(t: number, target: number) {
  const d = Math.abs(t - target)
  if (d >= 1.5) return 'text-warn'
  return 'text-fg'
}

export function co2Tone(v: number | null) {
  if (v == null) return 'text-fg-3'
  if (v >= 1000) return 'text-crit'
  if (v >= 800) return 'text-warn'
  return 'text-fg'
}
