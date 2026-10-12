import { CircleAlert, Info, Siren, Sparkles, TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { categories, NO_SUPPLIER, suppliers } from '../data/catalog'
import type { Item, Movement, MovementSource, MovementType, OrderLine, Severity, StockLevel } from '../types'

export const LEVEL: Record<StockLevel, { label: string; color: string; text: string; bg: string; ring: string }> = {
  ok: { label: 'В норме', color: '#22b35e', text: 'text-ok', bg: 'bg-ok/10', ring: 'ring-ok/30' },
  low: { label: 'Мало', color: '#f5b020', text: 'text-warn', bg: 'bg-warn/10', ring: 'ring-warn/30' },
  out: { label: 'Нет в наличии', color: '#e5484d', text: 'text-crit', bg: 'bg-crit/10', ring: 'ring-crit/40' },
  over: { label: 'Избыток', color: '#5cc8ff', text: 'text-accent', bg: 'bg-accent/10', ring: 'ring-accent/30' },
}

export const SEVERITY: Record<Severity, { label: string; icon: LucideIcon; text: string; bg: string; dot: string }> = {
  info: { label: 'Информация', icon: Info, text: 'text-accent', bg: 'bg-accent/10', dot: 'bg-accent' },
  warning: { label: 'Предупреждение', icon: TriangleAlert, text: 'text-warn', bg: 'bg-warn/10', dot: 'bg-warn' },
  alarm: { label: 'Критично', icon: Siren, text: 'text-crit', bg: 'bg-crit/10', dot: 'bg-crit' },
  ai: { label: 'AI-прогноз', icon: Sparkles, text: 'text-ai', bg: 'bg-ai/10', dot: 'bg-ai' },
}

export const AlertIcon = CircleAlert

export const MOVE: Record<MovementType, { label: string; sign: string; text: string; bg: string }> = {
  in: { label: 'Приход', sign: '+', text: 'text-ok', bg: 'bg-ok/10' },
  out: { label: 'Расход', sign: '−', text: 'text-accent', bg: 'bg-accent/10' },
  writeoff: { label: 'Списание', sign: '−', text: 'text-crit', bg: 'bg-crit/10' },
  adjust: { label: 'Корректировка', sign: '±', text: 'text-warn', bg: 'bg-warn/10' },
}

export const SOURCE: Record<MovementSource, string> = {
  scanner: 'Сканер',
  manual: 'Вручную',
  bot: 'Telegram',
}

export const level = (i: Item): StockLevel =>
  i.stock <= 0 ? 'out' : i.stock < i.min ? 'low' : i.stock > i.max * 1.5 ? 'over' : 'ok'

/** На сколько дней хватит остатка при текущем расходе */
export const daysLeft = (i: Item): number | null =>
  i.dailyUse > 0 ? Math.floor(i.stock / i.dailyUse) : null

/** Дней до истечения срока годности ближайшей партии */
export function expiryDays(i: Item): number | null {
  if (!i.expiry) return null
  const ms = new Date(i.expiry + 'T23:59:59').getTime() - Date.now()
  return Math.ceil(ms / 86_400_000)
}

export const EXPIRY_WARN_DAYS = 30

export const isExpiring = (i: Item) => {
  const d = expiryDays(i)
  return d != null && d <= EXPIRY_WARN_DAYS
}

/** Нужно ли дозаказать: ниже минимума или закончится раньше, чем придёт поставка (+2 дня запаса) */
export function needsOrder(i: Item): boolean {
  if (i.stock < i.min) return true
  const d = daysLeft(i)
  const lead = supplierOf(i).leadDays
  return d != null && d <= lead + 2
}

export function orderLine(i: Item): OrderLine {
  const qty = Math.max(1, i.max - i.stock)
  return { item: i, qty, sum: qty * i.price }
}

export const categoryOf = (i: Item) =>
  categories.find((c) => c.id === i.categoryId) ?? categories[0] ?? { id: i.categoryId, name: 'Без категории', color: '#6d7b8e' }
export const supplierOf = (i: Item) => suppliers.find((s) => s.id === i.supplierId) ?? NO_SUPPLIER

export const stockValue = (items: Item[]) => items.reduce((s, i) => s + i.stock * i.price, 0)

/** Изменение остатка от операции */
export const delta = (m: Movement) => (m.type === 'in' ? m.qty : m.type === 'adjust' ? m.qty : -m.qty)

// ---------- форматирование ----------

const rub = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
export const fmtRub = (v: number) => `${rub.format(Math.round(v))} ₽`
export const fmtRubShort = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1).replace('.', ',')} млн ₽` : v >= 10_000 ? `${Math.round(v / 1000)} тыс ₽` : fmtRub(v)

export function plural(n: number, one: string, few: string, many: string) {
  const a = Math.abs(n) % 100
  const b = a % 10
  if (a > 10 && a < 20) return many
  if (b > 1 && b < 5) return few
  if (b === 1) return one
  return many
}

export const fmtDays = (n: number) => `${n} ${plural(n, 'день', 'дня', 'дней')}`

export function fmtWhen(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  if (d.getTime() >= startToday) return `сегодня, ${time}`
  if (d.getTime() >= startToday - 86_400_000) return `вчера, ${time}`
  return `${d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}, ${time}`
}

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })

export const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
