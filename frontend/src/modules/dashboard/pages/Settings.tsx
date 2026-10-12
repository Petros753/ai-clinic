import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Bell, Cctv, Cpu, Mail, Plug, Send, Siren, SlidersHorizontal, Thermometer } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, CardHeader, PageHeader } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { useData } from '../context/DataContext'

function Switch({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-white/10')}
    >
      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 34 }} className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow', checked ? 'right-0.5' : 'left-0.5')} />
    </button>
  )
}

const INTEGRATIONS: { icon: LucideIcon; name: string; desc: string; status: string }[] = [
  { icon: Cpu, name: 'Умный дом', desc: 'Заводская панель: свет, климат, шторы, сценарии', status: 'подключено' },
  { icon: Cctv, name: 'Видеонаблюдение', desc: 'Видеорегистратор, 10 камер, AI-детекция', status: 'подключено' },
  { icon: Thermometer, name: 'Датчики', desc: 'Температура, влажность, CO₂, присутствие', status: '48 устройств' },
  { icon: Send, name: 'Telegram-бот', desc: 'Уведомления и отчёты директору', status: 'подключено' },
  { icon: Mail, name: 'Email', desc: 'Еженедельные и ежемесячные отчёты', status: 'подключено' },
]

export function SettingsPage() {
  const { alarm, setAlarm } = useData()
  const toast = useToast()
  const [notif, setNotif] = useState({ alarmTg: true, alarmPush: true, warnTg: true, aiTg: false, nightMotion: true })
  const [thr, setThr] = useState({ temp: 1.5, co2: 1000, crowd: 6 })

  return (
    <div>
      <PageHeader title="Настройки" sub="Интеграции, уведомления и пороги срабатывания" />
      <div className="grid gap-5 xl:grid-cols-2">
        <Card i={0} className="p-5">
          <CardHeader title="Интеграции" icon={Plug} sub="Данные поступают через backend клиники" />
          <ul className="mt-4 space-y-2">
            {INTEGRATIONS.map((x) => (
              <li key={x.name} className="flex items-center gap-3 rounded-xl border border-line bg-white/[0.02] p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-fg-2"><x.icon size={17} /></span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{x.name}</div>
                  <div className="truncate text-xs text-fg-3">{x.desc}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-ok"><span className="h-1.5 w-1.5 rounded-full bg-ok" />{x.status}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card i={1} className="p-5">
          <CardHeader title="Уведомления" icon={Bell} sub="Что и куда отправлять директору" />
          <ul className="mt-4 divide-y divide-line">
            {([
              ['alarmTg', 'Тревоги в Telegram', 'мгновенно, круглосуточно'],
              ['alarmPush', 'Тревоги на экране', 'баннер и звук в панели'],
              ['warnTg', 'Предупреждения в Telegram', 'климат, оборудование, связь'],
              ['aiTg', 'AI-рекомендации в Telegram', 'раз в день, вместе с отчётом'],
              ['nightMotion', 'Движение после закрытия', 'с 21:00 до 08:00'],
            ] as const).map(([k, l, d]) => (
              <li key={k} className="flex items-center justify-between gap-4 py-3">
                <label htmlFor={`sw-${k}`} className="cursor-pointer">
                  <div className="text-sm">{l}</div>
                  <div className="text-xs text-fg-3">{d}</div>
                </label>
                <Switch id={`sw-${k}`} label={l} checked={notif[k]} onChange={(v) => setNotif((s) => ({ ...s, [k]: v }))} />
              </li>
            ))}
          </ul>
        </Card>

        <Card i={2} className="p-5">
          <CardHeader title="Пороги срабатывания" icon={SlidersHorizontal} sub="Когда AI считает ситуацию отклонением" />
          <div className="mt-5 space-y-6">
            {([
              ['temp', 'Отклонение температуры', 0.5, 3, 0.5, '°C'],
              ['co2', 'Уровень CO₂', 700, 1400, 50, ' ppm'],
              ['crowd', 'Людей в зоне ожидания', 3, 12, 1, ' чел.'],
            ] as const).map(([k, l, min, max, step, u]) => (
              <div key={k}>
                <div className="mb-2 flex justify-between text-sm">
                  <label htmlFor={`thr-${k}`} className="text-fg-2">{l}</label>
                  <span className="num font-medium">{k === 'temp' ? `±${thr[k]}` : thr[k]}{u}</span>
                </div>
                <input id={`thr-${k}`} type="range" min={min} max={max} step={step} value={thr[k]} onChange={(e) => setThr((s) => ({ ...s, [k]: Number(e.target.value) }))} className="w-full accent-[#5cc8ff]" />
              </div>
            ))}
            <Button variant="primary" onClick={() => toast('Пороги сохранены')}>Сохранить</Button>
          </div>
        </Card>

        <Card i={3} className="p-5">
          <CardHeader title="Демо-режим" icon={Siren} sub="Для показа: как панель реагирует на тревогу" />
          <p className="mt-4 text-sm leading-relaxed text-fg-2">
            Смоделирует движение и открытую дверь в помещении хранения отходов. Помещение станет красным на плане, появится тревога в KPI, уведомлениях и журнале безопасности.
          </p>
          <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-white/[0.02] p-3">
            <label htmlFor="sw-alarm" className="text-sm">Смоделировать тревогу</label>
            <Switch id="sw-alarm" label="Смоделировать тревогу" checked={alarm} onChange={setAlarm} />
          </div>
        </Card>
      </div>
    </div>
  )
}
