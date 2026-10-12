import clsx from 'clsx'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LEVEL, SEVERITY } from '../../lib/stock'
import type { Severity, StockLevel } from '../../types'

export const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } }),
}

export function Card({
  children, className, i = 0, as = 'section',
}: { children: ReactNode; className?: string; i?: number; as?: 'section' | 'div' | 'article' }) {
  const Comp = as === 'div' ? motion.div : as === 'article' ? motion.article : motion.section
  return (
    <Comp variants={fadeUp} initial="hidden" animate="show" custom={i} className={clsx('glass min-w-0', className)}>
      {children}
    </Comp>
  )
}

export function CardHeader({
  title, icon: Icon, right, sub, className,
}: { title: string; icon?: LucideIcon; right?: ReactNode; sub?: string; className?: string }) {
  return (
    <div className={clsx('flex items-start justify-between gap-3', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-white/[0.03] text-fg-2">
            <Icon size={16} strokeWidth={1.8} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold text-fg">{title}</h3>
          {sub && <p className="truncate text-xs text-fg-3">{sub}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

export function StatusDot({ status, pulse }: { status: StockLevel; pulse?: boolean }) {
  const c = LEVEL[status].color
  return (
    <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
      {(pulse || status === 'out') && (
        <span className="ring-pulse absolute inset-0 rounded-full" style={{ background: c }} />
      )}
      <span className="relative h-2.5 w-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 10px ${c}66` }} />
    </span>
  )
}

export function StatusPill({ status, label }: { status: StockLevel; label?: string }) {
  const s = LEVEL[status]
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset', s.bg, s.text, s.ring)}>
      <StatusDot status={status} />
      {label ?? s.label}
    </span>
  )
}

export function SeverityIcon({ severity, size = 16 }: { severity: Severity; size?: number }) {
  const s = SEVERITY[severity]
  const Icon = s.icon
  return (
    <span className={clsx('grid shrink-0 place-items-center rounded-lg', s.bg, s.text, severity === 'alarm' && 'alarm-pulse')} style={{ width: size + 14, height: size + 14 }}>
      <Icon size={size} strokeWidth={1.9} />
    </span>
  )
}

export function Button({
  children, variant = 'ghost', icon: Icon, className, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'ai' | 'subtle'; icon?: LucideIcon }) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-gradient-to-b from-[#6fd0ff] to-[#3a9df0] text-ink-950 shadow-[0_8px_24px_-10px_rgba(92,200,255,0.7)] hover:brightness-110',
        variant === 'ai' && 'bg-gradient-to-br from-[#a898ff] to-[#6f5ce6] text-white shadow-[0_8px_24px_-10px_rgba(157,140,255,0.8)] hover:brightness-110',
        variant === 'ghost' && 'border border-line bg-white/[0.03] text-fg hover:border-white/20 hover:bg-white/[0.06]',
        variant === 'subtle' && 'text-fg-2 hover:bg-white/[0.05] hover:text-fg',
        className,
      )}
      {...rest}
    >
      {Icon && <Icon size={16} strokeWidth={1.9} />}
      {children}
    </button>
  )
}

export function Segmented<T extends string>({
  value, onChange, options, className,
}: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <div role="tablist" className={clsx('inline-flex max-w-full overflow-x-auto rounded-xl border border-line bg-white/[0.02] p-1 [scrollbar-width:none]', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          type="button"
          onClick={() => onChange(o.value)}
          className={clsx('relative shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', o.value === value ? 'text-fg' : 'text-fg-3 hover:text-fg-2')}
        >
          {o.value === value && (
            <motion.span layoutId={`seg-${options.map((x) => x.value).join('')}`} className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.07]" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
          )}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  )
}

/** Мини-график для KPI. Одна линия, площадь, подчёркнутая последняя точка. */
export function Sparkline({ data, color = '#5cc8ff', height = 34 }: { data: number[]; color?: string; height?: number }) {
  const w = 120
  const h = height
  const min = Math.min(...data)
  const max = Math.max(...data)
  const pad = 4
  const x = (i: number) => (i / (data.length - 1)) * (w - pad * 2) + pad
  const y = (v: number) => h - pad - ((v - min) / (max - min || 1)) * (h - pad * 2)
  const line = data.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `${line} L${x(data.length - 1)},${h} L${x(0)},${h} Z`
  const id = `sg-${color.replace('#', '')}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[34px] w-full" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(data.length - 1)} cy={y(data[data.length - 1])} r="3" fill={color} stroke="#0b1119" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export function Meter({ value, color = '#5cc8ff' }: { value: number; color?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
      <motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
    </div>
  )
}

/** Простой рендер ответа AI: абзацы, списки «- » и «1. », **жирный**. */
export function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/)
  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') ? <strong key={i} className="font-semibold text-fg">{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>,
    )
  return (
    <div className="space-y-2.5">
      {blocks.map((b, bi) => {
        const lines = b.split('\n')
        const ordered = lines.every((l) => /^\d+\.\s/.test(l))
        const bullet = lines.every((l) => /^-\s/.test(l))
        if (ordered || bullet) {
          const Tag = ordered ? 'ol' : 'ul'
          return (
            <Tag key={bi} className={clsx('space-y-1.5 pl-5', ordered ? 'list-decimal marker:text-ai' : 'list-disc marker:text-fg-3')}>
              {lines.map((l, li) => <li key={li}>{inline(l.replace(/^(\d+\.|-)\s/, ''))}</li>)}
            </Tag>
          )
        }
        return <p key={bi}>{lines.map((l, li) => <span key={li}>{inline(l)}{li < lines.length - 1 && <br />}</span>)}</p>
      })}
    </div>
  )
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-semibold tracking-[-0.01em] text-fg">{title}</h1>
        {sub && <p className="mt-1 text-sm text-fg-2">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-fg-3">{children}</div>
}
