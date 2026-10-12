import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { apiFetch, getToken, LOGOUT_EVENT, setToken } from './api'
import type { ModuleId } from './modules'

export type Level = 'view' | 'edit'
export type Role = 'director' | 'admin' | 'nurse' | 'staff'

export interface User {
  id: number
  login: string
  name: string
  role: Role
  is_director: boolean
  is_active: boolean
  /** Итоговые права: у директора edit на всё */
  permissions: Partial<Record<ModuleId, Level>>
}

// eslint-disable-next-line react-refresh/only-export-components
export const ROLE_LABEL: Record<Role, string> = {
  director: 'Директор',
  admin: 'Администратор',
  nurse: 'Старшая медсестра',
  staff: 'Сотрудник',
}

/**
 * Демо-режим: без бэкенда и входа, все разделы открыты, данные в памяти браузера.
 * Включён в однофайловой сборке (`npm run build:single`, её заливаем на sklad.petr-ai.ru)
 * и при VITE_DEMO=1.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const DEMO = import.meta.env.MODE === 'single' || import.meta.env.VITE_DEMO === '1'

const DEMO_USER: User = {
  id: 0,
  login: 'demo',
  name: 'Артём',
  role: 'director',
  is_director: true,
  is_active: true,
  permissions: { dashboard: 'edit', sklad: 'edit', razgovory: 'edit' },
}

interface AuthCtx {
  /** null — не вошёл; undefined — ещё проверяем сохранённый вход */
  user: User | null | undefined
  login: (login: string, password: string) => Promise<void>
  logout: () => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(() => (DEMO ? DEMO_USER : getToken() ? undefined : null))

  useEffect(() => {
    if (DEMO || !getToken()) return
    apiFetch<User>('/auth/me').then(setUser, () => setUser(null))
  }, [])

  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener(LOGOUT_EVENT, onLogout)
    return () => window.removeEventListener(LOGOUT_EVENT, onLogout)
  }, [])

  const login = useCallback(async (login: string, password: string) => {
    const res = await apiFetch<{ token: string; user: User }>('/auth/login', { method: 'POST', json: { login, password } })
    setToken(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  return <Ctx.Provider value={{ user, login, logout }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}

/** Текущий сотрудник внутри оболочки (там он всегда есть) */
// eslint-disable-next-line react-refresh/only-export-components
export function useUser(): User {
  const { user } = useAuth()
  if (!user) throw new Error('useUser: нет входа')
  return user
}
