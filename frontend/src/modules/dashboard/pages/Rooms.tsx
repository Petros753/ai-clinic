import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Clock, Droplets, Fan, Lightbulb, Snowflake, Thermometer, Wind } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Card, Meter, PageHeader, Segmented, StatusPill } from '../components/ui'
import { useData } from '../context/DataContext'
import { useUi } from '../context/UiContext'
import { co2Tone, tempTone } from '../lib/status'
import type { Room } from '../types'

type Filter = 'work' | 'all' | 'active' | 'attention'

function DeviceChip({ icon: Icon, on, label }: { icon: LucideIcon; on: boolean | null; label: string }) {
  if (on === null) return null
  return (
    <span title={`${label}: ${on ? 'включено' : 'выключено'}`} className={clsx('inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px]', on ? 'bg-accent/10 text-accent' : 'bg-white/[0.04] text-fg-3')}>
      <Icon size={12} strokeWidth={2} />{label}
    </span>
  )
}

function RoomCard({ room, i, onOpen }: { room: Room; i: number; onOpen: () => void }) {
  const online = room.equipment.filter((e) => e.online).length
  return (
    <Card i={i} as="article" className={clsx('group relative flex flex-col p-4 transition-all hover:-translate-y-0.5 hover:border-white/15', room.status === 'alarm' && 'border-crit/40')}>
      <button type="button" onClick={onOpen} className="absolute inset-0 z-10 rounded-xl2" aria-label={`Открыть ${room.name}`} />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="label">Помещение {room.id}</div>
          <h3 className="mt-0.5 truncate text-[16px] font-semibold">{room.name}</h3>
        </div>
        <StatusPill status={room.status} label={room.status === 'active' ? (room.occupied ? 'Занят' : 'Активно') : undefined} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div>
          <div className="flex items-center gap-1 text-[11px] text-fg-3"><Thermometer size={11} />темп.</div>
          <div className={clsx('num text-lg font-semibold', tempTone(room.temperature, room.targetTemperature))}>{room.temperature.toFixed(1)}°</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[11px] text-fg-3"><Droplets size={11} />влажн.</div>
          <div className="num text-lg font-semibold">{room.humidity}%</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[11px] text-fg-3"><Wind size={11} />CO₂</div>
          <div className={clsx('num text-lg font-semibold', co2Tone(room.co2))}>{room.co2 ?? '—'}</div>
        </div>
      </div>

      <div className="mt-3 text-[13px] text-fg-2">{room.activity}</div>
      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-fg-3"><Clock size={11} />{room.lastActivity}</div>

      {room.workplace && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-[11px] text-fg-3"><span>Загрузка сегодня</span><span className="num text-fg-2">{room.loadPercent}%</span></div>
          <Meter value={room.loadPercent} />
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
        <DeviceChip icon={Snowflake} on={room.devices.ac} label="Конд." />
        <DeviceChip icon={Fan} on={room.devices.vent} label="Вытяжка" />
        <DeviceChip icon={Lightbulb} on={room.devices.light} label="Свет" />
        {room.equipment.length > 0 && (
          <span className={clsx('ml-auto text-[11px]', online === room.equipment.length ? 'text-ok' : 'text-crit')}>
            оборудование {online}/{room.equipment.length} online
          </span>
        )}
      </div>
    </Card>
  )
}

export function RoomsPage() {
  const { rooms } = useData()
  const { openRoom } = useUi()
  const [filter, setFilter] = useState<Filter>('work')

  const list = rooms.filter((r) =>
    filter === 'all' ? true : filter === 'work' ? r.workplace : filter === 'active' ? r.status === 'active' : r.status === 'warning' || r.status === 'alarm',
  )
  const count = (s: Room['status']) => rooms.filter((r) => r.status === s).length

  return (
    <div>
      <PageHeader
        title="Помещения"
        sub="Мониторинг состояния, климата и активности по каждому помещению"
        right={
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'work', label: 'Рабочие' },
              { value: 'active', label: 'Активные' },
              { value: 'attention', label: 'Требуют внимания' },
              { value: 'all', label: 'Все' },
            ]}
          />
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: 'Активны сейчас', v: count('active'), c: 'text-accent' },
          { l: 'В норме', v: count('ok'), c: 'text-ok' },
          { l: 'Предупреждения', v: count('warning'), c: 'text-warn' },
          { l: 'Тревоги', v: count('alarm'), c: 'text-crit' },
        ].map((x, i) => (
          <Card key={x.l} i={i} as="div" className="p-4">
            <div className="text-xs text-fg-3">{x.l}</div>
            <div className={clsx('num mt-1 text-2xl font-semibold', x.v ? x.c : 'text-fg')}>{x.v}</div>
          </Card>
        ))}
      </div>

      <motion.div layout className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {list.map((r, i) => <RoomCard key={r.id} room={r} i={i} onOpen={() => openRoom(r.id)} />)}
      </motion.div>
      {!list.length && <p className="py-16 text-center text-sm text-fg-3">Нет помещений, требующих внимания</p>}
    </div>
  )
}
