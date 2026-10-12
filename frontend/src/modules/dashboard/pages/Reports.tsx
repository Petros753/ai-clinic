import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, ArrowUp, CalendarClock, Download, FileText, Lightbulb, Mail, Send, Sparkles, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Button, Card, CardHeader, PageHeader, Segmented, SeverityIcon } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { useData } from '../context/DataContext'
import type { ReportData } from '../types'

const HISTORY = [
  { title: 'Ежедневный отчёт', date: '24 сентября', sent: 'Telegram · 21:00' },
  { title: 'Ежедневный отчёт', date: '23 сентября', sent: 'Telegram · 21:00' },
  { title: 'Еженедельный отчёт', date: '12–18 сентября', sent: 'Email · вс 20:00' },
  { title: 'Ежедневный отчёт', date: '22 сентября', sent: 'Telegram · 21:00' },
  { title: 'Ежемесячный отчёт', date: 'Август 2026', sent: 'Email · 1 сентября' },
]

export function ReportsPage() {
  const { reports } = useData()
  const toast = useToast()
  const [period, setPeriod] = useState<ReportData['period']>('day')
  const r = reports.find((x) => x.period === period) ?? reports[0]

  return (
    <div>
      <PageHeader
        title="Отчёты"
        sub="AI формирует отчёты автоматически и отправляет их по расписанию"
        right={<Segmented value={period} onChange={setPeriod} options={[{ value: 'day', label: 'День' }, { value: 'week', label: 'Неделя' }, { value: 'month', label: 'Месяц' }]} />}
      />

      <div className="grid gap-5 xl:grid-cols-3">
        <AnimatePresence mode="wait">
          <motion.div key={r.period} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="xl:col-span-2">
            <div className="glass p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="label">{r.range}</div>
                  <h2 className="mt-1 text-xl font-semibold">{r.title}</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button icon={Download} onClick={() => toast('PDF-отчёт сформирован (демо)')}>Скачать PDF</Button>
                  <Button icon={Send} onClick={() => toast('Отчёт отправлен в Telegram (демо)')}>Telegram</Button>
                  <Button icon={Mail} onClick={() => toast('Отчёт отправлен на email (демо)')}>Email</Button>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-ai/25 bg-gradient-to-br from-ai/[0.09] to-accent/[0.03] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-ai"><Sparkles size={15} />AI-резюме</div>
                <p className="mt-2 max-w-[75ch] text-[15px] leading-relaxed text-fg">{r.summary}</p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-3">
                {r.metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-line bg-white/[0.02] p-3">
                    <div className="text-xs text-fg-3">{m.label}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="num text-xl font-semibold">{m.value}</span>
                      {m.delta && (
                        <span className={clsx('num inline-flex items-center text-xs font-medium', m.good ? 'text-ok' : 'text-warn')}>
                          {m.delta.startsWith('−') || m.delta.startsWith('-') ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                          {m.delta.replace(/^[+−-]/, '')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="label mb-3 flex items-center gap-1.5"><TriangleAlert size={12} />Отклонения</div>
                  <ul className="space-y-2">
                    {r.deviations.map((d) => (
                      <li key={d} className="flex gap-2.5 text-sm text-fg-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-warn" />{d}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="label mb-3">События</div>
                  <ul className="space-y-2">
                    {r.events.map((e, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm">
                        <SeverityIcon severity={e.severity} size={12} />
                        <span className="num w-12 shrink-0 font-mono text-xs leading-6 text-fg-3">{e.time}</span>
                        <span className="leading-6 text-fg-2">{e.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <div className="label mb-3 flex items-center gap-1.5"><Lightbulb size={12} />Рекомендации</div>
                <ol className="space-y-2">
                  {r.recommendations.map((x, i) => (
                    <li key={x} className="flex gap-3 rounded-xl border border-line bg-white/[0.02] p-3 text-sm text-fg">
                      <span className="num grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-ai/15 text-xs font-semibold text-ai">{i + 1}</span>
                      <span className="leading-6">{x}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="space-y-5">
          <Card i={1} className="p-5">
            <CardHeader title="Расписание" icon={CalendarClock} />
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ['Ежедневный', 'каждый день в 21:00', 'Telegram'],
                ['Еженедельный', 'воскресенье, 20:00', 'Email + Telegram'],
                ['Ежемесячный', '1 числа, 09:00', 'Email'],
              ].map(([a, b, c]) => (
                <li key={a} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-white/[0.02] p-3">
                  <div>
                    <div className="font-medium">{a}</div>
                    <div className="text-xs text-fg-3">{b}</div>
                  </div>
                  <span className="rounded-md bg-accent/10 px-2 py-1 text-[11px] text-accent">{c}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card i={2} className="p-5">
            <CardHeader title="Архив" icon={FileText} />
            <ul className="mt-3 divide-y divide-line">
              {HISTORY.map((h) => (
                <li key={h.date + h.title}>
                  <button type="button" onClick={() => toast(`Открыт архивный отчёт: ${h.date} (демо)`)} className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm hover:text-accent">
                    <span>
                      <span className="block text-fg">{h.title}</span>
                      <span className="block text-xs text-fg-3">{h.date}</span>
                    </span>
                    <span className="text-right text-[11px] text-fg-3">{h.sent}</span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
