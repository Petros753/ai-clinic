import * as mock from './mock'
import type { Category, Staff, Supplier } from '../types'

/**
 * Справочники склада: категории, поставщики, кабинеты, сотрудники.
 *
 * В демо — из mock, при работе с API DataProvider заменяет содержимое массивов
 * (setCatalog) до того, как показать страницы. Массивы меняются на месте, поэтому
 * их можно импортировать напрямую: `import { categories } from '../data/catalog'`.
 */
export const categories: Category[] = [...mock.categories]
export const suppliers: Supplier[] = [...mock.suppliers]
export const rooms: string[] = [...mock.rooms]
export const staff: Staff[] = [...mock.staff]

/** Позиция без поставщика (поставщик не обязателен при заведении) */
export const NO_SUPPLIER: Supplier = { id: '', name: 'Поставщик не указан', contact: '', leadDays: 3 }

const replace = <T,>(arr: T[], next: T[]) => arr.splice(0, arr.length, ...next)

export function setCatalog(c: { categories: Category[]; suppliers: Supplier[]; rooms: string[]; staff: Staff[] }) {
  replace(categories, c.categories)
  replace(suppliers, c.suppliers)
  replace(rooms, c.rooms)
  replace(staff, c.staff)
}
