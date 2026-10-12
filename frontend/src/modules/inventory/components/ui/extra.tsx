import clsx from 'clsx'
import type { LucideIcon } from 'lucide-react'
import { Minus, Plus } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { Card, Sparkline } from '.'

const TONE = {
  accent: { text: 'text-accent', color: '#5cc8ff', ring: 'border-line' },
  ok: { text: 'text-ok', color: '#22b35e', ring: 'border-line' },
  warn: { text: 'text-warn', color: '#f5b020', ring: 'border-warn/25' },
  crit: { text: 'text-crit', color: '#e5484d', ring: 'border-crit/30' },
  ai: { text: 'text-ai', color: '#9d8cff', ring: 'border-line' },
  neutral: { text: 'text-fg', color: '#a3b0c0', ring: 'border-line' },
} as const

export type Tone = keyof typeof TONE

export function Kpi({
  label, value, sub, icon: Icon, tone = 'neutral', trend, i = 0, onClick,
}: { label: string; value: ReactNode; sub?: ReactNode; icon: LucideIcon; tone?: Tone; trend?: number[]; i?: number; onClick?: () => void }) {
  const t = TONE[tone]
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="label">{label}</span>
        <Icon size={16} strokeWidth={1.8} className={t.text} />
      </div>
      <div className={clsx('num mt-2 text-[28px] font-semibold leading-none tracking-tight', tone === 'neutral' ? 'text-fg' : t.text)}>{value}</div>
      {sub && <div className="mt-1.5 truncate text-xs text-fg-3">{sub}</div>}
      {trend && trend.length > 1 && <div className="mt-2"><Sparkline data={trend} color={t.color} /></div>}
    </>
  )
  return (
    <Card i={i} as="div" className={clsx('p-4', t.ring !== 'border-line' && t.ring)}>
      {onClick ? (
        <button type="button" onClick={onClick} className="block w-full text-left">{body}</button>
      ) : body}
    </Card>
  )
}

export function Stepper({ value, onChange, min = 1, max = 999 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, v)))
  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-white/[0.03]">
      <button type="button" onClick={() => set(value - 1)} disabled={value <= min} className="grid h-11 w-11 place-items-center text-fg-2 transition hover:text-fg disabled:opacity-30" aria-label="Меньше">
        <Minus size={18} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => set(Number(e.target.value) || min)}
        className="num h-11 w-16 border-x border-line bg-transparent text-center text-lg font-semibold text-fg outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        aria-label="Количество"
      />
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} className="grid h-11 w-11 place-items-center text-fg-2 transition hover:text-fg disabled:opacity-30" aria-label="Больше">
        <Plus size={18} />
      </button>
    </div>
  )
}

export function Field({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={clsx('block min-w-0', className)}>
      <span className="label mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-fg-3">{hint}</span>}
    </label>
  )
}

const inputCls = 'h-10 w-full rounded-xl border border-line bg-white/[0.03] px-3 text-sm text-fg outline-none transition placeholder:text-fg-3 focus:border-accent/50 focus:bg-white/[0.05]'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx(inputCls, className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={clsx(inputCls, 'appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-8', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236d7b8e' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...rest}
    >
      {children}
    </select>
  )
}

// ---------- штрихкод EAN-13 ----------

const L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011']
const G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111']
const R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100']
const PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL']

function eanBits(code: string): string | null {
  if (!/^\d{13}$/.test(code)) return null
  const d = code.split('').map(Number)
  const p = PARITY[d[0]]
  let bits = '101'
  for (let i = 1; i <= 6; i++) bits += (p[i - 1] === 'L' ? L : G)[d[i]]
  bits += '01010'
  for (let i = 7; i <= 12; i++) bits += R[d[i]]
  return bits + '101'
}

/** Настоящий сканируемый EAN-13 в SVG — можно распечатать и проверить сканером */
export function Barcode({ code, className, light }: { code: string; className?: string; light?: boolean }) {
  const bits = eanBits(code)
  if (!bits) return <span className="font-mono text-xs text-fg-3">{code}</span>
  const guards = new Set([0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94])
  const w = 95 + 18
  return (
    <svg viewBox={`0 0 ${w} 62`} className={clsx('block', className)} role="img" aria-label={`Штрихкод ${code}`}>
      <rect width={w} height="62" rx="3" fill={light ? '#fff' : 'transparent'} />
      {bits.split('').map((b, i) =>
        b === '1' ? <rect key={i} x={i + 11} y="4" width="1" height={guards.has(i) ? 50 : 44} fill={light ? '#0b1119' : '#e7edf4'} /> : null,
      )}
      <g fontFamily="JetBrains Mono, monospace" fontSize="7.5" fill={light ? '#0b1119' : '#a3b0c0'} textAnchor="middle">
        <text x="5" y="56">{code[0]}</text>
        <text x={11 + 3 + 21} y="56" letterSpacing="1.6">{code.slice(1, 7)}</text>
        <text x={11 + 50 + 21} y="56" letterSpacing="1.6">{code.slice(7)}</text>
      </g>
    </svg>
  )
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={clsx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium', className)}>{children}</span>
}
