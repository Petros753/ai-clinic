import clsx from 'clsx'
import { motion } from 'framer-motion'
import {
  ChartColumn, History, LayoutDashboard, Package, ScanBarcode, Send, Settings, ShoppingCart,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useData } from '../../context/DataContext'
import type { PageId } from '../../types'

export const NAV: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Обзор', icon: LayoutDashboard },
  { id: 'scan', label: 'Приход / расход', icon: ScanBarcode },
  { id: 'items', label: 'Номенклатура', icon: Package },
  { id: 'movements', label: 'Журнал операций', icon: History },
  { id: 'orders', label: 'Заказ поставщикам', icon: ShoppingCart },
  { id: 'analytics', label: 'Аналитика', icon: ChartColumn },
  { id: 'bot', label: 'Telegram-бот', icon: Send },
  { id: 'settings', label: 'Настройки', icon: Settings },
]

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-[#1b2a3d] to-[#0e1622] shadow-[0_0_24px_-6px_rgba(92,200,255,0.5)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#5cc8ff" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
          <path d="M6.5 8.5c0-2.6 1.7-3.5 3.3-3.5 1.2 0 1.6.6 2.2.6s1-.6 2.2-.6c1.6 0 3.3.9 3.3 3.5 0 3.3-1.2 4.2-1.6 7.5-.2 1.7-.8 3-1.7 3s-1.1-1.2-1.3-2.5c-.3-1.4-.5-2-.9-2s-.6.6-.9 2c-.2 1.3-.4 2.5-1.3 2.5s-1.5-1.3-1.7-3c-.4-3.3-1.6-4.2-1.6-7.5z" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-900 bg-ok" />
      </div>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold text-fg">Smart Clinic</div>
        <div className="text-[11px] text-fg-3">Склад расходников</div>
      </div>
    </div>
  )
}

export function Sidebar({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  const { clinic, lowCount, outCount, toOrder } = useData()
  const problems = lowCount + outCount
  return (
    <nav className="flex h-full flex-col gap-6 px-4 py-5" aria-label="Основная навигация">
      <div className="px-2"><Logo /></div>

      <ul className="flex flex-col gap-1">
        {NAV.map((item) => {
          const active = page === item.id
          const Icon = item.icon
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                  active ? 'text-fg' : 'text-fg-2 hover:bg-white/[0.04] hover:text-fg',
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-xl border border-white/[0.08] bg-gradient-to-r from-white/[0.08] to-white/[0.02]"
                    transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  />
                )}
                <Icon size={18} strokeWidth={1.8} className={clsx('relative', active && 'text-accent')} />
                <span className="relative flex-1 text-left">{item.label}</span>
                {item.id === 'items' && problems > 0 && (
                  <span className={clsx('relative rounded-full px-1.5 text-[10px] font-semibold', outCount ? 'bg-crit text-white' : 'bg-warn text-ink-950')}>{problems}</span>
                )}
                {item.id === 'orders' && toOrder.length > 0 && (
                  <span className="relative rounded-full bg-white/10 px-1.5 text-[10px] font-semibold text-fg-2">{toOrder.length}</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto space-y-3">
        <div className="rounded-xl border border-line bg-white/[0.02] p-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="ring-pulse absolute inset-0 rounded-full bg-ok" />
              <span className="relative h-2 w-2 rounded-full bg-ok" />
            </span>
            <span className="text-fg">Сканер готов</span>
          </div>
          <div className="mt-1.5 text-[11px] leading-relaxed text-fg-3">Сканируйте штрихкод на любой странице — откроется операция</div>
        </div>

        <div className="flex items-center gap-3 rounded-xl px-2 py-1">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#2b3c55] to-[#1a2536] text-xs font-semibold text-fg ring-1 ring-white/10">
            {clinic.user.initials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-medium text-fg">{clinic.user.name}</div>
            <div className="truncate text-[11px] text-fg-3">{clinic.user.role}</div>
          </div>
        </div>
        <div className="px-2 font-mono text-[10px] text-fg-3">{clinic.version}</div>
      </div>
    </nav>
  )
}
