import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, CheckCheck, CloudOff, ScanBarcode, Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useData } from '../../context/DataContext'
import { useUi } from '../../context/UiContext'
import { fmtDate, fmtTime, useClock } from '../../hooks/useClock'
import { LEVEL, level, SEVERITY } from '../../lib/stock'
import { StatusDot } from '../ui'

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => {
      document.removeEventListener('mousedown', h)
      document.removeEventListener('keydown', k)
    }
  }, [open, close])
  return ref
}

export function Topbar() {
  const { clinic, unread, lowCount, outCount, queued } = useData()
  const { navigate } = useUi()
  const now = useClock()
  const [open, setOpen] = useState(false)
  const ref = useOutside(open, () => setOpen(false))
  const problems = lowCount + outCount

  return (
    <header className="sticky top-[var(--shell-h)] z-40 border-b border-line bg-ink-950/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <div className="min-w-0 shrink-0">
          <div className="truncate text-sm font-semibold text-fg">{clinic.name} · склад</div>
          <div className="truncate text-xs capitalize text-fg-3">
            <span className="hidden sm:inline">{fmtDate(now)}</span>
            <span className="sm:hidden">{now.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span> · <span className="num font-mono normal-case text-fg-2">{fmtTime(now)}</span>
          </div>
        </div>

        {problems > 0 && (
          <button
            type="button"
            onClick={() => navigate('orders')}
            className={clsx(
              'ml-2 hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition hover:brightness-125 md:inline-flex',
              outCount ? 'border-crit/35 bg-crit/10 text-crit' : 'border-warn/30 bg-warn/10 text-warn',
            )}
          >
            <span className={clsx('h-1.5 w-1.5 rounded-full', outCount ? 'bg-crit' : 'bg-warn')} />
            {outCount ? `Закончилось: ${outCount} · мало: ${lowCount}` : `Заканчивается: ${lowCount}`}
          </button>
        )}

        {queued > 0 && (
          <button
            type="button"
            onClick={() => navigate('movements')}
            title="Операции сохранены в браузере и уйдут на сервер, когда появится связь"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-warn/30 bg-warn/10 px-3 py-1 text-xs font-medium text-warn"
          >
            <CloudOff size={13} />
            <span className="hidden sm:inline">Нет связи · в очереди:</span> {queued}
          </button>
        )}

        <div className="mx-2 hidden min-w-0 max-w-sm flex-1 lg:block"><GlobalSearch /></div>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate('scan')}
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-b from-[#6fd0ff] to-[#3a9df0] px-3.5 py-2 text-sm font-medium text-ink-950 shadow-[0_8px_24px_-10px_rgba(92,200,255,0.7)] transition hover:brightness-110 sm:inline-flex"
          >
            <ScanBarcode size={16} />
            Сканировать
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
                <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold text-ink-950">{unread}</span>
              )}
            </button>
            <AnimatePresence>{open && <Notifications />}</AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}

function Notifications() {
  const { notifications, markAllRead } = useData()
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.16 }}
      className="glass-strong fixed inset-x-3 top-[calc(68px_+_var(--shell-h))] z-50 max-h-[70vh] overflow-hidden sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-[380px]"
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="text-sm font-semibold">Уведомления</div>
        <button type="button" onClick={markAllRead} className="inline-flex items-center gap-1.5 text-xs text-fg-2 hover:text-fg">
          <CheckCheck size={14} /> Прочитать все
        </button>
      </div>
      <ul className="max-h-[60vh] divide-y divide-line overflow-y-auto">
        {notifications.map((n) => {
          const s = SEVERITY[n.severity]
          const Icon = s.icon
          return (
            <li key={n.id} className={clsx('flex gap-3 px-4 py-3', !n.read && 'bg-white/[0.025]')}>
              <span className={clsx('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg', s.bg, s.text)}><Icon size={15} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-medium leading-snug text-fg">{n.title}</div>
                  <span className="shrink-0 text-[11px] text-fg-3">{n.time}</span>
                </div>
                <div className="mt-0.5 text-xs leading-relaxed text-fg-2">{n.text}</div>
              </div>
              {!n.read && <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
            </li>
          )
        })}
      </ul>
    </motion.div>
  )
}

function GlobalSearch() {
  const { items } = useData()
  const { openItem } = useUi()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useOutside(open, () => setOpen(false))
  const hits = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return []
    return items.filter((i) => `${i.name} ${i.brand} ${i.sku} ${i.barcode}`.toLowerCase().includes(s)).slice(0, 7)
  }, [q, items])

  return (
    <div ref={ref} className="relative">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        placeholder="Поиск: название, артикул, штрихкод"
        className="h-9 w-full rounded-xl border border-line bg-white/[0.03] pl-9 pr-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-accent/40"
      />
      {open && hits.length > 0 && (
        <ul className="glass-strong absolute inset-x-0 top-11 z-50 overflow-hidden p-1">
          {hits.map((i) => (
            <li key={i.id}>
              <button
                type="button"
                onClick={() => { openItem(i.id); setOpen(false); setQ('') }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/[0.05]"
              >
                <StatusDot status={level(i)} />
                <span className="min-w-0 flex-1 truncate text-sm">{i.name}</span>
                <span className={clsx('num shrink-0 text-xs', LEVEL[level(i)].text)}>{i.stock} {i.unit}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
