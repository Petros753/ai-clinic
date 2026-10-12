import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DayPoint } from '../../lib/analytics'
import { fmtRub } from '../../lib/stock'

// Токены графиков (тёмная тема). Категориальные цвета — в data/mock.ts,
// проверены валидатором палитры на поверхности #0f1620 (все проверки PASS).
export const CHART = {
  grid: 'rgba(148,176,214,0.08)',
  axis: '#6d7b8e',
  accent: '#3987e5',
  accentHi: '#5cc8ff',
  muted: '#2a3444',
}

const axisProps = { tick: { fill: CHART.axis, fontSize: 11 }, tickLine: false, axisLine: false } as const

interface TipProps { active?: boolean; payload?: { payload: DayPoint }[] }

function DayTip({ active, payload }: TipProps) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="glass-strong min-w-[150px] px-3 py-2 text-xs">
      <div className="mb-1 text-fg-3">{p.label}{p.weekend ? ' · выходной' : ''}</div>
      <div className="flex justify-between gap-4"><span className="text-fg-2">Расход</span><span className="num font-medium text-fg">{fmtRub(p.sum)}</span></div>
      <div className="flex justify-between gap-4"><span className="text-fg-2">Единиц</span><span className="num font-medium text-fg">{p.units}</span></div>
    </div>
  )
}

/** Расход по дням, ₽. Одна серия; сегодняшний столбец подсвечен. */
export function DailyChart({ data, height = 220 }: { data: DayPoint[]; height?: number }) {
  const last = data.length - 1
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap={2}>
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...axisProps} width={40} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}к` : String(v))} />
        <Tooltip content={<DayTip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="sum" radius={[4, 4, 0, 0]} maxBarSize={22} animationDuration={800}>
          {data.map((d, i) => <Cell key={d.key} fill={i === last ? CHART.accentHi : CHART.accent} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/**
 * Горизонтальные полосы с прямыми подписями — для категорий, кабинетов, топа.
 * Сделано на HTML: подписи не обрезаются на телефоне, есть подсказка по наведению.
 */
export function HBars({ rows, format = fmtRub }: { rows: { id: string; name: string; value: number; color?: string; sub?: string }[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  const total = rows.reduce((s, r) => s + r.value, 0) || 1
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.id} className="group" title={`${r.name}: ${format(r.value)} · ${Math.round((r.value / total) * 100)}%`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-fg-2">
              {r.color && <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: r.color }} />}
              <span className="truncate">{r.name}</span>
              {r.sub && <span className="hidden shrink-0 text-xs text-fg-3 sm:inline">{r.sub}</span>}
            </span>
            <span className="num shrink-0 text-fg">{format(r.value)} <span className="text-xs text-fg-3">{Math.round((r.value / total) * 100)}%</span></span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.04]">
            <div className="h-full rounded-full transition-[filter] group-hover:brightness-125" style={{ width: `${Math.max(1.5, (r.value / max) * 100)}%`, background: r.color ?? CHART.accent }} />
          </div>
        </li>
      ))}
    </ul>
  )
}
