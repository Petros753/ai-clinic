import { AudioLines, LayoutDashboard, Package } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { lazy } from 'react'
import type { ComponentType } from 'react'

/**
 * Реестр разделов клиники. Каждый раздел — самостоятельное приложение в src/modules/<папка>,
 * которое отдаёт default-компонент. Оболочка (Shell) рисует общую верхнюю панель и монтирует раздел.
 *
 * Адрес раздела: #/<id>[/<страница внутри раздела>], например #/sklad/orders.
 * Чтобы добавить раздел: положить папку в src/modules и добавить запись сюда.
 */
export type ModuleId = 'dashboard' | 'sklad' | 'razgovory'

export interface ModuleDef {
  id: ModuleId
  /** Подпись во вкладке */
  label: string
  /** Заголовок окна браузера */
  title: string
  icon: LucideIcon
  /** `active` = раздел сейчас на экране (остальные остаются в памяти, но скрыты) */
  component: ComponentType<{ active: boolean }>
  /** Заглушка до подключения настоящего раздела */
  placeholder?: boolean
}

export const MODULES: ModuleDef[] = [
  {
    id: 'dashboard',
    label: 'Дашборд',
    title: 'Дашборд',
    icon: LayoutDashboard,
    component: lazy(() => import('../modules/dashboard/App')),
  },
  {
    id: 'sklad',
    label: 'Склад',
    title: 'Склад расходников',
    icon: Package,
    component: lazy(() => import('../modules/inventory/App')),
  },
  {
    id: 'razgovory',
    label: 'Разговоры',
    title: 'Качество приёма',
    icon: AudioLines,
    component: lazy(() => import('../modules/transcripts/App')),
  },
]

/** Раздел по умолчанию — первый настоящий (не заглушка) */
export const DEFAULT_MODULE: ModuleId = (MODULES.find((m) => !m.placeholder) ?? MODULES[0]).id
