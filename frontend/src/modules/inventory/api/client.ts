import { apiFetch } from '../../../shell/api'
import type { Category, Item, Movement, Supplier } from '../types'
import type { MoveBody } from '../lib/queue'

/**
 * API склада (backend/api/app/routers/stock.py). Права: чтение — «Склад: просмотр»,
 * операции и номенклатура — «Склад: изменение». Остатки считает сервер.
 *
 *   GET   /api/stock/catalog      → { categories, suppliers, rooms }
 *   GET   /api/stock/staff        → [{ id, name, role }]
 *   GET   /api/stock/items        → Item[]
 *   POST  /api/stock/items        Item без id, stock = начальный остаток → Item
 *   PATCH /api/stock/items/:id    Item, stock = фактический остаток → Item (разница — корректировкой)
 *   GET   /api/stock/movements    → Movement[] за 60 дней
 *   POST  /api/stock/movements    { type, items: [{barcode, qty}], user, room, note, source, idempotency_key }
 *                                 → { movements, items, alerts, duplicate }
 *
 * Демо-режим (shell DEMO) в API не ходит — всё в памяти, см. DataContext.
 */

export interface MoveResponse {
  movements: Movement[]
  items: Item[]
  alerts: { itemId: string; level: 'low' | 'out' }[]
  duplicate: boolean
}

export interface Catalog {
  categories: Category[]
  suppliers: Supplier[]
  rooms: string[]
}

/** stock: начальный остаток для новой позиции; null — остаток не трогать */
export type ItemBody = Omit<Item, 'id' | 'dailyUse' | 'stock'> & { stock: number | null }

export const api = {
  catalog: () => apiFetch<Catalog>('/stock/catalog'),
  staff: () => apiFetch<{ id: number; name: string; role: string }[]>('/stock/staff'),
  items: () => apiFetch<Item[]>('/stock/items'),
  movements: () => apiFetch<Movement[]>('/stock/movements'),
  move: (body: MoveBody) => apiFetch<MoveResponse>('/stock/movements', { method: 'POST', json: body }),
  createItem: (body: ItemBody) => apiFetch<Item>('/stock/items', { method: 'POST', json: body }),
  updateItem: (id: string, body: ItemBody) => apiFetch<Item>(`/stock/items/${id}`, { method: 'PATCH', json: body }),
}
