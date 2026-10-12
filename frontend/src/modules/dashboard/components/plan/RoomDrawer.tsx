import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Blinds, Clock, Droplets, ExternalLink, Fan, Gauge, Lightbulb, Snowflake, Thermometer, Wind, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { co2Tone, tempTone } from '../../lib/status'
import type { Room } from '../../types'
import { Button, Meter, SeverityIcon, StatusPill } from '../ui'
import { useToast } from '../ui/Toast'

function DeviceTile({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: boolean | number | null }) {
  const absent = value === null
  const on = typeof value === 'number' ? true : !!value
  const text = absent ? 'нет в помещении' : typeof value === 'number' ? `закрыты на ${value}%` : on ? 'включено' : 'выключено'
  return (
    <div className={clsx('flex items-center gap-3 rounded-xl border p-3', absent ? 'border-line/50 opacity-50' : 'border-line bg-white/[0.02]')}>
      <span className={clsx('grid h-8 w-8 place-items-center rounded-lg', !absent && on ? 'bg-accent/10 text-accent' : 'bg-white/5 text-fg-3')}>
        <Icon size={16} strokeWidth={1.8} />
      </span>
      <div className="min-w-0 leading-tight">
        <div className="text-[13px] text-fg">{label}</div>
        <div className={clsx('text-xs', !absent && on ? 'text-accent' : 'text-fg-3')}>{text}</div>
      </div>
    </div>
  )
}

export function RoomDetail({ room }: { room: Room }) {
  const toast = useToast()
  const delta = room.temperature - room.targetTemperature
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="col-span-2 rounded-2xl border border-line bg-white/[0.02] p-4 sm:col-span-1">
          <div className="label flex items-center gap-1.5"><Thermometer size={12} /> Температура</div>
          <div className={clsx('num mt-1 text-3xl font-semibold', tempTone(room.temperature, room.targetTemperature))}>{room.temperature.toFixed(1)}°</div>
          <div className="text-xs text-fg-3">заданная {room.targetTemperature}° · {delta >= 0 ? '+' : ''}{delta.toFixed(1)}°</div>
        </div>
        <div className="rounded-2xl border border-line bg-white/[0.02] p-4">
          <div className="label flex items-center gap-1.5"><Droplets size={12} /> Влажность</div>
          <div className="num mt-1 text-2xl font-semibold">{room.humidity}%</div>
          <div className="text-xs text-fg-3">норма 40–60%</div>
        </div>
        <div className="rounded-2xl border border-line bg-white/[0.02] p-4">
          <div className="label flex items-center gap-1.5"><Wind size={12} /> CO₂</div>
          <div className={clsx('num mt-1 text-2xl font-semibold', co2Tone(room.co2))}>{room.co2 ?? '—'}</div>
          <div className="text-xs text-fg-3">{room.co2 ? 'ppm' : 'нет датчика'}</div>
        </div>
      </div>

      <div>
        <div className="label mb-2">Активность</div>
        <div className="rounded-2xl border border-line bg-white/[0.02] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[15px] font-medium text-fg">{room.activity}</div>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-3"><Clock size={12} /> последняя активность: {room.lastActivity}</div>
            </div>
            <span className={clsx('rounded-full px-2.5 py-1 text-xs font-medium', room.occupied ? 'bg-accent/10 text-accent' : 'bg-white/5 text-fg-2')}>
              {room.occupied ? 'Занят' : 'Свободен'}
            </span>
          </div>
          {room.workplace && (
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs"><span className="text-fg-3">Использование сегодня · {room.usageToday}</span><span className="num text-fg">{room.loadPercent}%</span></div>
              <Meter value={room.loadPercent} />
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="label mb-2">Инженерные системы</div>
        <div className="grid grid-cols-2 gap-2">
          <DeviceTile icon={Snowflake} label="Кондиционер" value={room.devices.ac} />
          <DeviceTile icon={Fan} label="Вытяжка" value={room.devices.vent} />
          <DeviceTile icon={Lightbulb} label="Освещение" value={room.devices.light} />
          <DeviceTile icon={Blinds} label="Шторы" value={room.devices.blinds} />
        </div>
      </div>

      {room.equipment.length > 0 && (
        <div>
          <div className="label mb-2">Оборудование</div>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white/[0.02]">
            {room.equipment.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="flex items-center gap-2 text-fg-2"><Gauge size={14} className="text-fg-3" />{e.name}</span>
                <span className={clsx('text-xs font-medium', e.online ? 'text-ok' : 'text-crit')}>{e.online ? 'online' : 'offline'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="label mb-2">События</div>
        {room.events.length ? (
          <ul className="space-y-2">
            {room.events.map((e, i) => (
              <li key={i} className="flex items-start gap-3">
                <SeverityIcon severity={e.severity} size={13} />
                <div className="text-sm leading-snug">
                  <span className="num mr-2 font-mono text-xs text-fg-3">{e.time}</span>
                  <span className="text-fg-2">{e.text}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-fg-3">Событий за сегодня нет</p>
        )}
      </div>

      <Button
        variant="ghost"
        icon={ExternalLink}
        className="w-full py-3"
        onClick={() => toast('Управление откроется в системе умного дома после интеграции')}
      >
        Открыть управление
      </Button>
      <p className="-mt-3 text-center text-[11px] text-fg-3">Свет, климат и шторы управляются в панели умного дома</p>
    </div>
  )
}

export function RoomDrawer({ room, onClose }: { room: Room | null; onClose: () => void }) {
  useEffect(() => {
    if (!room) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [room, onClose])

  return (
    <AnimatePresence>
      {room && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-ink-950/60 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-label={room.name}
            className="glass-strong fixed bottom-0 right-0 top-0 z-[61] flex w-full max-w-[460px] flex-col rounded-none border-y-0 border-r-0 sm:bottom-3 sm:right-3 sm:top-3 sm:rounded-3xl sm:border"
            initial={{ x: '105%' }}
            animate={{ x: 0 }}
            exit={{ x: '105%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line p-5">
              <div>
                <div className="label">Помещение {room.id}</div>
                <h2 className="mt-1 text-xl font-semibold">{room.name}</h2>
                <div className="mt-2"><StatusPill status={room.status} /></div>
              </div>
              <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-fg-2 hover:bg-white/5 hover:text-fg" aria-label="Закрыть">
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <RoomDetail room={room} />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
