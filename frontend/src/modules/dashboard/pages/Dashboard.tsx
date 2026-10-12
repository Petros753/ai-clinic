import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, Cctv, ChevronDown, DoorOpen, FileText, ListChecks, Map, Siren, Sparkles, Thermometer, Waves,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { AiAvatar, TypingText } from '../components/ai/AssistantChat'
import { HourlyLoadChart, LegendRow, CHART } from '../components/charts'
import { NotificationList } from '../components/notifications/NotificationCenter'
import { ClinicPlan, PlanLayerSwitch, PlanLegend } from '../components/plan/ClinicPlan'
import type { PlanLayer } from '../components/plan/ClinicPlan'
import { Button, Card, CardHeader, Sparkline, StatusDot } from '../components/ui'
import { useData } from '../context/DataContext'
import { useUi } from '../context/UiContext'
import { aiDailyDetails, aiDailySummary, hourlyLoad, kpiTrends, todayTimeline } from '../data/mock'
import { useClock } from '../hooks/useClock'
import { SEVERITY } from '../lib/status'

type Tone = 'accent' | 'ok' | 'warn' | 'crit'
const TONE: Record<Tone, { text: string; icon: string; color: string }> = {
  accent: { text: 'text-accent', icon: 'bg-accent/10 text-accent', color: '#5cc8ff' },
  ok: { text: 'text-ok', icon: 'bg-ok/10 text-ok', color: '#22b35e' },
  warn: { text: 'text-warn', icon: 'bg-warn/10 text-warn', color: '#f5b020' },
  crit: { text: 'text-crit', icon: 'bg-crit/10 text-crit', color: '#e5484d' },
}

function KpiCard({
  i, icon: Icon, label, value, unit, sub, tone, trend, onClick, pulse,
}: { i: number; icon: LucideIcon; label: string; value: string; unit?: string; sub: string; tone: Tone; trend?: number[]; onClick?: () => void; pulse?: boolean }) {
  const t = TONE[tone]
  return (
    <Card i={i} as="div" className={clsx('group relative overflow-hidden p-4 transition-colors hover:border-white/15', pulse && 'border-crit/40 bg-crit/[0.06]')}>
      <button type="button" onClick={onClick} className="absolute inset-0 z-10" aria-label={label} />
      {pulse && <span className="alarm-pulse pointer-events-none absolute inset-0 rounded-xl2 ring-1 ring-inset ring-crit/50" />}
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-fg-2">{label}</span>
        <span className={clsx('grid h-7 w-7 place-items-center rounded-lg', t.icon)}><Icon size={15} strokeWidth={1.9} /></span>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <motion.span key={value} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="num text-[28px] font-semibold leading-none tracking-tight text-fg">
          {value}
        </motion.span>
        {unit && <span className="text-sm text-fg-3">{unit}</span>}
      </div>
      <div className={clsx('mt-1.5 text-xs', tone === 'ok' || tone === 'accent' ? 'text-fg-3' : t.text)}>{sub}</div>
      <div className="mt-2 h-[34px]">{trend ? <Sparkline data={trend} color={t.color} /> : <div className="flex h-full items-end gap-1">{Array.from({ length: 10 }).map((_, k) => <span key={k} className="h-1.5 flex-1 rounded-full" style={{ background: t.color, opacity: 0.25 + (k / 10) * 0.6 }} />)}</div>}</div>
    </Card>
  )
}

function greeting(h: number) {
  if (h < 6) return 'Доброй ночи'
  if (h < 12) return 'Доброе утро'
  if (h < 18) return 'Добрый день'
  return 'Добрый вечер'
}

export function DashboardPage() {
  const { rooms, cameras, notifications, alarm, alarmsCount, overview } = useData()
  const { navigate, openRoom, openAssistant } = useUi()
  const now = useClock(60_000)
  const [details, setDetails] = useState(false)
  const [selected, setSelected] = useState<number | null>(null)
  const [planLayer, setPlanLayer] = useState<PlanLayer>('temp')

  const work = rooms.filter((r) => r.workplace)
  const active = work.filter((r) => r.status === 'active').length
  const online = cameras.filter((c) => c.online).length
  const warnings = rooms.filter((r) => r.status === 'warning').length
  const attention = notifications.filter((n) => n.severity !== 'info').slice(0, 4)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.01em]">{greeting(now.getHours())}, {overview.director.name}</h1>
          <p className="mt-1 text-sm text-fg-2">
            {alarm ? (
              <span className="text-crit">Внимание: активная тревога в помещении хранения отходов.</span>
            ) : (
              <>Клиника работает штатно · активно {active} из {work.length} помещений · тревог нет</>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button icon={FileText} onClick={() => navigate('reports')}>Отчёт за день</Button>
          <Button variant="ai" icon={Sparkles} onClick={openAssistant}>Спросить AI</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <KpiCard i={0} icon={DoorOpen} label="Активные кабинеты" value={`${active}`} unit={`/ ${work.length}`} sub="по датчикам присутствия" tone="accent" trend={kpiTrends.activeRooms} onClick={() => navigate('rooms')} />
        <KpiCard i={1} icon={Cctv} label="Камеры" value={`${online}`} unit={`/ ${cameras.length} online`} sub="перебоев сегодня нет" tone="ok" onClick={() => navigate('cameras')} />
        <KpiCard i={2} icon={Waves} label="Климат" value="Норма" sub={warnings ? `${warnings} отклонение · операционная` : 'во всех помещениях'} tone={warnings ? 'warn' : 'ok'} onClick={() => navigate('analytics')} />
        <KpiCard i={3} icon={Siren} label="Тревоги" value={String(alarmsCount)} sub={alarm ? 'хранение отходов · сейчас' : 'за сегодня и ночь'} tone={alarm ? 'crit' : 'ok'} pulse={alarm} onClick={() => navigate('security')} />
        <KpiCard i={4} icon={ListChecks} label="События за сегодня" value={String(12 + alarmsCount)} sub={`${attention.length} требуют внимания`} tone="accent" trend={kpiTrends.events} onClick={() => navigate('security')} />
        <KpiCard i={5} icon={Thermometer} label="Средняя температура" value="22.4" unit="°C" sub="заданная 22.0°C" tone="accent" trend={kpiTrends.temperature} onClick={() => navigate('analytics')} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* AI-сводка */}
        <Card i={2} className="relative overflow-hidden p-5 xl:col-span-2">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-ai/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AiAvatar size={36} />
                <div>
                  <h2 className="text-[17px] font-semibold"><span className="ai-shimmer">AI-сводка</span> за сегодня</h2>
                  <p className="text-xs text-fg-3">Обновлено в 18:30 · на основе 48 датчиков, 10 камер и журнала событий</p>
                </div>
              </div>
              {alarm ? (
                <span className="alarm-pulse rounded-full border border-crit/40 bg-crit/15 px-2.5 py-1 text-xs font-medium text-crit">Активная тревога</span>
              ) : (
                <span className="rounded-full border border-ok/25 bg-ok/10 px-2.5 py-1 text-xs font-medium text-ok">Штатный режим</span>
              )}
            </div>

            {alarm && (
              <button type="button" onClick={() => navigate('security')} className="mt-4 flex w-full items-center gap-3 rounded-xl border border-crit/35 bg-crit/10 p-3 text-left text-sm text-fg hover:bg-crit/15">
                <Siren size={16} className="shrink-0 text-crit" />
                <span><b className="font-semibold text-crit">Сейчас:</b> движение в помещении хранения отходов, дверь открыта без авторизации. Камера 9 ведёт запись.</span>
              </button>
            )}
            <TypingText text={aiDailySummary} speed={16} className="mt-4 max-w-[70ch] text-[15px] leading-relaxed text-fg" />

            <AnimatePresence initial={false}>
              {details && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {aiDailyDetails.map((d) => (
                      <li key={d} className="flex gap-2.5 rounded-xl border border-line bg-white/[0.02] p-3 text-[13px] leading-snug text-fg-2">
                        <Sparkles size={14} className="mt-0.5 shrink-0 text-ai" />{d}
                      </li>
                    ))}
                  </div>
                </motion.ul>
              )}
            </AnimatePresence>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => setDetails((v) => !v)}>
                {details ? 'Свернуть' : 'Показать подробнее'}
                <ChevronDown size={15} className={clsx('transition-transform', details && 'rotate-180')} />
              </Button>
              <Button variant="subtle" icon={Sparkles} onClick={openAssistant}>Задать уточняющий вопрос</Button>
            </div>
          </div>
        </Card>

        {/* Требует внимания */}
        <Card i={3} className="p-5">
          <CardHeader
            title="Требует внимания"
            icon={Activity}
            sub={`${attention.length} активных пункта`}
            right={<button type="button" className="text-xs text-accent hover:underline" onClick={() => navigate('security')}>Все события</button>}
          />
          <div className="mt-3"><NotificationList items={attention} compact /></div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* План */}
        <Card i={4} className="p-5 xl:col-span-2">
          <CardHeader title="План клиники" icon={Map} sub="Нажмите на помещение, чтобы открыть карточку" right={<span className="hidden text-xs text-fg-3 sm:block">99 м² · 14 помещений</span>} />
          <div className="mt-3"><PlanLayerSwitch layer={planLayer} onChange={setPlanLayer} /></div>
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#f4f6f8] p-2 sm:p-3">
            <ClinicPlan layer={planLayer} rooms={rooms} selected={selected} onSelect={(id) => { setSelected(id); openRoom(id) }} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <PlanLegend layer={planLayer} />
            <div className="flex flex-wrap gap-1.5">
              {work.filter((r) => r.status !== 'ok').map((r) => (
                <button key={r.id} type="button" onClick={() => openRoom(r.id)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-xs text-fg-2 hover:border-white/20 hover:text-fg">
                  <StatusDot status={r.status} />{r.shortName}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Активность */}
        <Card i={5} className="flex flex-col p-5">
          <CardHeader title="Посетители по часам" icon={Activity} sub="Холл ожидания · сегодня" />
          <div className="mt-3"><HourlyLoadChart data={hourlyLoad} height={180} /></div>
          <div className="mt-2"><LegendRow items={[{ label: 'Сегодня', color: CHART.accent }, { label: 'Среднее за неделю', color: CHART.muted, dashed: true }]} /></div>

          <div className="label mb-3 mt-6">Хронология дня</div>
          <ol className="relative space-y-3 border-l border-line pl-4">
            {todayTimeline.map((e, k) => (
              <motion.li key={k} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + k * 0.06 }} className="relative">
                <span className={clsx('absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-ink-900', SEVERITY[e.severity].dot)} />
                <div className="flex gap-3 text-[13px]">
                  <span className="num w-10 shrink-0 font-mono text-xs leading-5 text-fg-3">{e.time}</span>
                  <span className="text-fg-2">{e.text}</span>
                </div>
              </motion.li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  )
}
