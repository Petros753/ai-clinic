import clsx from 'clsx'
import { AnimatePresence } from 'framer-motion'
import { Bell, Menu, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useData } from '../../context/DataContext'
import { fmtDate, fmtTime, useClock } from '../../hooks/useClock'
import { NotificationCenter } from '../notifications/NotificationCenter'

export function Topbar({ onMenu, onAssistant }: { onMenu: () => void; onAssistant: () => void }) {
  const { overview, alarm, unread } = useData()
  const now = useClock()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('keydown', k)
    }
  }, [open])

  return (
    <header className="sticky top-[var(--shell-h)] z-40 border-b border-line bg-ink-950/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button type="button" onClick={onMenu} className="grid h-9 w-9 place-items-center rounded-lg text-fg-2 hover:bg-white/5 lg:hidden" aria-label="Открыть меню">
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-fg">{overview.name}</div>
          <div className="truncate text-xs capitalize text-fg-3">
            {fmtDate(now)} · <span className="num font-mono normal-case text-fg-2">{fmtTime(now)}</span>
          </div>
        </div>

        <div className="ml-4 hidden items-center gap-2 md:flex">
          <span className="inline-flex items-center gap-2 rounded-full border border-ok/25 bg-ok/10 px-3 py-1 text-xs font-medium text-ok">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            {overview.open ? 'Клиника открыта' : 'Клиника закрыта'}
          </span>
          <span
            className={clsx(
              'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium',
              alarm ? 'alarm-pulse border-crit/40 bg-crit/15 text-crit' : 'border-line bg-white/[0.03] text-fg-2',
            )}
          >
            <span className={clsx('h-1.5 w-1.5 rounded-full', alarm ? 'bg-crit' : 'bg-ok')} />
            {alarm ? 'Тревога: хранение отходов' : 'Все системы работают'}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={onAssistant}
            className="hidden items-center gap-2 rounded-xl border border-ai/25 bg-ai/10 px-3 py-2 text-sm font-medium text-ai transition hover:bg-ai/15 sm:inline-flex"
          >
            <Sparkles size={16} />
            Спросить AI
          </button>
          <button type="button" onClick={onAssistant} className="grid h-9 w-9 place-items-center rounded-lg text-ai hover:bg-white/5 sm:hidden" aria-label="Спросить AI">
            <Sparkles size={18} />
          </button>

          <div ref={ref} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="relative grid h-9 w-9 place-items-center rounded-lg text-fg-2 transition hover:bg-white/5 hover:text-fg"
              aria-label={`Уведомления, непрочитанных: ${unread}`}
              aria-expanded={open}
            >
              <Bell size={19} strokeWidth={1.8} />
              {unread > 0 && (
                <span className={clsx('absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold text-ink-950', alarm ? 'bg-crit text-white' : 'bg-accent')}>
                  {unread}
                </span>
              )}
            </button>
            <AnimatePresence>{open && <NotificationCenter onClose={() => setOpen(false)} />}</AnimatePresence>
          </div>

          <div className="ml-1 hidden items-center gap-2.5 border-l border-line pl-3 sm:flex">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-[#2b3c55] to-[#1a2536] text-[11px] font-semibold ring-1 ring-white/10">
              {overview.director.initials}
            </div>
            <div className="hidden leading-tight xl:block">
              <div className="text-xs font-medium">{overview.director.name}</div>
              <div className="text-[11px] text-fg-3">Директор</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
