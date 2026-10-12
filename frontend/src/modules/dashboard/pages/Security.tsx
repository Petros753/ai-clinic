import clsx from 'clsx'
import { motion } from 'framer-motion'
import { DoorClosed, Footprints, Lock, ScanEye, ShieldCheck, Siren, Sparkles, Wifi, WifiOff } from 'lucide-react'
import { CameraFeed } from '../components/cameras/CameraFeed'
import { Button, Card, CardHeader, PageHeader, SeverityIcon } from '../components/ui'
import { useData } from '../context/DataContext'
import { useUi } from '../context/UiContext'
import { SEVERITY } from '../lib/status'

const DOORS = [
  { name: 'Главный вход', state: 'закрыта', note: 'рабочий режим' },
  { name: 'Служебный вход', state: 'закрыта', note: 'последнее открытие 08:28' },
  { name: 'Тех. помещение', state: 'закрыта', note: 'по ключ-карте' },
  { name: 'Хранение отходов', state: 'закрыта', note: 'последнее открытие 15:20' },
]

export function SecurityPage() {
  const { cameras, securityEvents, insights, alarm, setAlarm } = useData()
  const { navigate } = useUi()
  const online = cameras.filter((c) => c.online).length
  const offline = cameras.length - online

  const stats = [
    { icon: Wifi, label: 'Камеры online', value: `${online}/${cameras.length}`, tone: 'text-ok' },
    { icon: WifiOff, label: 'Камеры offline', value: String(offline), tone: offline ? 'text-crit' : 'text-fg' },
    { icon: Footprints, label: 'Движение после закрытия', value: '1', tone: 'text-warn', note: 'вчера 21:42 · уборка' },
    { icon: DoorClosed, label: 'Открытые двери', value: alarm ? '1' : '0', tone: alarm ? 'text-crit' : 'text-fg' },
    { icon: Siren, label: 'Тревоги', value: alarm ? '1' : '0', tone: alarm ? 'text-crit' : 'text-fg' },
  ]

  return (
    <div>
      <PageHeader
        title="Безопасность"
        sub="Охрана, двери, видеонаблюдение и технические тревоги"
        right={
          <Button variant={alarm ? 'primary' : 'ghost'} icon={alarm ? ShieldCheck : Siren} onClick={() => setAlarm(!alarm)}>
            {alarm ? 'Подтвердить и сбросить тревогу' : 'Демо: смоделировать тревогу'}
          </Button>
        }
      />

      {alarm && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-5 flex flex-wrap items-center gap-4 rounded-2xl border border-crit/40 bg-crit/10 p-4">
          <span className="alarm-pulse grid h-10 w-10 place-items-center rounded-xl bg-crit text-white"><Siren size={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-crit">Тревога: движение в помещении хранения отходов</div>
            <div className="text-sm text-fg-2">Дверь открыта без авторизации. Камера 9 ведёт запись, охранная служба уведомлена.</div>
          </div>
          <Button onClick={() => navigate('cameras')}>Открыть камеру 9</Button>
        </motion.div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s, i) => (
          <Card key={s.label} i={i} as="div" className="p-4">
            <div className="flex items-center gap-2 text-xs text-fg-3"><s.icon size={14} />{s.label}</div>
            <div className={clsx('num mt-1.5 text-2xl font-semibold', s.tone)}>{s.value}</div>
            {s.note && <div className="mt-0.5 text-[11px] text-fg-3">{s.note}</div>}
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card i={2} className="p-5 xl:col-span-2">
          <CardHeader title="Журнал событий" icon={ShieldCheck} sub="Охранная система, двери, камеры, AI-детекция" />
          <div className="mt-4 space-y-6">
            {securityEvents.map((g) => (
              <div key={g.day}>
                <div className="label mb-3">{g.day}</div>
                <ol className="relative space-y-1 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-line">
                  {g.items.map((e, i) => (
                    <motion.li
                      key={e.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={clsx('relative flex items-start gap-3 rounded-xl p-2 pr-3', e.severity === 'alarm' && 'bg-crit/[0.07]')}
                    >
                      <span className="relative z-10 rounded-lg bg-ink-900"><SeverityIcon severity={e.severity} size={14} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3">
                          <span className="num font-mono text-sm text-fg">{e.time}</span>
                          <span className={clsx('text-sm', e.severity === 'alarm' ? 'font-medium text-crit' : 'text-fg')}>{e.text}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-fg-3">{e.source} · <span className={SEVERITY[e.severity].text}>{SEVERITY[e.severity].label}</span></div>
                      </div>
                    </motion.li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card i={3} className="p-5">
            <CardHeader title="Режим охраны" icon={Lock} />
            <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-white/[0.02] p-3">
              <div>
                <div className="text-sm font-medium">Дневной режим</div>
                <div className="text-xs text-fg-3">Снята с охраны в 08:30 · постановка по расписанию в 21:00</div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-ok shadow-[0_0_10px_#22b35e]" />
            </div>
            <ul className="mt-3 divide-y divide-line">
              {DOORS.map((d) => {
                const open = alarm && d.name === 'Хранение отходов'
                return (
                  <li key={d.name} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <div className="text-fg">{d.name}</div>
                      <div className="text-xs text-fg-3">{open ? 'открыта без авторизации' : d.note}</div>
                    </div>
                    <span className={clsx('text-xs font-medium', open ? 'alarm-pulse text-crit' : 'text-ok')}>{open ? 'открыта' : d.state}</span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card i={4} className="p-5">
            <CardHeader title="Камера 9 · Хранение отходов" icon={ScanEye} sub={alarm ? 'идёт запись тревоги' : 'в реальном времени'} />
            <div className="mt-4"><CameraFeed camera={{ ...cameras[8], people: alarm ? 1 : 0 }} /></div>
          </Card>
        </div>
      </div>

      <Card i={5} className="mt-5 p-5">
        <CardHeader title="AI-аналитика по камерам" icon={Sparkles} sub="Детекция людей, очередей и оставленных предметов. Распознавание лиц не используется." />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {insights.map((x, i) => (
            <motion.div key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className={clsx('rounded-2xl border p-4', x.severity === 'ai' ? 'border-ai/25 bg-ai/[0.06]' : 'border-line bg-white/[0.02]')}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{x.title}</span>
                {x.metric && <span className={clsx('num text-lg font-semibold', x.severity === 'ai' ? 'text-ai' : 'text-fg')}>{x.metric}</span>}
              </div>
              <p className="mt-2 text-[13px] leading-snug text-fg-2">{x.text}</p>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  )
}
