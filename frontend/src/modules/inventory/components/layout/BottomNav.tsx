import clsx from 'clsx'
import { motion } from 'framer-motion'
import { LayoutDashboard, Menu, Package, ScanBarcode, ShoppingCart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useData } from '../../context/DataContext'
import type { PageId } from '../../types'

const ITEMS: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Обзор', icon: LayoutDashboard },
  { id: 'items', label: 'Склад', icon: Package },
  { id: 'orders', label: 'Заказ', icon: ShoppingCart },
]

/** Нижняя навигация для телефона и планшета (скрыта на десктопе) */
export function BottomNav({ page, onNavigate, onMore }: { page: PageId; onNavigate: (p: PageId) => void; onMore: () => void }) {
  const { outCount, lowCount } = useData()
  const more = ![...ITEMS.map((i) => i.id), 'scan'].includes(page)
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-ink-900/85 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Навигация"
    >
      <ul className="mx-auto grid h-16 max-w-md grid-cols-5 items-center px-2">
        <Tab item={ITEMS[0]} active={page === 'home'} onClick={() => onNavigate('home')} />
        <Tab item={ITEMS[1]} active={page === 'items'} onClick={() => onNavigate('items')} badge={outCount + lowCount > 0} />
        <li className="flex justify-center">
          <button
            type="button"
            onClick={() => onNavigate('scan')}
            aria-label="Сканировать"
            aria-current={page === 'scan' ? 'page' : undefined}
            className="-mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#6fd0ff] to-[#3a7df0] text-ink-950 shadow-[0_10px_30px_-8px_rgba(92,200,255,0.9)] ring-4 ring-ink-950 transition active:scale-95"
          >
            <ScanBarcode size={24} />
          </button>
        </li>
        <Tab item={ITEMS[2]} active={page === 'orders'} onClick={() => onNavigate('orders')} />
        <Tab item={{ id: 'settings', label: 'Ещё', icon: Menu }} active={more} onClick={onMore} />
      </ul>
    </nav>
  )
}

function Tab({ item, active, onClick, badge }: { item: { id: PageId; label: string; icon: LucideIcon }; active: boolean; onClick: () => void; badge?: boolean }) {
  const Icon = item.icon
  return (
    <li className="flex justify-center">
      <button type="button" onClick={onClick} aria-current={active ? 'page' : undefined} className={clsx('relative flex w-16 flex-col items-center gap-1 py-1.5 text-[10px] font-medium transition-colors', active ? 'text-accent' : 'text-fg-3')}>
        {active && <motion.span layoutId="bottom-active" className="absolute -top-2 h-0.5 w-6 rounded-full bg-accent" />}
        <Icon size={20} strokeWidth={1.9} />
        {item.label}
        {badge && <span className="absolute right-4 top-1 h-2 w-2 rounded-full bg-warn" />}
      </button>
    </li>
  )
}
