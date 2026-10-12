import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Cctv, Users } from 'lucide-react'
import { useState } from 'react'
import { CameraFeed } from '../components/cameras/CameraFeed'
import { Card, CardHeader, PageHeader, Segmented } from '../components/ui'
import { useData } from '../context/DataContext'

type Zone = 'all' | 'Холл ожидания' | 'Клиническая зона' | 'Служебная зона' | 'Улица'

export function CamerasPage() {
  const { cameras, alarm } = useData()
  const [zone, setZone] = useState<Zone>('all')
  const [mainId, setMainId] = useState(alarm ? 9 : 2)
  const list = cameras.map((c) => (alarm && c.id === 9 ? { ...c, people: 1, motion: true, lastEvent: 'сейчас · тревога' } : c))
  const shown = zone === 'all' ? list : list.filter((c) => c.zone === zone)
  const main = list.find((c) => c.id === mainId) ?? list[0]
  const people = list.reduce((s, c) => s + (c.outdoor ? 0 : c.people), 0)

  return (
    <div>
      <PageHeader
        title="Камеры"
        sub={`${cameras.filter((c) => c.online).length} из ${cameras.length} камер online · запись 30 дней на видеорегистраторе`}
        right={
          <Segmented<Zone>
            value={zone}
            onChange={setZone}
            options={[
              { value: 'all', label: 'Все' },
              { value: 'Холл ожидания', label: 'Холл' },
              { value: 'Клиническая зона', label: 'Клиника' },
              { value: 'Служебная зона', label: 'Служебные' },
              { value: 'Улица', label: 'Улица' },
            ]}
          />
        }
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <Card i={0} className="p-4 xl:col-span-2">
          <motion.div key={main.id} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
            <CameraFeed camera={main} className="rounded-2xl" />
          </motion.div>
        </Card>
        <Card i={1} className="p-5">
          <CardHeader title={main.name} icon={Cctv} sub={`CAM ${String(main.id).padStart(2, '0')} · ${main.zone}`} />
          <dl className="mt-4 space-y-3 text-sm">
            {[
              ['Статус', main.online ? 'online' : 'offline'],
              ['Людей в кадре', String(main.people)],
              ['Движение', main.motion ? 'есть' : 'нет'],
              ['Последнее событие', main.lastEvent],
              ['Размещение', main.outdoor ? 'уличная' : 'внутренняя'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-line pb-2.5">
                <dt className="text-fg-3">{k}</dt>
                <dd className={clsx('text-right', k === 'Статус' ? 'text-ok' : 'text-fg')}>{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-5 rounded-2xl border border-ai/25 bg-ai/[0.06] p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-ai"><Users size={15} />Сейчас в клинике</div>
            <div className="num mt-1 text-3xl font-semibold">{people} <span className="text-base font-normal text-fg-3">чел. в кадре</span></div>
            <p className="mt-1 text-xs text-fg-2">Подсчёт по камерам холла и ресепшн. Лица не распознаются.</p>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {shown.map((c, i) => (
          <motion.button
            key={c.id}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => setMainId(c.id)}
            className={clsx('rounded-2xl p-1 text-left ring-2 transition', c.id === main.id ? 'ring-accent/70' : 'ring-transparent hover:ring-white/15', alarm && c.id === 9 && 'ring-crit/70')}
          >
            <CameraFeed camera={c} />
          </motion.button>
        ))}
      </div>
    </div>
  )
}
