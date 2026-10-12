import clsx from 'clsx'
import { motion } from 'framer-motion'
import { useState } from 'react'
import planUrl from '../../assets/clinic-plan.webp'
import { ROOM_STATUS } from '../../lib/status'
import type { Room } from '../../types'

// Размер подложки плана (px изображения). Полигоны помещений задаются в этих координатах.
const W = 1447
const H = 1087

export type PlanLayer = 'temp' | 'co2' | 'humidity' | 'occupancy'

export const PLAN_LAYERS: { id: PlanLayer; label: string }[] = [
  { id: 'temp', label: 'Температура' },
  { id: 'co2', label: 'CO₂' },
  { id: 'humidity', label: 'Влажность' },
  { id: 'occupancy', label: 'Занятость' },
]

const TONE = { ok: '#22b35e', warn: '#f5b020', crit: '#e5484d', busy: '#5cc8ff', free: '#7f8da3' } as const

interface Reading { text: string; color: string }

/** Значение выбранного слоя для помещения; null — показывать нечего (нет датчика, служебное помещение в норме) */
function reading(r: Room, layer: PlanLayer): Reading | null {
  switch (layer) {
    case 'temp': {
      const d = Math.abs(r.temperature - r.targetTemperature)
      return { text: `${r.temperature.toFixed(1)}°`, color: d >= 3 ? TONE.crit : d >= 1.5 ? TONE.warn : TONE.ok }
    }
    case 'co2':
      if (r.co2 == null) return null
      return { text: String(r.co2), color: r.co2 >= 1000 ? TONE.crit : r.co2 >= 800 ? TONE.warn : TONE.ok }
    case 'humidity': {
      const h = r.humidity
      return { text: `${h}%`, color: h < 30 || h > 70 ? TONE.crit : h < 40 || h > 60 ? TONE.warn : TONE.ok }
    }
    case 'occupancy':
      if (!r.workplace) return null
      return r.occupied ? { text: 'занято', color: TONE.busy } : { text: 'свободно', color: TONE.free }
  }
}

const LEGEND: Record<PlanLayer, { color: string; label: string }[]> = {
  temp: [{ color: TONE.ok, label: 'Норма' }, { color: TONE.warn, label: 'Отклонение от заданной 1,5°+' }, { color: TONE.crit, label: '3°+' }],
  co2: [{ color: TONE.ok, label: 'До 800 ppm' }, { color: TONE.warn, label: '800–1000' }, { color: TONE.crit, label: 'Выше 1000' }],
  humidity: [{ color: TONE.ok, label: '40–60%' }, { color: TONE.warn, label: '30–40 / 60–70%' }, { color: TONE.crit, label: 'Вне 30–70%' }],
  occupancy: [{ color: TONE.busy, label: 'Идёт приём' }, { color: TONE.free, label: 'Свободно' }],
}

export function PlanLayerSwitch({ layer, onChange }: { layer: PlanLayer; onChange: (l: PlanLayer) => void }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-white/[0.02] p-0.5" role="tablist" aria-label="Слой плана">
      {PLAN_LAYERS.map((l) => (
        <button
          key={l.id}
          type="button"
          role="tab"
          aria-selected={layer === l.id}
          onClick={() => onChange(l.id)}
          className={clsx('rounded-[10px] px-3 py-1.5 text-xs font-medium transition-colors', layer === l.id ? 'bg-white/[0.08] text-fg' : 'text-fg-3 hover:text-fg-2')}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

export function PlanLegend({ className, layer = 'temp' }: { className?: string; layer?: PlanLayer }) {
  return (
    <div className={clsx('flex flex-wrap gap-x-4 gap-y-2', className)}>
      {LEGEND[layer].map((i) => (
        <span key={i.label} className="inline-flex items-center gap-2 text-xs text-fg-2">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
      <span className="inline-flex items-center gap-2 text-xs text-fg-2">
        <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: ROOM_STATUS.alarm.color }} />
        Тревога
      </span>
    </div>
  )
}

/** Компактный значок со значением слоя — без названия помещения */
function Badge({ room, value, emphasis }: { room: Room; value: Reading; emphasis: boolean }) {
  const alarm = room.status === 'alarm'
  const color = alarm ? ROOM_STATUS.alarm.color : value.color
  const w = value.text.length * 17 + 52
  const h = 46
  const [x, y] = room.labelAt
  return (
    <g transform={`translate(${Math.min(Math.max(x - w / 2, 8), W - w - 8)} ${y - h / 2})`} style={{ pointerEvents: 'none' }}>
      <rect width={w} height={h} rx={23} fill="#0b1119" fillOpacity={emphasis ? 0.95 : 0.86} stroke={color} strokeOpacity={emphasis ? 1 : 0.55} strokeWidth={2.5} />
      <circle cx={24} cy={23} r={7} fill={color} />
      <text x={40} y={24} dominantBaseline="middle" fontSize={27} fontWeight={700} fill="#e7edf4" style={{ fontVariantNumeric: 'tabular-nums' }}>{value.text}</text>
    </g>
  )
}

/** Название и состояние — только при наведении или выборе */
function RoomTag({ room }: { room: Room }) {
  const s = ROOM_STATUS[room.status]
  const name = room.shortName
  const sub = room.status === 'idle' ? s.label : `${room.temperature.toFixed(1)}° · ${room.status === 'active' ? (room.occupied ? 'занято' : 'активно') : s.label.toLowerCase()}`
  const w = Math.max(name.length * 16.5, sub.length * 12.5) + 56
  const h = 64
  const [x, y] = room.labelAt
  return (
    <g transform={`translate(${Math.min(Math.max(x - w / 2, 8), W - w - 8)} ${y - h / 2 - 38})`} style={{ pointerEvents: 'none' }}>
      <rect width={w} height={h} rx={16} fill="#0b1119" fillOpacity={0.96} stroke={s.color} strokeOpacity={0.9} strokeWidth={2} />
      <circle cx={22} cy={23} r={7} fill={s.color} />
      <text x={38} y={24} dominantBaseline="middle" fontSize={25} fontWeight={600} fill="#e7edf4">{name}</text>
      <text x={38} y={48} dominantBaseline="middle" fontSize={20} fill={s.color}>{sub}</text>
    </g>
  )
}

export function ClinicPlan({
  rooms, selected, onSelect, layer = 'temp',
}: { rooms: Room[]; selected: number | null; onSelect: (id: number) => void; layer?: PlanLayer }) {
  const [hover, setHover] = useState<number | null>(null)
  // Значок есть там, где есть что показать. Санузлы и шлюз — только когда что-то не так.
  const quiet = (r: Room) => r.kind === 'sanitary' || r.id === 2
  const badge = (r: Room) => {
    const v = reading(r, layer)
    if (!v) return null
    if (quiet(r) && r.status !== 'warning' && r.status !== 'alarm' && v.color === TONE.ok) return null
    return v
  }

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full min-w-[620px]" role="img" aria-label="План клиники">
        <image href={planUrl} x={0} y={0} width={W} height={H} preserveAspectRatio="xMidYMid meet" />

        {rooms.map((r) => {
          const s = ROOM_STATUS[r.status]
          const isSel = selected === r.id
          const isHover = hover === r.id
          const v = reading(r, layer)
          const color = r.status === 'alarm' ? s.color : v?.color ?? s.color
          const base = r.status === 'alarm' ? 0.38 : v ? (v.color === TONE.ok ? 0.07 : v.color === TONE.free ? 0.05 : 0.26) : 0.04
          return (
            <g
              key={r.id}
              role="button"
              tabIndex={0}
              aria-label={`${r.name}: ${s.label}`}
              onClick={() => onSelect(r.id)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(r.id))}
              onMouseEnter={() => setHover(r.id)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer outline-none"
            >
              <title>{`${r.name} — ${s.label}`}</title>
              <motion.polygon
                points={r.shape}
                initial={false}
                animate={{ fillOpacity: isSel ? base + 0.14 : isHover ? base + 0.1 : base, strokeOpacity: isSel || isHover ? 0.95 : 0 }}
                transition={{ duration: 0.2 }}
                fill={color}
                stroke={color}
                strokeWidth={4}
                strokeLinejoin="round"
                className={r.status === 'alarm' ? 'alarm-pulse' : ''}
                style={{ mixBlendMode: 'multiply' }}
              />
            </g>
          )
        })}

        {rooms.map((r) => {
          const v = badge(r)
          return v ? <Badge key={`b${r.id}`} room={r} value={v} emphasis={hover === r.id || selected === r.id} /> : null
        })}
        {rooms.filter((r) => hover === r.id || selected === r.id).map((r) => <RoomTag key={`t${r.id}`} room={r} />)}
      </svg>
    </div>
  )
}
