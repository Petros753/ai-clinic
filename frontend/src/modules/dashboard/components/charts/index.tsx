import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceArea,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

// Токены графиков (тёмная тема). Категориальные цвета проверены валидатором
// палитры: CVD ΔE ≥ 9.4, контраст ≥ 3:1 на поверхности #0f1620.
export const CHART = {
  grid: 'rgba(148,176,214,0.08)',
  axis: '#6d7b8e',
  text: '#a3b0c0',
  accent: '#5cc8ff',
  muted: '#4a5567',
  series: ['#3987e5', '#d95926', '#199e70'],
}

const axisProps = {
  tick: { fill: CHART.axis, fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const

interface TipPayload { name?: string; value?: number | string; color?: string; dataKey?: string | number }

function Tip({ active, payload, label, unit = '', names }: { active?: boolean; payload?: TipPayload[]; label?: string | number; unit?: string; names?: Record<string, string> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong min-w-[140px] px-3 py-2 text-xs">
      <div className="mb-1 text-fg-3">{label}</div>
      {payload.map((p) => (
        <div key={String(p.dataKey)} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-fg-2">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {names?.[String(p.dataKey)] ?? p.name}
          </span>
          <span className="num font-medium text-fg">{p.value}{unit}</span>
        </div>
      ))}
    </div>
  )
}

export function LegendRow({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <span key={i.label} className="inline-flex items-center gap-2 text-xs text-fg-2">
          <span className={clsx('h-0.5 w-4 rounded', i.dashed && 'border-t-2 border-dashed bg-transparent')} style={i.dashed ? { borderColor: i.color } : { background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

/** Нагрузка по часам: сегодня (площадь) и среднее прошлой недели (пунктир). */
export function HourlyLoadChart({ data, height = 220 }: { data: { hour: string; today: number; avg: number }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="load-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={CHART.accent} stopOpacity={0.35} />
            <stop offset="1" stopColor={CHART.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis dataKey="hour" {...axisProps} interval={1} />
        <YAxis {...axisProps} allowDecimals={false} width={36} />
        <Tooltip content={<Tip names={{ today: 'Сегодня', avg: 'Среднее' }} unit=" чел." />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
        <ReferenceArea x1="16:00" x2="18:00" fill={CHART.accent} fillOpacity={0.05} />
        <Area type="monotone" dataKey="avg" stroke={CHART.muted} strokeWidth={2} strokeDasharray="4 4" fill="none" dot={false} isAnimationActive animationDuration={900} />
        <Area type="monotone" dataKey="today" stroke={CHART.accent} strokeWidth={2} fill="url(#load-fill)" dot={false} activeDot={{ r: 5, stroke: '#0b1119', strokeWidth: 2 }} animationDuration={1100} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Загрузка помещений — горизонтальные полосы. */
export function RoomLoadBars({ data }: { data: { room: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value))
  return (
    <ul className="space-y-3">
      {data.map((d, i) => (
        <li key={d.room}>
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="text-fg-2">{d.room}</span>
            <span className="num font-medium text-fg">{d.value}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: d.value === max ? CHART.accent : '#3987e5' }}
              initial={{ width: 0 }}
              animate={{ width: `${d.value}%` }}
              transition={{ duration: 0.9, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function TemperatureChart({ data }: { data: { hour: string; k14: number; k3: number; xray: number }[] }) {
  const names = { k14: 'Кабинет 14', k3: 'Малая операционная', xray: 'Рентген' }
  return (
    <>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="hour" {...axisProps} interval={2} />
          <YAxis {...axisProps} domain={[21, 24.5]} ticks={[21, 22, 23, 24]} width={36} tickFormatter={(v: number) => `${v}°`} />
          <ReferenceArea y1={21.5} y2={22.5} fill="#22b35e" fillOpacity={0.06} />
          <Tooltip content={<Tip names={names} unit="°" />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
          <Line type="monotone" dataKey="k14" stroke={CHART.series[0]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={900} />
          <Line type="monotone" dataKey="k3" stroke={CHART.series[1]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={1100} />
          <Line type="monotone" dataKey="xray" stroke={CHART.series[2]} strokeWidth={2} dot={false} activeDot={{ r: 4 }} animationDuration={1300} />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <LegendRow items={[{ label: names.k14, color: CHART.series[0] }, { label: names.k3, color: CHART.series[1] }, { label: names.xray, color: CHART.series[2] }]} />
        <span className="inline-flex items-center gap-2 text-xs text-fg-3"><span className="h-2.5 w-4 rounded-sm bg-ok/20" />норма 21.5–22.5°</span>
      </div>
    </>
  )
}

export function SimpleBars({
  data, dataKey, xKey, unit = '', color = CHART.accent, height = 200, highlightLast, warnAbove,
}: {
  data: Record<string, string | number>[]; dataKey: string; xKey: string; unit?: string; color?: string; height?: number; highlightLast?: boolean; warnAbove?: number
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis dataKey={xKey} {...axisProps} interval="preserveStartEnd" />
        <YAxis {...axisProps} allowDecimals={false} width={36} />
        <Tooltip content={<Tip unit={unit} names={{ [dataKey]: 'Значение' }} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]} animationDuration={900}>
          {data.map((d, i) => {
            const v = Number(d[dataKey])
            const c = warnAbove !== undefined && v > warnAbove ? '#f5b020' : highlightLast && i === data.length - 1 ? CHART.accent : color
            return <Cell key={i} fill={c} fillOpacity={highlightLast && i !== data.length - 1 && warnAbove === undefined ? 0.55 : 1} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function WeekCompareChart({ data }: { data: { day: string; thisWeek: number; lastWeek: number }[] }) {
  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="24%">
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="day" {...axisProps} />
          <YAxis {...axisProps} width={36} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip content={<Tip unit="%" names={{ thisWeek: 'Эта неделя', lastWeek: 'Прошлая' }} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Bar dataKey="lastWeek" fill={CHART.muted} radius={[4, 4, 0, 0]} animationDuration={800} />
          <Bar dataKey="thisWeek" fill={CHART.accent} radius={[4, 4, 0, 0]} animationDuration={1000} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3"><LegendRow items={[{ label: 'Эта неделя', color: CHART.accent }, { label: 'Прошлая неделя', color: CHART.muted }]} /></div>
    </>
  )
}

// Последовательная шкала (один оттенок, светлее = больше) для тёмной поверхности
const SEQ = ['#13202f', '#184f95', '#1c5cab', '#256abf', '#3987e5', '#5598e7', '#86b6ef']
const seqColor = (v: number) => SEQ[Math.min(SEQ.length - 1, Math.round(v * (SEQ.length - 1)))]

export function ActivityHeatmap({ rows, hours }: { rows: { room: string; values: number[] }[]; hours: string[] }) {
  const [tip, setTip] = useState<{ room: string; hour: string; v: number } | null>(null)
  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: `150px repeat(${hours.length}, minmax(0,1fr))` }}>
            <div />
            {hours.map((h) => (
              <div key={h} className="num pb-1 text-center text-[10px] text-fg-3">{h}</div>
            ))}
            {rows.map((r, ri) => (
              <div key={r.room} className="contents">
                <div className="truncate pr-2 text-xs leading-7 text-fg-2">{r.room}</div>
                {r.values.map((v, i) => (
                  <motion.button
                    type="button"
                    key={i}
                    aria-label={`${r.room}, ${hours[i]}:00 — ${Math.round(v * 100)}%`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: ri * 0.04 + i * 0.012, duration: 0.3 }}
                    onMouseEnter={() => setTip({ room: r.room, hour: hours[i], v })}
                    onFocus={() => setTip({ room: r.room, hour: hours[i], v })}
                    onMouseLeave={() => setTip(null)}
                    className="h-7 rounded-[5px] outline-none ring-white/40 transition hover:ring-2 focus-visible:ring-2"
                    style={{ background: seqColor(v) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-fg-3">
        <span className="num h-4">{tip ? `${tip.room} · ${tip.hour}:00 — активность ${Math.round(tip.v * 100)}%` : 'Наведите на ячейку'}</span>
        <span className="flex items-center gap-2">
          низкая
          <span className="flex">{SEQ.map((c) => <span key={c} className="h-2.5 w-4 first:rounded-l last:rounded-r" style={{ background: c }} />)}</span>
          высокая
        </span>
      </div>
    </div>
  )
}
