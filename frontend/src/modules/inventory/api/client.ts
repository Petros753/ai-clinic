import * as mock from '../data/mock'
import type { AppNotification, Item, Movement } from '../types'

/**
 * Слой доступа к данным.
 *
 * Без VITE_API_URL всё работает на mock-данных в памяти браузера (демо).
 * С VITE_API_URL панель ходит в REST API с теми же контрактами (типы в src/types):
 *
 *   GET   /items                 → Item[]
 *   GET   /items/by-barcode/:ean → Item | 404
 *   POST  /items                 { Item без id }        → Item
 *   PATCH /items/:id             Partial<Item>          → Item
 *   GET   /movements?from&to     → Movement[]
 *   POST  /movements             { itemId, type, qty, room?, note?, source } → { movement, item }
 *   GET   /notifications         → AppNotification[]
 *
 * Telegram-бот ходит в тот же backend, поэтому операции из бота и со сканера
 * попадают в один журнал.
 */

const API_URL: string | undefined = import.meta.env.VITE_API_URL

export const isDemo = !API_URL

async function http<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${method} ${path}: ${res.status}`)
  return (await res.json()) as T
}

export interface Snapshot {
  items: Item[]
  movements: Movement[]
  notifications: AppNotification[]
}

export const api = {
  /** Начальные данные. В демо — синхронно из mock. */
  demoSnapshot(): Snapshot {
    return structuredClone({ items: mock.items, movements: mock.movements, notifications: mock.notifications })
  },

  async snapshot(): Promise<Snapshot> {
    if (isDemo) return this.demoSnapshot()
    const [items, movements, notifications] = await Promise.all([
      http<Item[]>('GET', '/items'),
      http<Movement[]>('GET', '/movements'),
      http<AppNotification[]>('GET', '/notifications'),
    ])
    return { items, movements, notifications }
  },

  /** Сохранить операцию. В демо состояние меняет DataContext, здесь no-op. */
  async saveMovement(m: Movement): Promise<void> {
    if (isDemo) return
    await http('POST', '/movements', m)
  },

  async saveItem(i: Item, isNew: boolean): Promise<void> {
    if (isDemo) return
    await http(isNew ? 'POST' : 'PATCH', isNew ? '/items' : `/items/${i.id}`, i)
  },
}
