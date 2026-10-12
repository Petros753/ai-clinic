import clsx from 'clsx'
import { KeyRound, Power, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { apiFetch } from './api'
import { ROLE_LABEL, useUser } from './auth'
import type { Level, Role, User } from './auth'
import { MODULES } from './modules'
import type { ModuleId } from './modules'

/** Настройки директора: сотрудники и их доступ к разделам (таблица «сотрудники × разделы») */

const LEVELS: { value: Level | ''; label: string }[] = [
  { value: '', label: 'Нет доступа' },
  { value: 'view', label: 'Просмотр' },
  { value: 'edit', label: 'Изменение' },
]
const ROLES = Object.keys(ROLE_LABEL) as Role[]

const field = 'rounded-lg border border-line bg-ink-900 px-2.5 py-1.5 text-sm text-fg outline-none focus:border-accent/50'

export default function Staff() {
  const me = useUser()
  const [users, setUsers] = useState<User[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    apiFetch<User[]>('/users').then(setUsers, (e: Error) => setError(e.message))
  }, [])
  useEffect(load, [load])

  /** Запрос, который возвращает обновлённого сотрудника — подменяем его строку */
  const save = async (req: Promise<User>) => {
    setError(null)
    try {
      const u = await req
      setUsers((list) => list && list.map((x) => (x.id === u.id ? u : x)))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  const setLevel = (u: User, module: ModuleId, level: Level | '') => {
    const permissions = { ...u.permissions }
    if (level) permissions[module] = level
    else delete permissions[module]
    save(apiFetch(`/users/${u.id}/permissions`, { method: 'PUT', json: { permissions } }))
  }
  const patch = (u: User, body: Partial<User> & { password?: string }) =>
    save(apiFetch(`/users/${u.id}`, { method: 'PATCH', json: body }))

  const resetPassword = (u: User) => {
    const password = window.prompt(`Новый пароль для «${u.name}» (от 8 символов):`)
    if (password) patch(u, { password })
  }

  return (
    <div className="mx-auto max-w-[1100px] px-3 py-6 md:px-6">
      <h1 className="text-xl font-semibold text-fg">Сотрудники и доступ</h1>
      <p className="mt-1 text-sm text-fg-3">
        Кто какие разделы видит. «Просмотр» — только смотреть, «Изменение» — ещё и проводить операции. Директор видит всё.
      </p>

      {error && <p className="mt-4 rounded-lg border border-crit/30 bg-crit/10 px-3 py-2 text-sm text-crit" role="alert">{error}</p>}

      <div className="glass mt-5 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              <th className="label px-4 py-3 font-medium">Сотрудник</th>
              <th className="label px-3 py-3 font-medium">Роль</th>
              {MODULES.map((m) => (
                <th key={m.id} className="label px-3 py-3 font-medium">{m.label}</th>
              ))}
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {users === null && (
              <tr><td colSpan={MODULES.length + 3} className="px-4 py-8 text-center text-fg-3">Загрузка…</td></tr>
            )}
            {users?.map((u) => {
              const self = u.id === me.id
              return (
                <tr key={u.id} className={clsx('border-b border-line last:border-0', !u.is_active && 'opacity-50')}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-fg">{u.name}{self && <span className="ml-1.5 text-fg-3">(вы)</span>}</div>
                    <div className="text-xs text-fg-3">{u.login}{!u.is_active && ' · отключён'}</div>
                  </td>
                  <td className="px-3 py-3">
                    <select className={field} value={u.role} disabled={self} onChange={(e) => patch(u, { role: e.target.value as Role })} aria-label={`Роль: ${u.name}`}>
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  </td>
                  {MODULES.map((m) => (
                    <td key={m.id} className="px-3 py-3">
                      {u.is_director ? (
                        <span className="text-fg-2">Всё</span>
                      ) : (
                        <select className={field} value={u.permissions[m.id] ?? ''} onChange={(e) => setLevel(u, m.id, e.target.value as Level | '')} aria-label={`${m.label}: ${u.name}`}>
                          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                      )}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <button type="button" onClick={() => resetPassword(u)} title="Сменить пароль" className="rounded-lg p-2 text-fg-3 hover:bg-white/5 hover:text-fg">
                      <KeyRound size={16} />
                    </button>
                    {!self && (
                      <button type="button" onClick={() => patch(u, { is_active: !u.is_active })} title={u.is_active ? 'Отключить' : 'Включить'} className="rounded-lg p-2 text-fg-3 hover:bg-white/5 hover:text-fg">
                        <Power size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <NewUser onCreated={(u) => setUsers((list) => [...(list ?? []), u])} />
    </div>
  )
}

function NewUser({ onCreated }: { onCreated: (u: User) => void }) {
  const empty = { name: '', login: '', role: 'nurse' as Role, password: '' }
  const [form, setForm] = useState(empty)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      onCreated(await apiFetch<User>('/users', { method: 'POST', json: form }))
      setForm(empty)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <form onSubmit={submit} className="glass mt-5 p-4">
      <div className="text-sm font-medium text-fg">Новый сотрудник</div>
      <p className="mt-0.5 text-xs text-fg-3">Права по роли: администратор — «Разговоры», старшая медсестра — «Склад». Потом можно поменять в таблице.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <input className={field} placeholder="Имя" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className={field} placeholder="Логин (латиницей)" required pattern="[a-zA-Z0-9_.\-]{2,64}" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
        <select className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} aria-label="Роль">
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <input className={field} placeholder="Пароль (от 8 символов)" type="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-deep px-4 py-1.5 text-sm font-medium text-white hover:opacity-90">
          <UserPlus size={15} /> Добавить
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-crit" role="alert">{error}</p>}
    </form>
  )
}
