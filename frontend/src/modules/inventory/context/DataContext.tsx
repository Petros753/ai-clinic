import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api/client'
import { clinic } from '../data/mock'
import { expiryDays, EXPIRY_WARN_DAYS, level, needsOrder } from '../lib/stock'
import type { AppNotification, ClinicInfo, Item, Movement, MovementSource, MovementType } from '../types'

export interface MoveInput {
  itemId: string
  type: MovementType
  qty: number
  room?: string
  note?: string
  user?: string
  source: MovementSource
}

export interface MoveResult {
  item: Item
  movement: Movement
  /** Операция опустила остаток ниже минимума / в ноль — ушло уведомление */
  alert: 'low' | 'out' | null
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
  byBarcode: (code: string) => Item | undefined
  byId: (id: string) => Item | undefined
  move: (m: MoveInput) => MoveResult | null
  saveItem: (item: Item) => void
  markAllRead: () => void
  notify: (n: Omit<AppNotification, 'id' | 'time' | 'read'>) => void
}

const Ctx = createContext<DataCtx | null>(null)

const nowTime = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

export function DataProvider({ children }: { children: ReactNode }) {
  const [snap] = useState(() => api.demoSnapshot())
  const [items, setItems] = useState<Item[]>(snap.items)
  const [movements, setMovements] = useState<Movement[]>(snap.movements)
  const [notifications, setNotifications] = useState<AppNotification[]>(snap.notifications)

  const byBarcode = useCallback((code: string) => items.find((i) => i.barcode === code.trim()), [items])
  const byId = useCallback((id: string) => items.find((i) => i.id === id), [items])

  const notify = useCallback((n: Omit<AppNotification, 'id' | 'time' | 'read'>) => {
    setNotifications((xs) => [{ ...n, id: `n${Date.now()}${Math.random()}`, time: nowTime(), read: false }, ...xs])
  }, [])

  const move = useCallback((m: MoveInput): MoveResult | null => {
    const it = items.find((i) => i.id === m.itemId)
    if (!it || m.qty === 0) return null
    const d = m.type === 'in' ? m.qty : m.type === 'adjust' ? m.qty : -m.qty
    const next: Item = { ...it, stock: Math.max(0, it.stock + d) }
    const movement: Movement = {
      id: `m${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      ts: new Date().toISOString(),
      itemId: it.id,
      type: m.type,
      qty: m.qty,
      user: m.user ?? 'Анна К.',
      room: m.room,
      note: m.note,
      source: m.source,
    }

    let alert: MoveResult['alert'] = null
    const before = level(it)
    const after = level(next)
    if (after === 'out' && before !== 'out') alert = 'out'
    else if (after === 'low' && before !== 'low' && before !== 'out') alert = 'low'

    setItems((xs) => xs.map((x) => (x.id === it.id ? next : x)))
    setMovements((xs) => [movement, ...xs])
    if (alert) {
      notify({
        severity: alert === 'out' ? 'alarm' : 'warning',
        title: alert === 'out' ? `Закончилось: ${it.name}` : `Ниже минимума: ${it.name}`,
        text: `Остаток ${next.stock} ${it.unit} при минимуме ${it.min}. Позиция добавлена в заказ поставщику.`,
      })
    }
    void api.saveMovement(movement)
    return { item: next, movement, alert }
  }, [items, notify])

  const saveItem = useCallback((item: Item) => {
    const isNew = !items.some((i) => i.id === item.id)
    setItems((xs) => (isNew ? [item, ...xs] : xs.map((x) => (x.id === item.id ? item : x))))
    void api.saveItem(item, isNew)
  }, [items])

  const markAllRead = useCallback(() => setNotifications((xs) => xs.map((n) => ({ ...n, read: true }))), [])

  const value = useMemo<DataCtx>(() => {
    const lowCount = items.filter((i) => level(i) === 'low').length
    const outCount = items.filter((i) => level(i) === 'out').length
    const expiringCount = items.filter((i) => {
      const d = expiryDays(i)
      return d != null && d <= EXPIRY_WARN_DAYS && i.stock > 0
    }).length
    return {
      clinic, items, movements, notifications,
      unread: notifications.filter((n) => !n.read).length,
      lowCount, outCount, expiringCount,
      toOrder: items.filter(needsOrder),
      byBarcode, byId, move, saveItem, markAllRead, notify,
    }
  }, [items, movements, notifications, byBarcode, byId, move, saveItem, markAllRead, notify])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useData вне DataProvider')
  return c
}
