import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useData } from '../../context/DataContext'
import { SEVERITY } from '../../lib/status'
import type { AppNotification, Severity } from '../../types'
import { SeverityIcon } from '../ui'

type Filter = 'all' | Severity

export function NotificationList({ items, compact }: { items: AppNotification[]; compact?: boolean }) {
  return (
    <ul className="flex flex-col gap-1">
      <AnimatePresence initial={false}>
        {items.map((n) => (
          <motion.li
            key={n.id}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className={clsx(
              'flex gap-3 rounded-xl p-2.5 transition-colors hover:bg-white/[0.03]',
              n.severity === 'alarm' && 'bg-crit/[0.06] ring-1 ring-inset ring-crit/25',
              n.severity === 'ai' && !compact && 'bg-ai/[0.04]',
            )}
          >
            <SeverityIcon severity={n.severity} size={15} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className={clsx('text-[13px] font-medium', SEVERITY[n.severity].text)}>{n.title}</span>
                <span className="shrink-0 font-mono text-[11px] text-fg-3">{n.time}</span>
              </div>
              <p className={clsx('mt-0.5 text-[13px] leading-snug text-fg-2', compact && 'line-clamp-2')}>{n.text}</p>
            </div>
            {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-label="Не прочитано" />}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  )
}

export function NotificationCenter({ onClose }: { onClose: () => void }) {
  const { notifications, markAllRead } = useData()
  const [filter, setFilter] = useState<Filter>('all')
  const items = filter === 'all' ? notifications : notifications.filter((n) => n.severity === filter)
  const filters: { v: Filter; l: string }[] = [
    { v: 'all', l: 'Все' }, { v: 'alarm', l: 'Тревоги' }, { v: 'warning', l: 'Предупреждения' }, { v: 'ai', l: 'AI' }, { v: 'info', l: 'Инфо' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="glass-strong absolute right-0 top-12 z-50 w-[min(420px,calc(100vw-32px))] p-3"
      role="dialog"
      aria-label="Центр уведомлений"
    >
      <div className="flex items-center justify-between px-1 pb-2">
        <h3 className="text-sm font-semibold">Уведомления</h3>
        <button type="button" onClick={() => { markAllRead(); onClose() }} className="text-xs text-accent hover:underline">
          Прочитать все
        </button>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5 px-1">
        {filters.map((f) => (
          <button
            key={f.v}
            type="button"
            onClick={() => setFilter(f.v)}
            className={clsx('rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors', filter === f.v ? 'bg-white/10 text-fg' : 'text-fg-3 hover:text-fg-2')}
          >
            {f.l}
          </button>
        ))}
      </div>
      <div className="max-h-[60vh] overflow-y-auto pr-1">
        {items.length ? <NotificationList items={items} /> : <p className="p-6 text-center text-sm text-fg-3">Нет уведомлений этого типа</p>}
      </div>
    </motion.div>
  )
}
