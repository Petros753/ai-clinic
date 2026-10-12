import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, MapPin, Minus, Pencil, Plus, Timer, Truck, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useData } from '../../context/DataContext'
import { categories, rooms, suppliers } from '../../data/catalog'
import {
  categoryOf, dayKey, daysLeft, expiryDays, EXPIRY_WARN_DAYS, fmtDate, fmtDays, fmtRub, fmtWhen, LEVEL, level, MOVE, SOURCE, supplierOf,
} from '../../lib/stock'
import type { Item, Unit } from '../../types'
import { Button, StatusPill } from '../ui'
import { Barcode, Field, Input, Select, Stepper } from '../ui/extra'
import { useToast } from '../ui/Toast'

export type DrawerState = { mode: 'view'; id: string } | { mode: 'new'; barcode?: string } | null

export function ItemDrawer({ state, onClose }: { state: DrawerState; onClose: () => void }) {
  useEffect(() => {
    if (!state) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [state, onClose])

  return (
    <AnimatePresence>
      {state && (
        <>
          <motion.div className="fixed inset-0 z-[60] bg-ink-950/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-label="Карточка позиции"
            className="glass-strong fixed bottom-0 right-0 top-0 z-[61] flex w-full max-w-[520px] flex-col rounded-none sm:bottom-3 sm:right-3 sm:top-3 sm:rounded-3xl"
            initial={{ x: '105%' }} animate={{ x: 0 }} exit={{ x: '105%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            {state.mode === 'view' ? <ItemView id={state.id} onClose={onClose} /> : <ItemForm barcode={state.barcode} onClose={onClose} />}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function DrawerHead({ title, sub, onClose, right }: { title: string; sub?: string; onClose: () => void; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line p-4 sm:p-5">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-snug text-fg">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-fg-3">{sub}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {right}
        <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-fg-2 hover:bg-white/5" aria-label="Закрыть">
          <X size={18} />
        </button>
      </div>
    </div>
  )
}

function ItemView({ id, onClose }: { id: string; onClose: () => void }) {
  const { byId, movements, move, canEdit } = useData()
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const [edit, setEdit] = useState(false)
  const [qty, setQty] = useState(1)
  const [room, setRoom] = useState<string>(rooms[0])
  const it = byId(id)

  const hist = useMemo(() => movements.filter((m) => m.itemId === id), [movements, id])
  const bars = useMemo(() => {
    const days: { key: string; v: number; label: string }[] = []
    for (let d = 29; d >= 0; d--) {
      const dt = new Date()
      dt.setDate(dt.getDate() - d)
      days.push({ key: dayKey(dt), v: 0, label: dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) })
    }
    const idx = new Map(days.map((x, i) => [x.key, i]))
    for (const m of hist) {
      if (m.type !== 'out') continue
      const i = idx.get(dayKey(new Date(m.ts)))
      if (i != null) days[i].v += m.qty
    }
    return days
  }, [hist])

  if (!it) return null
  if (edit) return <ItemForm item={it} onClose={() => setEdit(false)} />

  const lv = level(it)
  const dl = daysLeft(it)
  const ed = expiryDays(it)
  const cat = categoryOf(it)
  const sup = supplierOf(it)
  const maxBar = Math.max(1, ...bars.map((b) => b.v))
  const scale = Math.max(it.max, it.stock, 1)

  const act = async (type: 'in' | 'out') => {
    setBusy(true)
    try {
      const r = await move({ lines: [{ itemId: it.id, qty }], type, room: type === 'out' ? room : undefined, source: 'manual' })
      toast(`${type === 'in' ? 'Приход' : 'Расход'}: ${it.name} · ${qty} ${it.unit}${r.queued ? ' — нет связи, проведётся автоматически' : ''}`)
      const a = r.alerts[0]?.level
      if (a) setTimeout(() => toast(a === 'out' ? 'Позиция закончилась — уведомление в Telegram' : 'Ниже минимума — уведомление в Telegram'), 400)
      setQty(1)
    } catch (e) {
      toast(`Не проведено: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <DrawerHead
        title={it.name}
        sub={`${it.brand} · ${it.sku} · ${it.pack} в ${it.unit}`}
        onClose={onClose}
        right={canEdit && <button type="button" onClick={() => setEdit(true)} className="grid h-9 w-9 place-items-center rounded-lg text-fg-2 hover:bg-white/5" aria-label="Редактировать"><Pencil size={16} /></button>}
      />
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={lv} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-fg-2">
            <span className="h-2 w-2 rounded-full" style={{ background: cat.color }} />{cat.name}
          </span>
        </div>

        {/* остаток */}
        <div className="rounded-2xl border border-line bg-white/[0.02] p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="label">Остаток</div>
              <div className={clsx('num mt-1 text-4xl font-semibold tracking-tight', LEVEL[lv].text)}>
                {it.stock} <span className="text-lg font-medium text-fg-3">{it.unit}</span>
              </div>
            </div>
            <div className="text-right text-xs text-fg-3">
              мин. <span className="num text-fg-2">{it.min}</span> · опт. <span className="num text-fg-2">{it.max}</span>
              <div className="mt-1">на сумму <span className="num text-fg-2">{fmtRub(it.stock * it.price)}</span></div>
            </div>
          </div>
          <div className="relative mt-4 h-2 rounded-full bg-white/[0.06]">
            <motion.div className="h-full rounded-full" style={{ background: LEVEL[lv].color }} initial={{ width: 0 }} animate={{ width: `${Math.min(100, (it.stock / scale) * 100)}%` }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }} />
            <span className="absolute -top-1 h-4 w-0.5 rounded bg-warn" style={{ left: `${(it.min / scale) * 100}%` }} title="Минимум" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Info icon={Timer} label="Хватит на" value={dl == null ? '—' : dl === 0 ? 'закончилось' : `≈ ${fmtDays(dl)}`} warn={dl != null && dl <= sup.leadDays + 2} />
            <Info icon={CalendarClock} label="Срок годности" value={ed == null ? 'не ограничен' : ed <= 0 ? 'истёк' : `${fmtDate(it.expiry!)} · ${fmtDays(ed)}`} warn={ed != null && ed <= EXPIRY_WARN_DAYS} />
            <Info icon={MapPin} label="Место хранения" value={it.location} />
            <Info icon={Truck} label="Поставщик" value={`${sup.name} · ${sup.leadDays} дн.`} />
          </div>
        </div>

        {/* быстрая операция */}
        <div className="rounded-2xl border border-line bg-white/[0.02] p-4">
          <div className="label mb-3">Быстрая операция</div>
          <div className="flex flex-wrap items-center gap-3">
            <Stepper value={qty} onChange={setQty} max={999} />
            <Select value={room} onChange={(e) => setRoom(e.target.value)} className="h-11 min-w-0 flex-1" aria-label="Куда выдать">
              {rooms.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="ghost" icon={Plus} onClick={() => act('in')} disabled={busy || !canEdit} className="h-11 border-ok/30 text-ok hover:border-ok/50">Приход</Button>
            <Button variant="primary" icon={Minus} onClick={() => act('out')} disabled={busy || !canEdit || it.stock < qty} className="h-11">Выдать</Button>
          </div>
        </div>

        {/* расход 30 дней */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label">Расход за 30 дней</span>
            <span className="text-xs text-fg-3">в среднем {it.dailyUse.toFixed(2).replace('.', ',')} {it.unit}/день</span>
          </div>
          <div className="flex h-16 items-end gap-[3px]">
            {bars.map((b) => (
              <div key={b.key} className="group relative flex-1" title={`${b.label}: ${b.v}`}>
                <div className="rounded-sm bg-accent/70 transition group-hover:bg-accent" style={{ height: `${b.v ? Math.max(8, (b.v / maxBar) * 64) : 2}px`, opacity: b.v ? 1 : 0.25 }} />
              </div>
            ))}
          </div>
        </div>

        {/* штрихкод */}
        <div className="flex items-center gap-4 rounded-2xl border border-line bg-white/[0.02] p-4">
          <Barcode code={it.barcode} light className="h-16 w-36 shrink-0" />
          <div className="min-w-0 text-xs text-fg-3">
            <div className="label mb-1">Штрихкод производителя</div>
            <div className="num font-mono text-sm text-fg-2">{it.barcode}</div>
            <div className="mt-1">Сканер распознаёт его на упаковке. Для позиций без кода можно распечатать эту этикетку.</div>
          </div>
        </div>

        {/* история */}
        <div>
          <div className="label mb-2">История операций</div>
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {hist.slice(0, 10).map((m) => {
              const t = MOVE[m.type]
              return (
                <li key={m.id} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
                  <span className={clsx('num w-12 shrink-0 rounded-md px-1.5 py-0.5 text-center text-xs font-semibold', t.bg, t.text)}>{t.sign}{Math.abs(m.qty)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-fg">{m.type === 'out' ? m.room : m.note ?? t.label}</div>
                    <div className="truncate text-[11px] text-fg-3">{m.user} · {SOURCE[m.source]}</div>
                  </div>
                  <span className="shrink-0 text-[11px] text-fg-3">{fmtWhen(m.ts)}</span>
                </li>
              )
            })}
            {hist.length === 0 && <li className="p-4 text-center text-sm text-fg-3">Операций пока не было</li>}
          </ul>
        </div>
      </div>
    </>
  )
}

function Info({ icon: Icon, label, value, warn }: { icon: typeof Timer; label: string; value: string; warn?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[11px] text-fg-3"><Icon size={12} />{label}</div>
      <div className={clsx('mt-0.5 truncate text-sm', warn ? 'text-warn' : 'text-fg')}>{value}</div>
    </div>
  )
}

const UNITS: Unit[] = ['уп', 'шт', 'фл', 'шпр', 'кар', 'наб']

function ItemForm({ item, barcode, onClose }: { item?: Item; barcode?: string; onClose: () => void }) {
  const { saveItem, items } = useData()
  const toast = useToast()
  const isNew = !item
  const [f, setF] = useState<Item>(
    () =>
      item ?? {
        id: `i${Date.now()}`, barcode: barcode ?? '', sku: '', name: '', brand: '', categoryId: categories[0].id,
        unit: 'уп', pack: '', stock: 0, min: 1, max: 5, price: 0, supplierId: suppliers[0]?.id ?? null, location: '', expiry: null, dailyUse: 0,
      },
  )
  const set = <K extends keyof Item>(k: K, v: Item[K]) => setF((x) => ({ ...x, [k]: v }))
  const dup = f.barcode && items.some((i) => i.barcode === f.barcode && i.id !== f.id)
  const valid = f.name.trim() && f.barcode.trim() && !dup && f.max >= f.min

  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (!valid || busy) return
    setBusy(true)
    try {
      await saveItem({ ...f, name: f.name.trim(), sku: f.sku.trim() || `NEW-${f.barcode.slice(-5)}` }, isNew)
      toast(isNew ? `Добавлено в номенклатуру: ${f.name}` : 'Изменения сохранены')
      onClose()
    } catch (e) {
      toast(`Не сохранено: ${e instanceof Error ? e.message : String(e)}`)
      setBusy(false)
    }
  }

  return (
    <>
      <DrawerHead title={isNew ? 'Новая позиция' : 'Редактирование'} sub={isNew ? 'Штрихкод привяжется к позиции — дальше она будет определяться сканером' : f.name} onClose={onClose} />
      <form className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-5" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <Field label="Штрихкод" hint={dup ? 'Этот штрихкод уже привязан к другой позиции' : undefined}>
          <Input value={f.barcode} onChange={(e) => set('barcode', e.target.value.replace(/\D/g, ''))} inputMode="numeric" className={clsx('font-mono', dup && 'border-crit/50')} placeholder="4600000000000" autoFocus={isNew && !barcode} />
        </Field>
        <Field label="Название"><Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Например: Перчатки нитриловые, L" autoFocus={isNew && !!barcode} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Производитель"><Input value={f.brand} onChange={(e) => set('brand', e.target.value)} /></Field>
          <Field label="Артикул"><Input value={f.sku} onChange={(e) => set('sku', e.target.value)} placeholder="авто" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Категория">
            <Select value={f.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Поставщик">
            <Select value={f.supplierId ?? ''} onChange={(e) => set('supplierId', e.target.value || null)}>
              <option value="">Не указан</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Ед. учёта">
            <Select value={f.unit} onChange={(e) => set('unit', e.target.value as Unit)}>
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </Select>
          </Field>
          <Field label="В единице" className="col-span-2"><Input value={f.pack} onChange={(e) => set('pack', e.target.value)} placeholder="100 шт" /></Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Минимум"><Input type="number" min={0} value={f.min} onChange={(e) => set('min', Number(e.target.value))} /></Field>
          <Field label="Оптимум"><Input type="number" min={0} value={f.max} onChange={(e) => set('max', Number(e.target.value))} /></Field>
          <Field label="Цена, ₽"><Input type="number" min={0} value={f.price} onChange={(e) => set('price', Number(e.target.value))} /></Field>
        </div>
        {f.max < f.min && <p className="-mt-2 text-xs text-crit">Оптимальный остаток не может быть меньше минимального</p>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Место хранения"><Input value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Шкаф А · полка 1" /></Field>
          <Field label="Срок годности"><Input type="date" value={f.expiry ?? ''} onChange={(e) => set('expiry', e.target.value || null)} /></Field>
        </div>
        {isNew && (
          <Field label="Начальный остаток" hint="Сколько уже лежит на складе">
            <Input type="number" min={0} value={f.stock} onChange={(e) => set('stock', Number(e.target.value))} />
          </Field>
        )}
        <div className="flex gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} className="flex-1">Отмена</Button>
          <Button variant="primary" type="submit" disabled={!valid || busy} className="flex-1">{isNew ? 'Добавить' : 'Сохранить'}</Button>
        </div>
      </form>
    </>
  )
}
