import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ApiError } from '../../../shell/api'
import { DEMO, ROLE_LABEL, useUser } from '../../../shell/auth'
import type { Role } from '../../../shell/auth'
import { api } from '../api/client'
import type { MoveResponse } from '../api/client'
import { setCatalog } from '../data/catalog'
import * as mock from '../data/mock'
import { loadQueue, newKey, saveQueue } from '../lib/queue'
import type { QueuedOp } from '../lib/queue'
import { expiryDays, EXPIRY_WARN_DAYS, level, needsOrder } from '../lib/stock'
import type { AppNotification, ClinicInfo, Item, Movement, MovementSource, MovementType } from '../types'

/**
 * Данные склада.
 *
 * Демо (shell DEMO): всё в памяти браузера, как раньше.
 * С бэкендом: позиции и журнал из /api/stock, остатки считает сервер. Операция сначала
 * попадает в очередь браузера (lib/queue.ts) и сразу отправляется; нет связи — остаётся
 * в очереди, на экране уже учтена (помечена «в очереди») и уйдёт сама, когда сеть вернётся.
 */

export interface MoveInput {
  type: MovementType
  lines: { itemId: string; qty: number }[]
  room?: string
  note?: string
  /** Кто физически выдал / принял. Не указан — тот, кто вошёл */
  user?: string
  source: MovementSource
}

export interface MoveResult {
  /** Позиции после операции */
  items: Item[]
  /** Позиции, которые этой операцией ушли ниже минимума или в ноль */
  alerts: { item: Item; level: 'low' | 'out' }[]
  /** Нет связи с сервером — операция в очереди браузера и проведётся позже */
  queued: boolean
}

interface DataCtx {
  clinic: ClinicInfo
  items: Item[]
  movements: Movement[]
  notifications: AppNotification[]
  unread: number
  lowCount: number
  outCount: number
  expiringCount: number
  toOrder: Item[]
  /** Операций в очереди браузера (не дошли до сервера) */
  queued: number
  /** Можно проводить операции и править номенклатуру (право «Склад: изменение») */
  canEdit: boolean
  byBarcode: (code: string) => Item | undefined
  byId: (id: string) => Item | undefined
  /** Провести операцию. Ошибка (нет позиции, не хватает остатка, нет прав) — исключение с текстом */
  move: (m: MoveInput) => Promise<MoveResult>
  saveItem: (item: Item, isNew: boolean) => Promise<Item>
  markAllRead: () => void
  notify: (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => void
  /** Перечитать позиции и журнал с сервера */
  refresh: () => void
}

const Ctx = createContext<DataCtx | null>(null)

const nowTime = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

/** Изменение остатка от операции из очереди */
const signed = (type: MovementType, qty: number) => (type === 'in' || type === 'adjust' ? qty : -qty)

/** Ответы, после которых повторять операцию бессмысленно: она неверна, её нужно поправить */
const isRejected = (e: unknown) => e instanceof ApiError && e.status >= 400 && e.status < 500 && ![401, 408, 429].includes(e.status)

/** Уведомления при открытии склада — по текущим остаткам и срокам */
function startNotifications(items: Item[]): AppNotification[] {
  const out = items.filter((i) => level(i) === 'out')
  const low = items.filter((i) => level(i) === 'low')
  const exp = items.filter((i) => {
    const d = expiryDays(i)
    return d != null && d <= EXPIRY_WARN_DAYS && i.stock > 0
  })
  const list = (xs: Item[]) => xs.slice(0, 5).map((i) => i.name).join(', ') + (xs.length > 5 ? '…' : '')
  const n: AppNotification[] = []
  if (out.length) n.push({ id: 'start-out', severity: 'alarm', title: `Закончилось: ${out.length} поз.`, text: list(out), time: nowTime(), read: false })
  if (low.length) n.push({ id: 'start-low', severity: 'warning', title: `Ниже минимума: ${low.length} поз.`, text: list(low), time: nowTime(), read: false })
  if (exp.length) n.push({ id: 'start-exp', severity: 'warning', title: `Истекает срок: ${exp.length} поз.`, text: list(exp), time: nowTime(), read: false })
  return n
}

export function DataProvider({ active, children }: { active: boolean; children: ReactNode }) {
  return DEMO ? <DemoProvider>{children}</DemoProvider> : <ApiProvider active={active}>{children}</ApiProvider>
}

/** Общая часть: уведомления и производные значения */
function useCommon(items: Item[], initialNotes: AppNotification[]) {
  const user = useUser()
  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotes)

  const notify = useCallback((n: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    setNotifications((xs) => [{ ...n, id: `n${Date.now()}${Math.random()}`, time: nowTime(), read: false }, ...xs])
  }, [])
  const markAllRead = useCallback(() => setNotifications((xs) => xs.map((n) => ({ ...n, read: true }))), [])

  const notifyAlerts = useCallback((alerts: MoveResult['alerts']) => {
    for (const { item, level: lv } of alerts) {
      notify({
        severity: lv === 'out' ? 'alarm' : 'warning',
        title: lv === 'out' ? `Закончилось: ${item.name}` : `Ниже минимума: ${item.name}`,
        text: `Остаток ${item.stock} ${item.unit} при минимуме ${item.min}. Позиция добавлена в заказ поставщику.`,
      })
    }
  }, [notify])

  const byBarcode = useCallback((code: string) => items.find((i) => i.barcode === code.trim()), [items])
  const byId = useCallback((id: string) => items.find((i) => i.id === id), [items])

  const derived = useMemo(() => {
    const clinic: ClinicInfo = {
      ...mock.clinic,
      user: { name: user.name, role: ROLE_LABEL[user.role as Role], initials: user.name.trim().charAt(0).toUpperCase() },
      version: DEMO ? mock.clinic.version : 'v0.2 · сервер',
    }
    return {
      clinic,
      canEdit: user.permissions.sklad === 'edit',
      lowCount: items.filter((i) => level(i) === 'low').length,
      outCount: items.filter((i) => level(i) === 'out').length,
      expiringCount: items.filter((i) => {
        const d = expiryDays(i)
        return d != null && d <= EXPIRY_WARN_DAYS && i.stock > 0
      }).length,
      toOrder: items.filter(needsOrder),
      unread: notifications.filter((n) => !n.read).length,
    }
  }, [items, notifications, user])

  return useMemo(
    () => ({ user, notifications, notify, notifyAlerts, markAllRead, byBarcode, byId, derived }),
    [user, notifications, notify, notifyAlerts, markAllRead, byBarcode, byId, derived],
  )
}

// ---------------------------------------------------------------- демо

function DemoProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(() => structuredClone(mock.items))
  const [movements, setMovements] = useState<Movement[]>(() => structuredClone(mock.movements))
  const c = useCommon(items, mock.notifications)
  const { user, notifyAlerts } = c

  const move = useCallback(async (m: MoveInput): Promise<MoveResult> => {
    const result: MoveResult = { items: [], alerts: [], queued: false }
    const next = new Map(items.map((i) => [i.id, i]))
    const created: Movement[] = []
    for (const { itemId, qty } of m.lines) {
      const it = next.get(itemId)
      if (!it || qty === 0) continue
      const after: Item = { ...it, stock: Math.max(0, it.stock + signed(m.type, qty)) }
      const before = level(it)
      const lv = level(after)
      if (lv === 'out' && before !== 'out') result.alerts.push({ item: after, level: 'out' })
      else if (lv === 'low' && before !== 'low' && before !== 'out') result.alerts.push({ item: after, level: 'low' })
      next.set(itemId, after)
      result.items.push(after)
      created.push({
        id: `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        ts: new Date().toISOString(), itemId, type: m.type, qty, user: m.user ?? user.name,
        room: m.room, note: m.note, source: m.source,
      })
    }
    setItems((xs) => xs.map((x) => next.get(x.id) ?? x))
    setMovements((xs) => [...created, ...xs])
    notifyAlerts(result.alerts)
    return result
  }, [items, user.name, notifyAlerts])

  const saveItem = useCallback(async (item: Item, isNew: boolean) => {
    setItems((xs) => (isNew ? [item, ...xs] : xs.map((x) => (x.id === item.id ? item : x))))
    return item
  }, [])

  const value = useMemo<DataCtx>(() => ({
    ...c.derived, items, movements, notifications: c.notifications, queued: 0,
    byBarcode: c.byBarcode, byId: c.byId, move, saveItem, markAllRead: c.markAllRead, notify: c.notify, refresh: () => {},
  }), [c, items, movements, move, saveItem])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// ---------------------------------------------------------------- API

const REFRESH_MS = 30_000
const RETRY_MS = 15_000

function ApiProvider({ active, children }: { active: boolean; children: ReactNode }) {
  const [loaded, setLoaded] = useState<{ items: Item[]; movements: Movement[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [queue, setQueue] = useState<QueuedOp[]>(loadQueue)
  const queueRef = useRef(queue)
  /** Результаты отправки по ключу операции — move() ждёт свой */
  const results = useRef(new Map<string, MoveResponse | Error>())

  // Что на экране = сервер + операции из очереди, которые сервер ещё не видел
  const { items, movements } = useMemo(() => {
    if (!loaded) return { items: [] as Item[], movements: [] as Movement[] }
    const seen = new Set(loaded.movements.map((m) => m.opKey))
    const waiting = queue.filter((op) => !seen.has(op.key))
    if (!waiting.length) return loaded
    const byCode = new Map(loaded.items.map((i) => [i.barcode, i]))
    const stock = new Map<string, number>()
    const pending: Movement[] = []
    for (const op of waiting) {
      for (const ln of op.body.items) {
        const it = byCode.get(ln.barcode)
        if (!it) continue
        stock.set(it.id, (stock.get(it.id) ?? 0) + signed(op.body.type, ln.qty))
        pending.push({
          id: `q-${op.key}-${it.id}`, ts: op.createdAt, itemId: it.id, type: op.body.type, qty: ln.qty,
          user: op.body.user ?? '', room: op.body.room, note: op.body.note, source: op.body.source,
          opKey: op.key, pending: true,
        })
      }
    }
    return {
      items: loaded.items.map((i) => (stock.has(i.id) ? { ...i, stock: Math.max(0, i.stock + stock.get(i.id)!) } : i)),
      movements: [...pending.reverse(), ...loaded.movements],
    }
  }, [loaded, queue])

  const c = useCommon(items, [])
  const { user, notify, notifyAlerts } = c

  const setQ = useCallback((fn: (q: QueuedOp[]) => QueuedOp[]) => {
    queueRef.current = fn(queueRef.current)
    saveQueue(queueRef.current)
    setQueue(queueRef.current)
  }, [])

  const started = useRef(false)
  const load = useCallback(async () => {
    try {
      const [catalog, staff, its, mvs] = await Promise.all([api.catalog(), api.staff(), api.items(), api.movements()])
      setCatalog({
        ...catalog,
        staff: staff.map((s) => ({ id: String(s.id), name: s.name, role: ROLE_LABEL[s.role as Role] ?? s.role, initials: s.name.charAt(0) })),
      })
      setLoaded({ items: its, movements: mvs })
      setError(null)
      if (!started.current) {
        started.current = true
        startNotifications(its).reverse().forEach((n) => notify(n))
      }
    } catch (e) {
      // нет связи при обновлении — показываем то, что уже загружено
      setLoaded((prev) => {
        if (!prev) setError(e instanceof Error ? e.message : String(e))
        return prev
      })
    }
  }, [notify])

  /** Ответ сервера: обновить позиции и журнал */
  const applyResponse = useCallback((r: MoveResponse) => {
    setLoaded((prev) => {
      if (!prev) return prev
      const upd = new Map(r.items.map((i) => [i.id, i]))
      const known = new Set(prev.movements.map((m) => m.id))
      return {
        items: prev.items.map((i) => upd.get(i.id) ?? i),
        movements: [...r.movements.filter((m) => !known.has(m.id)), ...prev.movements],
      }
    })
  }, [])

  /** Отправить очередь по порядку. Нет связи — остановиться и попробовать позже */
  const flushChain = useRef<Promise<void>>(Promise.resolve())
  const flush = useCallback(() => {
    flushChain.current = flushChain.current.then(async () => {
      while (queueRef.current.length) {
        const op = queueRef.current[0]
        try {
          const r = await api.move(op.body)
          applyResponse(r)
          setQ((q) => q.filter((x) => x.key !== op.key))
          results.current.set(op.key, r)
          const byId = new Map(r.items.map((i) => [i.id, i]))
          notifyAlerts(r.alerts.flatMap((a) => (byId.get(a.itemId) ? [{ item: byId.get(a.itemId)!, level: a.level }] : [])))
        } catch (e) {
          if (!isRejected(e)) return // нет связи, сервер недоступен, вход истёк — повторим позже
          // сервер отказал (нет позиции, не хватает остатка, нет прав): из очереди убираем, сообщаем
          setQ((q) => q.filter((x) => x.key !== op.key))
          const err = e instanceof Error ? e : new Error(String(e))
          results.current.set(op.key, err)
          notify({ severity: 'alarm', title: 'Операция не проведена', text: `${err.message}. Отсканировано ${new Date(op.createdAt).toLocaleString('ru-RU')}.` })
        }
      }
    })
    return flushChain.current
  }, [applyResponse, notify, notifyAlerts, setQ])

  const move = useCallback(async (m: MoveInput): Promise<MoveResult> => {
    const byId = new Map(items.map((i) => [i.id, i]))
    const lines = m.lines.filter((l) => l.qty !== 0 && byId.has(l.itemId))
    if (!lines.length) throw new Error('Нет позиций для операции')
    const key = newKey()
    setQ((q) => [...q, {
      key,
      createdAt: new Date().toISOString(),
      body: {
        type: m.type, items: lines.map((l) => ({ barcode: byId.get(l.itemId)!.barcode, qty: l.qty })),
        user: m.user || user.name, room: m.room, note: m.note, source: m.source, idempotency_key: key,
      },
    }])
    await flush()
    const r = results.current.get(key)
    results.current.delete(key)
    if (r instanceof Error) throw r
    if (r) {
      const upd = new Map(r.items.map((i) => [i.id, i]))
      return {
        items: r.items,
        alerts: r.alerts.flatMap((a) => (upd.get(a.itemId) ? [{ item: upd.get(a.itemId)!, level: a.level }] : [])),
        queued: false,
      }
    }
    // не дошло до сервера — на экране уже учтено из очереди
    return {
      items: lines.map((l) => {
        const it = byId.get(l.itemId)!
        return { ...it, stock: Math.max(0, it.stock + signed(m.type, l.qty)) }
      }),
      alerts: [],
      queued: true,
    }
  }, [items, user.name, setQ, flush])

  const saveItem = useCallback(async (item: Item, isNew: boolean) => {
    // Остаток меняется только операциями: у новой позиции — начальный приход, при правке не трогаем
    const { id, dailyUse: _d, stock, ...rest } = item
    const body = { ...rest, stock: isNew ? stock : null }
    const saved = isNew ? await api.createItem(body) : await api.updateItem(id, body)
    setLoaded((prev) => prev && {
      ...prev,
      items: isNew ? [saved, ...prev.items] : prev.items.map((x) => (x.id === saved.id ? saved : x)),
    })
    // начальный остаток и пересчёт проводятся операциями — подтянем их в журнал
    void load()
    return saved
  }, [load])

  // первая загрузка, затем — отправка очереди, оставшейся с прошлого раза
  useEffect(() => {
    void load().then(() => {
      if (queueRef.current.length) void flush()
    })
  }, [load, flush])

  // пока склад на экране — подтягиваем чужие операции (другие компьютеры, бот)
  useEffect(() => {
    if (!active) return
    void load()
    const t = setInterval(() => void load(), REFRESH_MS)
    return () => clearInterval(t)
  }, [active, load])

  // очередь отправляется и в фоне: при появлении сети и по таймеру
  useEffect(() => {
    if (!queue.length) return
    const go = () => void flush()
    window.addEventListener('online', go)
    const t = setInterval(go, RETRY_MS)
    return () => {
      window.removeEventListener('online', go)
      clearInterval(t)
    }
  }, [queue.length, flush])

  const value = useMemo<DataCtx>(() => ({
    ...c.derived, items, movements, notifications: c.notifications, queued: queue.length,
    byBarcode: c.byBarcode, byId: c.byId, move, saveItem, markAllRead: c.markAllRead, notify: c.notify,
    refresh: () => void load(),
  }), [c, items, movements, queue.length, move, saveItem, load])

  if (error && !loaded) {
    return (
      <div className="grid min-h-[calc(100vh_-_var(--shell-h))] place-items-center p-6 text-center">
        <div>
          <div className="text-fg">Не удалось загрузить склад</div>
          <p className="mt-1 text-sm text-fg-3">{error}</p>
          <button type="button" onClick={() => void load()} className="mt-4 rounded-lg border border-line px-4 py-2 text-sm text-fg-2 hover:text-fg">Повторить</button>
        </div>
      </div>
    )
  }
  if (!loaded) {
    return (
      <div className="grid min-h-[calc(100vh_-_var(--shell-h))] place-items-center">
        <div className="flex items-center gap-3 text-sm text-fg-2">
          <span className="h-2 w-2 animate-ping rounded-full bg-accent" />
          Загрузка склада…
        </div>
      </div>
    )
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useData вне DataProvider')
  return c
}
