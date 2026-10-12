import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { Check, Minus, X } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Mark } from './data/visits'

export const tone = (s: number) => (s >= 85 ? 'ok' : s >= 70 ? 'warn' : 'crit') as 'ok' | 'warn' | 'crit'
export const TONE = {
  ok: { text: 'text-ok', bg: 'bg-ok/10', ring: 'ring-ok/30', hex: '#22b35e', label: 'Хорошо' },
  warn: { text: 'text-warn', bg: 'bg-warn/10', ring: 'ring-warn/30', hex: '#f5b020', label: 'Есть замечания' },
  crit: { text: 'text-crit', bg: 'bg-crit/10', ring: 'ring-crit/40', hex: '#e5484d', label: 'Требует разбора' },
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx('glass min-w-0', className)}>{children}</section>
}

export function Head({ title, sub, icon: Icon, right }: { title: string; sub?: string; icon?: LucideIcon; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-white/[0.03] text-fg-2"><Icon size={16} strokeWidth={1.8} /></span>}
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
          {sub && <p className="text-xs text-fg-3">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

/** Кольцо оценки 0–100 */
export function ScoreRing({ value, size = 44 }: { value: number; size?: number }) {
  const t = TONE[tone(value)]
  const r = size / 2 - 4
  const c = 2 * Math.PI * r
  return (
    <span className="relative inline-grid shrink-0 place-items-center" style={{ width: size, height: size }} aria-label={`Оценка ${value} из 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={t.hex} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <span className={clsx('num absolute font-semibold', t.text, size >= 64 ? 'text-xl' : 'text-[13px]')}>{value}</span>
    </span>
  )
}

export const MARK: Record<Mark, { label: string; icon: LucideIcon; cls: string }> = {
  ok: { label: 'Выполнено', icon: Check, cls: 'bg-ok/15 text-ok' },
  partial: { label: 'Частично', icon: Minus, cls: 'bg-warn/15 text-warn' },
  fail: { label: 'Не выполнено', icon: X, cls: 'bg-crit/15 text-crit' },
  na: { label: 'Не применимо', icon: Minus, cls: 'bg-white/5 text-fg-3' },
}

export function MarkIcon({ mark }: { mark: Mark }) {
  const m = MARK[mark]
  return (
    <span className={clsx('grid h-6 w-6 shrink-0 place-items-center rounded-md', m.cls)} title={m.label}>
      <m.icon size={14} strokeWidth={2.4} />
    </span>
  )
}

export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 120, h = 34, pad = 4
  const min = Math.min(...data) - 2, max = Math.max(...data) + 2
  const x = (i: number) => (i / (data.length - 1)) * (w - pad * 2) + pad
  const y = (v: number) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2)
  const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const id = `sp${color.slice(1)}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[34px] w-full" preserveAspectRatio="none" aria-hidden>
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${x(data.length - 1)},${h} L${x(0)},${h} Z`} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="3" fill={color} stroke="#0b1119" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
