import clsx from 'clsx'
import { motion } from 'framer-motion'
import {
  Cctv, ChartColumn, DoorOpen, FileText, LayoutDashboard, Settings, ShieldCheck, Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useData } from '../../context/DataContext'
import type { PageId } from '../../types'

export const NAV: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Главная', icon: LayoutDashboard },
  { id: 'rooms', label: 'Помещения', icon: DoorOpen },
  { id: 'security', label: 'Безопасность', icon: ShieldCheck },
  { id: 'cameras', label: 'Камеры', icon: Cctv },
  { id: 'analytics', label: 'Аналитика', icon: ChartColumn },
  { id: 'reports', label: 'Отчёты', icon: FileText },
  { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
  { id: 'settings', label: 'Настройки', icon: Settings },
]

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-[#1b2a3d] to-[#0e1622] shadow-[0_0_24px_-6px_rgba(92,200,255,0.5)]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#5cc8ff" strokeWidth="1.6" strokeLinejoin="round" aria-hidden>
          <path d="M6.5 8.5c0-2.6 1.7-3.5 3.3-3.5 1.2 0 1.6.6 2.2.6s1-.6 2.2-.6c1.6 0 3.3.9 3.3 3.5 0 3.3-1.2 4.2-1.6 7.5-.2 1.7-.8 3-1.7 3s-1.1-1.2-1.3-2.5c-.3-1.4-.5-2-.9-2s-.6.6-.9 2c-.2 1.3-.4 2.5-1.3 2.5s-1.5-1.3-1.7-3c-.4-3.3-1.6-4.2-1.6-7.5z" />
        </svg>
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-ink-900 bg-ai" />
      </div>
      <div className="leading-tight">
        <div className="text-[15px] font-semibold text-fg">Smart Clinic</div>
        <div className="text-[11px] text-fg-3">AI-центр директора</div>
      </div>
    </div>
  )
}

export function Sidebar({ page, onNavigate }: { page: PageId; onNavigate: (p: PageId) => void }) {
  const { overview, alarm, unread } = useData()
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
                <Icon size={18} strokeWidth={1.8} className={clsx('relative', active ? (item.id === 'assistant' ? 'text-ai' : 'text-accent') : '')} />
                <span className="relative flex-1 text-left">{item.label}</span>
                {item.id === 'security' && alarm && (
                  <span className="alarm-pulse relative rounded-full bg-crit px-1.5 text-[10px] font-semibold text-white">1</span>
                )}
                {item.id === 'home' && unread > 0 && !active && (
                  <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
                )}
                {item.id === 'assistant' && (
                  <span className="relative rounded-md bg-ai/15 px-1.5 py-0.5 text-[10px] font-semibold text-ai">AI</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto space-y-3">
        <div className={clsx('rounded-xl border p-3', alarm ? 'border-crit/30 bg-crit/[0.07]' : 'border-line bg-white/[0.02]')}>
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className={clsx('ring-pulse absolute inset-0 rounded-full', alarm ? 'bg-crit' : 'bg-ok')} />
              <span className={clsx('relative h-2 w-2 rounded-full', alarm ? 'bg-crit' : 'bg-ok')} />
            </span>
            <span className={alarm ? 'text-crit' : 'text-fg'}>{alarm ? 'Активная тревога' : 'Все системы работают'}</span>
          </div>
          <div className="mt-1.5 text-[11px] text-fg-3">Датчики 48/48 · камеры 10/10 · контроллер онлайн</div>
        </div>

        <div className="flex items-center gap-3 rounded-xl px-2 py-1">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#2b3c55] to-[#1a2536] text-xs font-semibold text-fg ring-1 ring-white/10">
            {overview.director.initials}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-sm font-medium text-fg">{overview.director.name}</div>
            <div className="truncate text-[11px] text-fg-3">{overview.director.role}</div>
          </div>
        </div>
        <div className="px-2 font-mono text-[10px] text-fg-3">{overview.version}</div>
      </div>
    </nav>
  )
}
