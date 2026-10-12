// Доменные типы склада расходников стоматологической клиники.
// Структура повторяет то, что позже будет отдавать API (FastAPI + Postgres → панель / Telegram-бот).

export type PageId = 'home' | 'scan' | 'items' | 'movements' | 'orders' | 'analytics' | 'bot' | 'settings'

export type Severity = 'info' | 'warning' | 'alarm' | 'ai'

/** Состояние остатка позиции */
export type StockLevel = 'ok' | 'low' | 'out' | 'over'

export type Unit = 'шт' | 'уп' | 'фл' | 'шпр' | 'кар' | 'наб'

export type MovementType = 'in' | 'out' | 'writeoff' | 'adjust'

/** Откуда пришла операция */
export type MovementSource = 'scanner' | 'manual' | 'bot'

export interface Category {
  id: string
  name: string
  color: string
}

export interface Supplier {
  id: string
  name: string
  contact: string
  leadDays: number // срок поставки, дней
}

export interface Item {
  id: string
  /** Штрихкод производителя (EAN-13). Позже можно добавить несколько кодов на позицию */
  barcode: string
  sku: string
  name: string
  brand: string
  categoryId: string
  unit: Unit
  /** Сколько штук в единице учёта: «уп 100 шт» */
  pack: string
  stock: number
  /** Минимальный остаток — ниже него приходит уведомление */
  min: number
  /** Оптимальный остаток — до него дозаказываем */
  max: number
  price: number // ₽ за единицу учёта
  supplierId: string
  location: string
  /** Ближайший срок годности партии на складе, ISO-дата */
  expiry: string | null
  /** Средний расход в день (считается по истории) */
  dailyUse: number
}

export interface Movement {
  id: string
  ts: string // ISO
  itemId: string
  type: MovementType
  qty: number // всегда положительное; знак задаёт type (adjust — со знаком)
  user: string
  /** Для расхода — куда выдано */
  room?: string
  note?: string
  source: MovementSource
}

export interface Staff {
  id: string
  name: string
  role: string
  initials: string
  telegram?: string
}

export interface ClinicInfo {
  name: string
  subtitle: string
  user: { name: string; role: string; initials: string }
  version: string
}

export interface AppNotification {
  id: string
  severity: Severity
  title: string
  text: string
  time: string
  read: boolean
}

/** Позиция в заказе поставщику */
export interface OrderLine {
  item: Item
  qty: number
  sum: number
}
