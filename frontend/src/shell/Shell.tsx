import clsx from 'clsx'
import { motion } from 'framer-motion'
import { Component, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { DEFAULT_MODULE, MODULES } from './modules'
import type { ModuleId } from './modules'

/** Раздел из адреса: #/sklad/orders → 'sklad' */
const readModule = (): ModuleId | null => {
  const id = window.location.hash.replace(/^#\/?/, '').split('/')[0]
  return MODULES.find((m) => m.id === id)?.id ?? null
}

/** Падение одного раздела не должно ронять всё приложение */
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="text-lg font-semibold text-fg">Раздел не загрузился</div>
        <p className="mt-2 text-sm text-fg-2">Обновите страницу. Если ошибка повторится — сообщите разработчику.</p>
      </div>
    )
  }
}

function Loading() {
  return <div className="grid place-items-center py-32 text-sm text-fg-3">Загрузка…</div>
}

export default function Shell() {
  const [current, setCurrent] = useState<ModuleId>(() => readModule() ?? DEFAULT_MODULE)
  /** Открытые разделы остаются в памяти (скрытыми): остатки склада и выбранный приём не сбрасываются при переключении */
  const opened = useRef(new Set<ModuleId>())
  opened.current.add(current)
  /** Последний адрес каждого раздела, чтобы вернуться на ту же страницу внутри него */
  const lastHash = useRef<Partial<Record<ModuleId, string>>>({})

  useEffect(() => {
    const onHash = () => {
      const m = readModule()
      if (m) setCurrent(m)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.title = `Smart Clinic · ${MODULES.find((m) => m.id === current)!.title}`
    window.scrollTo({ top: 0 })
  }, [current])

  const go = useCallback((id: ModuleId) => {
    if (id === current) return
    lastHash.current[current] = window.location.hash
    try {
      window.location.hash = lastHash.current[id] ?? `#/${id}`
    } catch {
      /* в песочнице изменение адреса может быть запрещено — переключение работает и без него */
    }
    setCurrent(id)
  }, [current])

  return (
    <>
      <header className="sticky top-0 z-50 h-[var(--shell-h)] border-b border-line bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-[1760px] items-center gap-3 px-3 md:px-6">
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="relative grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-gradient-to-br from-[#1b2a3d] to-[#0e1622] shadow-[0_0_20px_-6px_rgba(92,200,255,0.5)]">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="#5cc8ff" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
                <path d="M6.5 8.5c0-2.6 1.7-3.5 3.3-3.5 1.2 0 1.6.6 2.2.6s1-.6 2.2-.6c1.6 0 3.3.9 3.3 3.5 0 3.3-1.2 4.2-1.6 7.5-.2 1.7-.8 3-1.7 3s-1.1-1.2-1.3-2.5c-.3-1.4-.5-2-.9-2s-.6.6-.9 2c-.2 1.3-.4 2.5-1.3 2.5s-1.5-1.3-1.7-3c-.4-3.3-1.6-4.2-1.6-7.5z" />
              </svg>
            </span>
            <span className="hidden text-sm font-semibold text-fg sm:inline">Smart Clinic</span>
          </div>

          <nav className="flex min-w-0 gap-1 rounded-xl border border-line bg-white/[0.02] p-0.5" aria-label="Разделы клиники">
            {MODULES.map((m) => {
              const on = m.id === current
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => go(m.id)}
                  aria-current={on ? 'page' : undefined}
                  className={clsx('relative inline-flex shrink-0 items-center gap-2 rounded-[10px] px-3 py-1.5 text-sm font-medium transition-colors', on ? 'text-fg' : 'text-fg-3 hover:text-fg-2')}
                >
                  {on && <motion.span layoutId="shell-tab" className="absolute inset-0 rounded-[10px] border border-white/10 bg-white/[0.07]" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                  <m.icon size={15} className={clsx('relative hidden sm:block', on && 'text-accent')} />
                  <span className="relative">{m.label}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </header>

      {MODULES.filter((m) => opened.current.has(m.id)).map((m) => (
        <div key={m.id} hidden={m.id !== current}>
          <Boundary>
            <Suspense fallback={<Loading />}>
              <m.component active={m.id === current} />
            </Suspense>
          </Boundary>
        </div>
      ))}
    </>
  )
}
