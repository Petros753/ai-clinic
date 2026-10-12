import { LogIn } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from './auth'

export default function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(form.login.trim(), form.password)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  const input = 'w-full rounded-lg border border-line bg-white/[0.03] px-3 py-2.5 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-accent/50'

  return (
    <div className="grid min-h-full place-items-center px-4 py-12">
      <form onSubmit={submit} className="glass w-full max-w-sm p-6">
        <div className="text-lg font-semibold text-fg">Smart Clinic</div>
        <p className="mt-1 text-sm text-fg-3">Войдите, чтобы продолжить</p>

        <label className="mt-6 block">
          <span className="label">Логин</span>
          <input className={`${input} mt-1.5`} autoComplete="username" autoFocus required value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} />
        </label>
        <label className="mt-4 block">
          <span className="label">Пароль</span>
          <input className={`${input} mt-1.5`} type="password" autoComplete="current-password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>

        {error && <p className="mt-4 text-sm text-crit" role="alert">{error}</p>}

        <button type="submit" disabled={busy} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent-deep px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">
          <LogIn size={16} />
          {busy ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
