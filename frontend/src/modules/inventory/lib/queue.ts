import type { MovementSource, MovementType } from '../types'

/**
 * Очередь операций склада в браузере (localStorage).
 *
 * Каждая операция сначала кладётся сюда, потом отправляется в API. Нет связи —
 * остаётся в очереди и уходит позже (при появлении сети, по таймеру, после перезагрузки).
 * idempotency_key создаётся один раз при постановке в очередь, поэтому повторная
 * отправка той же операции на сервере второй раз не проводится.
 */

export interface MoveBody {
  type: MovementType
  items: { barcode: string; qty: number }[]
  user?: string
  room?: string
  note?: string
  source: MovementSource
  idempotency_key: string
}

export interface QueuedOp {
  key: string
  body: MoveBody
  /** Когда отсканировали (ISO) — для журнала, пока операция не дошла до сервера */
  createdAt: string
}

const STORAGE_KEY = 'sklad.queue.v1'

export function loadQueue(): QueuedOp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as QueuedOp[]) : []
  } catch {
    return []
  }
}

export function saveQueue(q: QueuedOp[]) {
  try {
    if (q.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(q))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* хранилище недоступно — очередь живёт до перезагрузки страницы */
  }
}

/** Уникальный ключ операции. randomUUID есть только на https, поэтому запасной вариант */
export function newKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}
