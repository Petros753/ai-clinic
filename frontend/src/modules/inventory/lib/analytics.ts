import { categories } from '../data/catalog'
import type { Item, Movement } from '../types'
import { dayKey } from './stock'

export interface DayPoint { key: string; label: string; sum: number; units: number; weekend: boolean }

/** Расход (выдача + списание) по дням за последние N дней, в ₽ и единицах */
export function dailyConsumption(movements: Movement[], items: Item[], days: number): DayPoint[] {
  const price = new Map(items.map((i) => [i.id, i.price]))
  const out: DayPoint[] = []
  for (let d = days - 1; d >= 0; d--) {
    const dt = new Date()
    dt.setDate(dt.getDate() - d)
    out.push({
      key: dayKey(dt),
      label: dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }).replace('.', ''),
      sum: 0, units: 0, weekend: dt.getDay() === 0,
    })
  }
  const idx = new Map(out.map((p, i) => [p.key, i]))
  for (const m of movements) {
    if (m.type !== 'out' && m.type !== 'writeoff') continue
    const i = idx.get(dayKey(new Date(m.ts)))
    if (i == null) continue
    out[i].sum += m.qty * (price.get(m.itemId) ?? 0)
    out[i].units += m.qty
  }
  return out
}

const since = (days: number) => Date.now() - days * 86_400_000

/** Расход по категориям за период, ₽ — в фиксированном порядке категорий */
export function byCategory(movements: Movement[], items: Item[], days: number) {
  const map = new Map(items.map((i) => [i.id, i]))
  const t = since(days)
  const acc = new Map<string, number>(categories.map((c) => [c.id, 0]))
  for (const m of movements) {
    if ((m.type !== 'out' && m.type !== 'writeoff') || new Date(m.ts).getTime() < t) continue
    const it = map.get(m.itemId)
    if (it) acc.set(it.categoryId, (acc.get(it.categoryId) ?? 0) + m.qty * it.price)
  }
  return categories.map((c) => ({ id: c.id, name: c.name, color: c.color, sum: acc.get(c.id) ?? 0 }))
}

/** Расход по кабинетам за период, ₽ */
export function byRoom(movements: Movement[], items: Item[], days: number) {
  const price = new Map(items.map((i) => [i.id, i.price]))
  const t = since(days)
  const acc = new Map<string, number>()
  for (const m of movements) {
    if (m.type !== 'out' || !m.room || new Date(m.ts).getTime() < t) continue
    acc.set(m.room, (acc.get(m.room) ?? 0) + m.qty * (price.get(m.itemId) ?? 0))
  }
  return [...acc.entries()].map(([name, sum]) => ({ name, sum })).sort((a, b) => b.sum - a.sum)
}

/** Топ позиций по сумме расхода */
export function topItems(movements: Movement[], items: Item[], days: number, n = 8) {
  const map = new Map(items.map((i) => [i.id, i]))
  const t = since(days)
  const acc = new Map<string, { units: number; sum: number }>()
  for (const m of movements) {
    if (m.type !== 'out' || new Date(m.ts).getTime() < t) continue
    const it = map.get(m.itemId)
    if (!it) continue
    const a = acc.get(it.id) ?? { units: 0, sum: 0 }
    a.units += m.qty
    a.sum += m.qty * it.price
    acc.set(it.id, a)
  }
  return [...acc.entries()]
    .map(([id, a]) => ({ item: map.get(id)!, ...a }))
    .sort((a, b) => b.sum - a.sum)
    .slice(0, n)
}

/** Сумма расхода за окно [from, to) дней назад */
export function periodSum(movements: Movement[], items: Item[], fromDaysAgo: number, toDaysAgo: number) {
  const price = new Map(items.map((i) => [i.id, i.price]))
  const a = since(fromDaysAgo)
  const b = since(toDaysAgo)
  let s = 0
  for (const m of movements) {
    if (m.type !== 'out' && m.type !== 'writeoff') continue
    const t = new Date(m.ts).getTime()
    if (t >= a && t < b) s += m.qty * (price.get(m.itemId) ?? 0)
  }
  return s
}
