import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AudioLines, BadgeCheck, CalendarDays, CircleAlert, FileAudio, HardDrive, ListChecks, Lock, Mic, Scissors, Send, ShieldCheck, Sparkles, Stethoscope, TriangleAlert, UserX, Users,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { ToastProvider, useToast } from './components/ui/Toast'
import { CHECKLIST, doctorOf, doctors, score, visits, weekIssues } from './data/visits'
import type { CheckId } from './data/visits'
import { Card, Head, ScoreRing, Sparkline, TONE, tone } from './ui'
import { VisitDetail } from './VisitDetail'

type Tab = 'day' | 'doctors' | 'how'
const TABS: { id: Tab; label: string }[] = [
  { id: 'day', label: 'Приёмы дня' },
  { id: 'doctors', label: 'Врачи за неделю' },
  { id: 'how', label: 'Как это работает' },
]

function Shell() {
  const [tab, setTab] = useState<Tab>('day')
  const toast = useToast()
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-full">
      <header className="sticky top-[var(--shell-h)] z-40 border-b border-line bg-ink-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-[#1b2a3d] to-[#0e1622] shadow-[0_0_24px_-6px_rgba(157,140,255,0.5)]">
              <Mic size={18} className="text-ai" />
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-900 bg-ok" />
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold text-fg">Качество приёма</div>
              <div className="text-[11px] capitalize text-fg-3">Smart Clinic · {today}</div>
            </div>
          </div>

          <nav className="order-3 flex w-full gap-1 overflow-x-auto rounded-xl border border-line bg-white/[0.02] p-1 [scrollbar-width:none] md:order-none md:ml-6 md:w-auto" aria-label="Разделы">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                aria-current={tab === t.id ? 'page' : undefined}
                className={clsx('relative shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors', tab === t.id ? 'text-fg' : 'text-fg-3 hover:text-fg-2')}
              >
                {tab === t.id && <motion.span layoutId="tab" className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.07]" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-ok/25 bg-ok/10 px-3 py-1 text-xs font-medium text-ok lg:inline-flex">
              <BadgeCheck size={13} /> 3 бейджа · записи обработаны в 19:40
            </span>
            <button
              type="button"
              onClick={() => toast('Сводка дня отправлена директору в Telegram (демо)')}
              className="inline-flex items-center gap-2 rounded-xl border border-ai/25 bg-ai/10 px-3 py-2 text-sm font-medium text-ai transition hover:bg-ai/15"
            >
              <Send size={15} /><span className="hidden sm:inline">Сводку в Telegram</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 md:px-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {tab === 'day' && <DayTab />}
            {tab === 'doctors' && <DoctorsTab />}
            {tab === 'how' && <HowTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

// ---------------- Приёмы дня ----------------

function DayTab() {
  const [doc, setDoc] = useState<string>('all')
  const [sel, setSel] = useState(visits[2].id) // открываем самый показательный — с критичным замечанием
  const detailRef = useRef<HTMLDivElement>(null)

  const list = useMemo(() => visits.filter((v) => doc === 'all' || v.doctorId === doc), [doc])
  const avg = Math.round(visits.reduce((s, v) => s + score(v), 0) / visits.length)
  const crit = visits.reduce((s, v) => s + v.flags.filter((f) => f.level === 'crit').length, 0)
  const risk = visits.filter((v) => v.flags.some((f) => f.level === 'risk')).length
  const current = visits.find((v) => v.id === sel)!

  const pick = (id: string) => {
    setSel(id)
    if (window.innerWidth < 1280) setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  return (
    <>
      <div className="mb-5">
        <h1 className="text-[26px] font-semibold tracking-[-0.01em] text-fg">Разбор приёмов за день</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-2">Записи с бейджей врачей расшифрованы и разобраны по чек-листу клиники. Откройте приём, чтобы увидеть разбор, цитаты и расшифровку.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card className="p-4 md:p-5">
          <Head title="Сводка дня" icon={Sparkles} sub="сформирована AI по 8 разговорам" />
          <div className="mt-3 space-y-2.5 text-sm leading-relaxed text-fg-2">
            <p><b className="text-fg">8 приёмов</b>, средняя оценка <b className="text-fg">{avg}</b>. Лучший день у Олега Павловича: четыре приёма, везде полный анамнез и названы цены.</p>
            <p><b className="text-crit">Требует разбора:</b> на удалении зуба мудрости (10:40, Елена Викторовна) перед анестезией не уточнены аллергии и препараты, согласие на записи не прозвучало.</p>
            <p><b className="text-warn">Риск потери пациента:</b> консультация по коронке (11:30, Дмитрий Сергеевич) — цена не названа, пациент ушёл «подумать». Стоит позвонить ему завтра.</p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <Stat label="Приёмов записано" value="8" sub="3 врача · 4 ч 13 мин разговоров" icon={AudioLines} />
          <Stat label="Средняя оценка" value={String(avg)} sub="по чек-листу из 9 пунктов" icon={ListChecks} cls={TONE[tone(avg)].text} />
          <Stat label="Критичные замечания" value={String(crit)} sub="анамнез и согласие" icon={CircleAlert} cls="text-crit" border="border-crit/30" />
          <Stat label="Риск потери пациента" value={String(risk)} sub="ушёл «подумать»" icon={UserX} cls="text-warn" border="border-warn/25" />
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[{ id: 'all', short: 'Все врачи', role: '' }, ...doctors].map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDoc(d.id)}
            className={clsx('shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition', doc === d.id ? 'border-white/20 bg-white/[0.07] text-fg' : 'border-line text-fg-2 hover:text-fg')}
          >
            {d.short}{d.role && <span className="ml-1.5 text-xs text-fg-3">{d.role.toLowerCase()}</span>}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
        <ul className="min-w-0 space-y-2 xl:sticky xl:top-[calc(88px_+_var(--shell-h))] xl:max-h-[calc(100vh_-_110px_-_var(--shell-h))] xl:overflow-y-auto xl:pr-1">
          {list.map((v) => {
            const sc = score(v)
            const d = doctorOf(v)
            const on = v.id === sel
            return (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => pick(v.id)}
                  aria-pressed={on}
                  className={clsx('glass flex w-full items-center gap-3 p-3.5 text-left transition', on ? 'border-accent/40 bg-accent/[0.06]' : 'hover:border-white/15')}
                >
                  <ScoreRing value={sc} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-fg-3">
                      <span className="num font-mono text-fg-2">{v.time}</span>·<span className="truncate">{d.short}</span>·<span>{v.duration} мин</span>
                    </div>
                    <div className="mt-0.5 truncate text-sm font-medium text-fg">{v.service}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-fg-3">
                      <span className="font-mono">{v.patient}</span> · {v.patientInfo}
                      {v.flags.map((f) => (
                        <span key={f.text} className={clsx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium', f.level === 'crit' ? 'bg-crit/15 text-crit' : 'bg-warn/15 text-warn')}>
                          {f.level === 'crit' ? <CircleAlert size={11} /> : <TriangleAlert size={11} />}
                          {f.level === 'crit' ? 'критично' : 'риск'}
                        </span>
                      ))}
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>

        <div ref={detailRef} className="min-w-0 scroll-mt-[calc(6rem_+_var(--shell-h))]">
          <VisitDetail v={current} />
        </div>
      </div>
    </>
  )
}

function Stat({ label, value, sub, icon: Icon, cls, border }: { label: string; value: string; sub: string; icon: typeof Mic; cls?: string; border?: string }) {
  return (
    <div className={clsx('glass p-4', border)}>
      <div className="flex items-center justify-between gap-2">
        <span className="label">{label}</span>
        <Icon size={16} className={cls ?? 'text-fg-2'} />
      </div>
      <div className={clsx('num mt-2 text-[28px] font-semibold leading-none', cls ?? 'text-fg')}>{value}</div>
      <div className="mt-1.5 text-xs text-fg-3">{sub}</div>
    </div>
  )
}

// ---------------- Врачи за неделю ----------------

const WEEK: Record<string, { visits: number; best: string; weak: string; rate: Record<CheckId, number> }> = {
  d1: { visits: 31, best: 'Анамнез и контроль боли — без пропусков', weak: 'Иногда говорит терминами без пояснения', rate: { greet: 96, complaints: 100, anamnesis: 100, explain: 82, options: 90, consent: 88, comfort: 97, aftercare: 94, next: 92 } },
  d2: { visits: 18, best: 'Понятно объясняет, зачем нужно вмешательство', weak: 'Пропускает анамнез и приветствие', rate: { greet: 48, complaints: 85, anamnesis: 71, explain: 88, options: 60, consent: 70, comfort: 74, aftercare: 62, next: 80 } },
  d3: { visits: 22, best: 'Внимателен к эстетике и прикусу', weak: 'Не называет цену и не записывает на следующий визит', rate: { greet: 70, complaints: 92, anamnesis: 83, explain: 75, options: 45, consent: 85, comfort: 90, aftercare: 66, next: 40 } },
}

const DAYS = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'пн']

function DoctorsTab() {
  const maxIssue = Math.max(...weekIssues.map((i) => i.count))
  return (
    <>
      <div className="mb-5">
        <h1 className="text-[26px] font-semibold tracking-[-0.01em] text-fg">Врачи за неделю</h1>
        <p className="mt-1 text-sm text-fg-2">Средняя оценка, динамика и слабые места каждого врача — основа для разговора на планёрке.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {doctors.map((d) => {
          const avg = Math.round(d.week.reduce((a, b) => a + b, 0) / d.week.length)
          const w = WEEK[d.id]
          const delta = d.week[d.week.length - 1] - d.week[0]
          const t = TONE[tone(avg)]
          return (
            <Card key={d.id} className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2b3c55] to-[#1a2536] text-sm font-semibold ring-1 ring-white/10">{d.initials}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold text-fg">{d.name}</div>
                  <div className="text-xs text-fg-3">{d.role} · {w.visits} приёмов</div>
                </div>
                <ScoreRing value={avg} size={52} />
              </div>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[11px] text-fg-3">
                  <span>Оценка по дням</span>
                  <span className={delta >= 0 ? 'text-ok' : 'text-crit'}>{delta >= 0 ? '+' : ''}{delta} за неделю</span>
                </div>
                <Sparkline data={d.week} color={t.hex} />
                <div className="mt-1 flex justify-between font-mono text-[10px] text-fg-3">{DAYS.map((x, i) => <span key={i}>{x}</span>)}</div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ok" /><span className="text-fg-2">{w.best}</span></div>
                <div className="flex gap-2"><span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-crit" /><span className="text-fg-2">{w.weak}</span></div>
              </div>
            </Card>
          )
        })}
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="p-4 md:p-5"><Head title="Выполнение чек-листа, % приёмов" icon={ListChecks} sub="где у каждого врача провалы · ≥ 85 норма, 70–84 внимание, < 70 разбор" /></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-y border-line text-left">
                <th className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3 md:px-5">Пункт</th>
                {doctors.map((d) => <th key={d.id} className="px-3 py-2.5 text-center text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3">{d.short}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {CHECKLIST.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 text-fg-2 md:px-5">{c.title}{c.critical && <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-fg-3">обязательно</span>}</td>
                  {doctors.map((d) => {
                    const v = WEEK[d.id].rate[c.id]
                    const t = TONE[tone(v)]
                    return (
                      <td key={d.id} className="px-3 py-1.5 text-center">
                        <span className={clsx('num inline-block w-16 rounded-md py-1 font-medium', t.bg, t.text)}>{v}%</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-4 p-4 md:p-5">
        <Head title="Частые замечания по клинике" icon={TriangleAlert} sub="за 7 дней, 71 приём" />
        <ul className="mt-4 space-y-3">
          {weekIssues.map((i) => (
            <li key={i.text}>
              <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className="text-fg">{i.text}</span>
                <span className="num shrink-0 text-fg-2">{i.count} раз</span>
              </div>
              <div className="h-2 rounded-full bg-white/[0.04]"><div className="h-full rounded-full bg-accent-deep" style={{ width: `${(i.count / maxIssue) * 100}%` }} /></div>
              <div className="mt-1 text-xs text-fg-3">{i.doctors}</div>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}

// ---------------- Как это работает ----------------

const STEPS = [
  { icon: Mic, title: 'Бейдж записывает приём', text: 'Врач носит бейдж с диктофоном весь рабочий день. Ничего нажимать не нужно.' },
  { icon: HardDrive, title: 'Вечером — на сервер клиники', text: 'Бейдж ставят на зарядку, записи автоматически копируются на сервер. В интернет аудио не уходит.' },
  { icon: Scissors, title: 'Нарезка по приёмам', text: 'Запись дня делится на разговоры по расписанию врача: каждому приёму — свой фрагмент.' },
  { icon: FileAudio, title: 'Расшифровка', text: 'Whisper переводит речь в текст, отдельная модель разделяет голоса: врач, пациент, ассистент. Имена скрываются.' },
  { icon: Stethoscope, title: 'Разбор по чек-листу', text: 'Языковая модель на сервере клиники оценивает каждый пункт стандарта и прикладывает цитаты.' },
  { icon: CalendarDays, title: 'Утром — отчёт директору', text: 'Сводка в Telegram и подробный разбор в панели. Можно открыть любую реплику.' },
]

function HowTab() {
  return (
    <>
      <div className="mb-5">
        <h1 className="text-[26px] font-semibold tracking-[-0.01em] text-fg">Как это работает</h1>
        <p className="mt-1 max-w-3xl text-sm text-fg-2">От записи на бейдже до утреннего отчёта — без участия врача и администратора.</p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="glass flex gap-3.5 p-4">
            <div className="flex flex-col items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white/[0.03] text-accent"><s.icon size={18} /></span>
              <span className="num font-mono text-[11px] text-fg-3">шаг {i + 1}</span>
            </div>
            <div>
              <div className="font-medium text-fg">{s.title}</div>
              <div className="mt-1 text-sm leading-relaxed text-fg-3">{s.text}</div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <Head title="Конфиденциальность" icon={ShieldCheck} />
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-fg-2">
            {[
              { icon: Lock, t: 'Всё обрабатывается на сервере клиники', d: 'Аудио и расшифровки не передаются в облачные сервисы. Это медицинская тайна и персональные данные о здоровье.' },
              { icon: UserX, t: 'Пациенты обезличены', d: 'В отчётах — код пациента, имена в расшифровке скрываются автоматически.' },
              { icon: BadgeCheck, t: 'Согласие пациента и уведомление врачей', d: 'Пункт о записи приёма в договоре или анкете пациента; для сотрудников — локальный акт клиники с подписью.' },
              { icon: Users, t: 'Доступ только у директора', d: 'Врач видит разборы только своих приёмов. Аудио удаляется через 30 дней, остаётся текстовый разбор.' },
            ].map((x) => (
              <li key={x.t} className="flex gap-3">
                <x.icon size={16} className="mt-0.5 shrink-0 text-ok" />
                <div><div className="font-medium text-fg">{x.t}</div><div className="text-fg-3">{x.d}</div></div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <Head title="Чек-лист клиники" icon={ListChecks} sub="настраивается под стандарт клиники" />
          <ol className="mt-4 space-y-2.5">
            {CHECKLIST.map((c, i) => (
              <li key={c.id} className="flex gap-3 text-sm">
                <span className="num w-5 shrink-0 text-right font-mono text-fg-3">{i + 1}</span>
                <div>
                  <span className="text-fg">{c.title}</span>
                  {c.critical && <span className="ml-2 rounded bg-crit/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-crit">критичный</span>}
                  <div className="text-xs text-fg-3">{c.hint}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  )
}
