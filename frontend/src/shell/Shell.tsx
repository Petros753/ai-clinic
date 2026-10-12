import clsx from 'clsx'
import { motion } from 'framer-motion'
import { LogOut, Users } from 'lucide-react'
import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { DEMO, ROLE_LABEL, useAuth, useUser } from './auth'
import Login from './Login'
import { DEFAULT_MODULE, MODULES } from './modules'
import type { ModuleDef, ModuleId } from './modules'

const Staff = lazy(() => import('./Staff'))

/** Что на экране: раздел или страница «Сотрудники» (только директору) */
type View = ModuleId | 'staff'

/** Экран из адреса: #/sklad/orders → 'sklad'. Разделы без прав и чужие страницы не открываются */
const readView = (modules: ModuleDef[], director: boolean): View | null => {
  const id = window.location.hash.replace(/^#\/?/, '').split('/')[0]
  if (id === 'staff' && director && !DEMO) return 'staff'
  return modules.find((m) => m.id === id)?.id ?? null
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

/** Вход: пока проверяем сохранённый токен — загрузка, без входа — форма, дальше оболочка */
export default function AuthGate() {
  const { user } = useAuth()
  if (user === undefined) return <Loading />
  if (user === null) return <Login />
  // key: другой сотрудник — чистая оболочка, без разделов в памяти от предыдущего
  return <Shell key={user.id} />
}

function Shell() {
  const user = useUser()
  const { logout } = useAuth()
  /** Вкладки — только разделы, к которым есть доступ (API всё равно проверяет права сам) */
  const modules = useMemo(() => MODULES.filter((m) => user.permissions[m.id]), [user])
  const fallback: View | null = modules.some((m) => m.id === DEFAULT_MODULE) ? DEFAULT_MODULE : modules[0]?.id ?? (user.is_director ? 'staff' : null)

  const [current, setCurrent] = useState<View | null>(() => {
    const v = readView(modules, user.is_director)
    if (v || !fallback) return v ?? fallback
    // В адресе недоступный раздел — переписываем сразу, до того как раздел прочтёт адрес
    try {
      window.history.replaceState(null, '', `#/${fallback}`)
    } catch {
      /* в песочнице изменение адреса может быть запрещено */
    }
    return fallback
  })
  /** Открытые разделы остаются в памяти (скрытыми): остатки склада и выбранный приём не сбрасываются при переключении */
  const opened = useRef(new Set<View>())
  if (current) opened.current.add(current)
  /** Последний адрес каждого раздела, чтобы вернуться на ту же страницу внутри него */
  const lastHash = useRef<Partial<Record<View, string>>>({})

  useEffect(() => {
    const onHash = () => {
      const v = readView(modules, user.is_director)
      if (v) setCurrent(v)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [modules, user.is_director])

  useEffect(() => {
    const title = current === 'staff' ? 'Сотрудники' : MODULES.find((m) => m.id === current)?.title
    document.title = title ? `Smart Clinic · ${title}` : 'Smart Clinic'
    window.scrollTo({ top: 0 })
  }, [current])

  const go = useCallback((id: View) => {
    if (id === current) return
    if (current) lastHash.current[current] = window.location.hash
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
            {modules.map((m) => {
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

          <div className="ml-auto flex shrink-0 items-center gap-1">
            {user.is_director && !DEMO && (
              <button
                type="button"
                onClick={() => go('staff')}
                aria-current={current === 'staff' ? 'page' : undefined}
                title="Сотрудники и доступ"
                className={clsx('inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors', current === 'staff' ? 'bg-white/[0.07] text-fg' : 'text-fg-3 hover:text-fg-2')}
              >
                <Users size={15} />
                <span className="hidden lg:inline">Сотрудники</span>
              </button>
            )}
            <div className="hidden px-2 text-right leading-tight md:block">
              <div className="text-xs font-medium text-fg">{user.name}</div>
              <div className="text-[11px] text-fg-3">{ROLE_LABEL[user.role]}</div>
            </div>
            {!DEMO && (
              <button type="button" onClick={logout} title="Выйти" className="rounded-lg p-2 text-fg-3 transition-colors hover:bg-white/5 hover:text-fg">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {current === null && (
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="text-lg font-semibold text-fg">Нет доступа ни к одному разделу</div>
          <p className="mt-2 text-sm text-fg-2">Попросите директора выдать права в разделе «Сотрудники».</p>
        </div>
      )}

      {current === 'staff' && (
        <Boundary>
          <Suspense fallback={<Loading />}>
            <Staff />
          </Suspense>
        </Boundary>
      )}

      {modules.filter((m) => opened.current.has(m.id)).map((m) => (
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
