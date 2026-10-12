import clsx from 'clsx'
import { Download, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, Card, Empty, PageHeader, Segmented } from '../components/ui'
import { Select } from '../components/ui/extra'
import { useData } from '../context/DataContext'
import { useUi } from '../context/UiContext'
import { rooms } from '../data/mock'
import { fmtRub, MOVE, SOURCE } from '../lib/stock'
import type { MovementType } from '../types'
import { downloadCsv } from './Items'

type Period = '1' | '7' | '30' | 'all'

export function MovementsPage() {
  const { movements, items } = useData()
  const { openItem } = useUi()
  const [type, setType] = useState<MovementType | 'all'>('all')
  const [period, setPeriod] = useState<Period>('7')
  const [room, setRoom] = useState('all')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(60)

  const map = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  const rows = useMemo(() => {
    const now = new Date()
    const start = period === 'all' ? 0 : period === '1'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
      : Date.now() - Number(period) * 86_400_000
    const s = q.trim().toLowerCase()
    return movements.filter((m) => {
      if (type !== 'all' && m.type !== type) return false
      if (room !== 'all' && m.room !== room) return false
      if (new Date(m.ts).getTime() < start) return false
      if (s) {
        const it = map.get(m.itemId)
        if (!`${it?.name} ${it?.barcode} ${m.user} ${m.note ?? ''}`.toLowerCase().includes(s)) return false
      }
      return true
    })
  }, [movements, type, period, room, q, map])

  const totals = useMemo(() => {
    let inn = 0, out = 0
    for (const m of rows) {
      const p = (map.get(m.itemId)?.price ?? 0) * m.qty
      if (m.type === 'in') inn += p
      else if (m.type === 'out' || m.type === 'writeoff') out += p
    }
    return { inn, out }
  }, [rows, map])

  const groups = useMemo(() => {
    const g: { day: string; items: typeof rows }[] = []
    for (const m of rows.slice(0, limit)) {
      const d = new Date(m.ts)
      const label = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
      const last = g[g.length - 1]
      if (last?.day === label) last.items.push(m)
      else g.push({ day: label, items: [m] })
    }
    return g
  }, [rows, limit])

  const exportCsv = () =>
    downloadCsv('zhurnal.csv', [
      ['Дата', 'Время', 'Операция', 'Позиция', 'Штрихкод', 'Кол-во', 'Ед.', 'Сумма', 'Кабинет', 'Сотрудник', 'Источник', 'Комментарий'],
      ...rows.map((m) => {
        const it = map.get(m.itemId)
        const d = new Date(m.ts)
        return [d.toLocaleDateString('ru-RU'), d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), MOVE[m.type].label, it?.name ?? '', it?.barcode ?? '', m.qty, it?.unit ?? '', m.qty * (it?.price ?? 0), m.room ?? '', m.user, SOURCE[m.source], m.note ?? '']
      }),
    ])

  return (
    <>
      <PageHeader
        title="Журнал операций"
        sub="Каждый скан, выдача из Telegram и ручная правка — с сотрудником и временем"
        right={<Button variant="ghost" icon={Download} onClick={exportCsv}>CSV</Button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented value={period} onChange={setPeriod} options={[{ value: '1', label: 'Сегодня' }, { value: '7', label: '7 дней' }, { value: '30', label: '30 дней' }, { value: 'all', label: 'Всё' }]} />
        <Segmented
          value={type}
          onChange={setType}
          options={[{ value: 'all', label: 'Все' }, { value: 'in', label: 'Приход' }, { value: 'out', label: 'Расход' }, { value: 'writeoff', label: 'Списание' }]}
        />
        <Select value={room} onChange={(e) => setRoom(e.target.value)} className="w-auto min-w-[180px]" aria-label="Кабинет">
          <option value="all">Все кабинеты</option>
          {rooms.map((r) => <option key={r}>{r}</option>)}
        </Select>
        <div className="relative min-w-0 flex-1 basis-56">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Позиция, сотрудник, штрихкод" className="h-10 w-full rounded-xl border border-line bg-white/[0.03] pl-9 pr-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-accent/40" />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Stat label="Операций" value={String(rows.length)} />
        <Stat label="Поступило" value={fmtRub(totals.inn)} cls="text-ok" />
        <Stat label="Израсходовано" value={fmtRub(totals.out)} cls="text-accent" />
      </div>

      {groups.length === 0 ? <Empty>За выбранный период операций нет</Empty> : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Card key={g.day} className="overflow-hidden">
              <div className="border-b border-line px-4 py-2.5 text-xs font-medium capitalize text-fg-2">{g.day}</div>
              <ul className="divide-y divide-line">
                {g.items.map((m) => {
                  const it = map.get(m.itemId)
                  const t = MOVE[m.type]
                  return (
                    <li key={m.id}>
                      <button type="button" onClick={() => it && openItem(it.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-white/[0.03]">
                        <span className="num w-12 shrink-0 font-mono text-xs text-fg-3">{new Date(m.ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className={clsx('num w-14 shrink-0 rounded-md py-0.5 text-center text-xs font-semibold', t.bg, t.text)}>{t.sign}{m.qty} {it?.unit}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm text-fg">{it?.name}</div>
                          <div className="truncate text-xs text-fg-3">{t.label} · {m.room ?? m.note ?? '—'}</div>
                        </div>
                        <div className="hidden shrink-0 text-right sm:block">
                          <div className="text-xs text-fg-2">{m.user}</div>
                          <div className="text-[11px] text-fg-3">{SOURCE[m.source]}</div>
                        </div>
                        <span className="num hidden w-24 shrink-0 text-right text-xs text-fg-2 md:block">{fmtRub(m.qty * (it?.price ?? 0))}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
          {rows.length > limit && (
            <div className="text-center"><Button variant="ghost" onClick={() => setLimit((l) => l + 80)}>Показать ещё · {rows.length - limit}</Button></div>
          )}
        </div>
      )}
    </>
  )
}

function Stat({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div className="glass p-3 md:p-4">
      <div className="label">{label}</div>
      <div className={clsx('num mt-1 truncate text-lg font-semibold md:text-xl', cls ?? 'text-fg')}>{value}</div>
    </div>
  )
}
