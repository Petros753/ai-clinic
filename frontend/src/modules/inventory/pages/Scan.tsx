import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDownToLine, ArrowUpFromLine, Ban, CircleHelp, Keyboard, PackagePlus, ScanBarcode, Trash2, Wand2, X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Card, CardHeader, PageHeader, StatusPill } from '../components/ui'
import { Barcode, Select, Stepper } from '../components/ui/extra'
import { useToast } from '../components/ui/Toast'
import { useData } from '../context/DataContext'
import { useUi } from '../context/UiContext'
import { rooms, staff } from '../data/mock'
import { emulateScan } from '../hooks/useBarcodeScanner'
import { categoryOf, fmtRub, fmtWhen, level, LEVEL, MOVE, SOURCE } from '../lib/stock'
import type { Item, MovementType } from '../types'

type Mode = Exclude<MovementType, 'adjust'>

const MODES: { id: Mode; label: string; hint: string; icon: typeof ArrowDownToLine; cls: string }[] = [
  { id: 'in', label: 'Приход', hint: 'Приёмка поставки на склад', icon: ArrowDownToLine, cls: 'text-ok border-ok/40 bg-ok/10' },
  { id: 'out', label: 'Расход', hint: 'Выдача в кабинет', icon: ArrowUpFromLine, cls: 'text-accent border-accent/40 bg-accent/10' },
  { id: 'writeoff', label: 'Списание', hint: 'Брак, истёк срок, повреждение', icon: Ban, cls: 'text-crit border-crit/40 bg-crit/10' },
]

const WRITEOFF_REASONS = ['Истёк срок годности', 'Брак', 'Повреждена упаковка', 'Инвентаризация']

interface Line { item: Item; qty: number }

/** Короткий звуковой сигнал как у настоящего терминала сбора данных */
function beep(ok: boolean) {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = 'square'
    o.frequency.value = ok ? 1760 : 220
    g.gain.value = 0.04
    o.connect(g).connect(ctx.destination)
    o.start()
    o.stop(ctx.currentTime + (ok ? 0.08 : 0.25))
    o.onended = () => ctx.close()
  } catch {
    /* звук не обязателен */
  }
}

export function ScanPage() {
  const { items, movements, byBarcode, move } = useData()
  const { incoming, newItem, openItem } = useUi()
  const toast = useToast()

  const [mode, setMode] = useState<Mode>('out')
  const [room, setRoom] = useState<string>(rooms[0])
  const [user, setUser] = useState('Анна К.')
  const [reason, setReason] = useState(WRITEOFF_REASONS[0])
  const [lines, setLines] = useState<Line[]>([])
  const [last, setLast] = useState<{ item: Item | null; code: string; n: number } | null>(null)
  const [manual, setManual] = useState('')
  const seenN = useRef(0)
  const flashN = useRef(0)

  const handle = useCallback((raw: string) => {
    const code = raw.trim()
    if (!code) return
    const it = byBarcode(code)
    beep(!!it)
    setLast({ item: it ?? null, code, n: ++flashN.current })
    if (!it) return
    setLines((ls) => {
      const ex = ls.find((l) => l.item.id === it.id)
      if (ex) return ls.map((l) => (l.item.id === it.id ? { ...l, qty: l.qty + 1 } : l))
      return [{ item: it, qty: 1 }, ...ls]
    })
  }, [byBarcode])

  // сканы из глобального хука (USB-сканер работает на любой странице)
  useEffect(() => {
    if (incoming && incoming.n !== seenN.current) {
      seenN.current = incoming.n
      handle(incoming.code)
    }
  }, [incoming, handle])

  // остатки в строках держим актуальными (могли измениться из карточки)
  useEffect(() => {
    setLines((ls) => ls.map((l) => ({ ...l, item: items.find((i) => i.id === l.item.id) ?? l.item })))
  }, [items])

  const outgoing = mode !== 'in'
  const over = outgoing && lines.some((l) => l.qty > l.item.stock)
  const total = lines.reduce((s, l) => s + l.qty * l.item.price, 0)

  const commit = () => {
    if (!lines.length || over) return
    const alerts: string[] = []
    for (const l of lines) {
      const r = move({
        itemId: l.item.id, type: mode, qty: l.qty, user, source: 'scanner',
        room: mode === 'out' ? room : undefined,
        note: mode === 'writeoff' ? reason : mode === 'in' ? 'Приёмка по скану' : undefined,
      })
      if (r?.alert) alerts.push(l.item.name)
    }
    const units = lines.reduce((s, l) => s + l.qty, 0)
    toast(`${MOVE[mode].label} проведён: ${lines.length} поз., ${units} ед.`)
    if (alerts.length) setTimeout(() => toast(`Уведомление в Telegram: заканчивается ${alerts.length === 1 ? alerts[0] : `${alerts.length} позиции`}`), 450)
    setLines([])
    setLast(null)
  }

  const demoScan = () => {
    const pool = mode === 'in' ? items.filter((i) => i.stock < i.min + 2) : items.filter((i) => i.stock > 0)
    const it = pool[Math.floor(Math.random() * pool.length)] ?? items[0]
    emulateScan(it.barcode)
  }
  const demoUnknown = () => emulateScan('4607' + String(Math.floor(Math.random() * 1e8)).padStart(8, '0') + '5')

  const today = movements.filter((m) => new Date(m.ts).toDateString() === new Date().toDateString()).slice(0, 8)
  const m = MODES.find((x) => x.id === mode)!

  return (
    <>
      <PageHeader
        title="Приход / расход"
        sub="Сканируйте штрихкод на упаковке — позиция добавится в список. Повторный скан увеличивает количество."
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          {/* режим */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {MODES.map((x) => {
              const Icon = x.icon
              const on = x.id === mode
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => setMode(x.id)}
                  aria-pressed={on}
                  className={clsx(
                    'rounded-2xl border p-3 text-left transition sm:p-4',
                    on ? x.cls : 'border-line bg-white/[0.02] text-fg-2 hover:border-white/15 hover:text-fg',
                  )}
                >
                  <Icon size={20} strokeWidth={1.9} />
                  <div className="mt-2 text-sm font-semibold sm:text-base">{x.label}</div>
                  <div className={clsx('mt-0.5 hidden text-xs sm:block', on ? 'opacity-80' : 'text-fg-3')}>{x.hint}</div>
                </button>
              )
            })}
          </div>

          {/* параметры операции */}
          <Card className="p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {mode === 'out' && (
                <div className="sm:col-span-2">
                  <div className="label mb-2">Куда выдаём</div>
                  <div className="flex flex-wrap gap-2">
                    {rooms.map((r) => (
                      <button key={r} type="button" onClick={() => setRoom(r)} className={clsx('rounded-xl border px-3 py-1.5 text-sm transition', r === room ? 'border-accent/50 bg-accent/10 text-accent' : 'border-line text-fg-2 hover:text-fg')}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {mode === 'writeoff' && (
                <label className="block">
                  <span className="label mb-1.5 block">Причина списания</span>
                  <Select value={reason} onChange={(e) => setReason(e.target.value)}>
                    {WRITEOFF_REASONS.map((r) => <option key={r}>{r}</option>)}
                  </Select>
                </label>
              )}
              <label className="block">
                <span className="label mb-1.5 block">{mode === 'in' ? 'Принимает' : 'Выдаёт'}</span>
                <Select value={user} onChange={(e) => setUser(e.target.value)}>
                  {staff.map((s) => <option key={s.id} value={s.name}>{s.name} · {s.role}</option>)}
                </Select>
              </label>
            </div>
          </Card>

          {/* зона сканирования */}
          <Card className="relative overflow-hidden p-5">
            <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
              <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-2xl border border-accent/30 bg-accent/[0.07]">
                <ScanBarcode size={36} className="text-accent" strokeWidth={1.6} />
                <motion.span
                  className="absolute inset-x-3 h-0.5 rounded bg-crit shadow-[0_0_12px_#e5484d]"
                  animate={{ top: ['22%', '78%', '22%'] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold">Готов к сканированию · {m.label.toLowerCase()}</div>
                <div className="mt-0.5 text-sm text-fg-3">USB- или Bluetooth-сканер работает как клавиатура. Ничего нажимать не нужно — просто сканируйте.</div>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => { e.preventDefault(); handle(manual); setManual('') }}
                >
                  <div className="relative min-w-0 flex-1">
                    <Keyboard size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
                    <input
                      value={manual}
                      onChange={(e) => setManual(e.target.value.replace(/\D/g, ''))}
                      inputMode="numeric"
                      placeholder="или введите штрихкод вручную"
                      className="h-10 w-full rounded-xl border border-line bg-white/[0.03] pl-9 pr-3 font-mono text-sm text-fg outline-none placeholder:font-sans placeholder:text-fg-3 focus:border-accent/50"
                    />
                  </div>
                  <Button variant="ghost" type="submit" disabled={!manual}>Найти</Button>
                </form>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
              <span className="text-[11px] uppercase tracking-wider text-fg-3">Демо без сканера:</span>
              <Button variant="subtle" icon={Wand2} onClick={demoScan} className="px-2.5 py-1.5 text-xs">Симулировать скан</Button>
              <Button variant="subtle" icon={CircleHelp} onClick={demoUnknown} className="px-2.5 py-1.5 text-xs">Неизвестный товар</Button>
            </div>
          </Card>

          {/* результат последнего скана: неизвестный код */}
          <AnimatePresence>
            {last && !last.item && (
              <motion.div key={last.n} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-3 rounded-2xl border border-warn/30 bg-warn/[0.07] p-4">
                <CircleHelp size={20} className="shrink-0 text-warn" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-fg">Штрихкод не найден в номенклатуре</div>
                  <div className="font-mono text-xs text-fg-2">{last.code}</div>
                </div>
                <Button variant="primary" icon={PackagePlus} onClick={() => newItem(last.code)}>Добавить позицию</Button>
                <button type="button" onClick={() => setLast(null)} className="grid h-9 w-9 place-items-center rounded-lg text-fg-3 hover:bg-white/5" aria-label="Скрыть"><X size={16} /></button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* список */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="text-sm font-semibold">
                К проведению <span className="text-fg-3">· {lines.length} поз.</span>
              </div>
              {lines.length > 0 && (
                <button type="button" onClick={() => setLines([])} className="text-xs text-fg-3 hover:text-crit">Очистить</button>
              )}
            </div>
            {lines.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-fg-3">Список пуст — отсканируйте первую позицию</div>
            ) : (
              <ul className="divide-y divide-line">
                <AnimatePresence initial={false}>
                  {lines.map((l) => {
                    const after = l.item.stock + (outgoing ? -l.qty : l.qty)
                    const bad = outgoing && after < 0
                    const flash = last?.item?.id === l.item.id
                    return (
                      <motion.li
                        key={l.item.id}
                        layout
                        initial={{ opacity: 0, backgroundColor: 'rgba(92,200,255,0.15)' }}
                        animate={{ opacity: 1, backgroundColor: flash ? ['rgba(92,200,255,0.14)', 'rgba(92,200,255,0)'] : 'rgba(92,200,255,0)' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex flex-wrap items-center gap-3 px-4 py-3"
                      >
                        <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: categoryOf(l.item).color }} />
                        <button type="button" onClick={() => openItem(l.item.id)} className="min-w-0 flex-1 text-left">
                          <div className="truncate text-sm font-medium text-fg hover:text-accent">{l.item.name}</div>
                          <div className="truncate text-xs text-fg-3">
                            {l.item.location} · остаток <span className="num">{l.item.stock}</span> → <span className={clsx('num font-medium', bad ? 'text-crit' : after < l.item.min ? 'text-warn' : 'text-fg-2')}>{after}</span> {l.item.unit}
                            {bad && <span className="text-crit"> · на складе только {l.item.stock}</span>}
                          </div>
                        </button>
                        <Stepper value={l.qty} onChange={(v) => setLines((ls) => ls.map((x) => (x.item.id === l.item.id ? { ...x, qty: v } : x)))} />
                        <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.item.id !== l.item.id))} className="grid h-9 w-9 place-items-center rounded-lg text-fg-3 hover:bg-white/5 hover:text-crit" aria-label="Убрать">
                          <Trash2 size={16} />
                        </button>
                      </motion.li>
                    )
                  })}
                </AnimatePresence>
              </ul>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white/[0.015] px-4 py-3">
              <div className="text-xs text-fg-3">
                {lines.length > 0 && <>Сумма: <span className="num text-sm font-medium text-fg">{fmtRub(total)}</span></>}
              </div>
              <Button variant="primary" onClick={commit} disabled={!lines.length || over} className="min-w-[180px]">
                Провести {m.label.toLowerCase()}{lines.length ? ` · ${lines.reduce((s, l) => s + l.qty, 0)} ед.` : ''}
              </Button>
            </div>
          </Card>
        </div>

        {/* правая колонка */}
        <div className="min-w-0 space-y-4">
          <Card className="p-4">
            <CardHeader title="Последний скан" icon={ScanBarcode} />
            {last?.item ? (
                <motion.div key={last.n} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 space-y-3">
                  <div className="rounded-xl bg-white p-2"><Barcode code={last.item.barcode} light className="mx-auto h-24 w-auto" /></div>
                  <div>
                    <div className="font-medium text-fg">{last.item.name}</div>
                    <div className="text-xs text-fg-3">{last.item.brand} · {last.item.pack} в {last.item.unit}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusPill status={level(last.item)} label={`${LEVEL[level(last.item)].label} · ${last.item.stock} ${last.item.unit}`} />
                    <span className="text-xs text-fg-3">{last.item.location}</span>
                  </div>
                </motion.div>
              ) : (
                <div className="mt-4 rounded-xl border border-dashed border-line p-6 text-center text-sm text-fg-3">
                  Здесь появится карточка отсканированного товара
                </div>
              )}
          </Card>

          <Card className="p-4">
            <CardHeader title="Сегодня" sub={`${today.length ? 'последние операции' : 'операций пока нет'}`} />
            <ul className="mt-3 space-y-1">
              {today.map((mv) => {
                const it = items.find((i) => i.id === mv.itemId)
                const t = MOVE[mv.type]
                return (
                  <li key={mv.id}>
                    <button type="button" onClick={() => it && openItem(it.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/[0.04]">
                      <span className={clsx('num w-11 shrink-0 rounded-md py-0.5 text-center text-xs font-semibold', t.bg, t.text)}>{t.sign}{mv.qty}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-fg">{it?.name}</div>
                        <div className="truncate text-[11px] text-fg-3">{mv.room ?? mv.note ?? t.label} · {SOURCE[mv.source]}</div>
                      </div>
                      <span className="shrink-0 text-[11px] text-fg-3">{fmtWhen(mv.ts).replace('сегодня, ', '')}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
