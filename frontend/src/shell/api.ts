/**
 * Запросы к бэкенду (/api). Токен входа хранится в localStorage и добавляется в каждый запрос.
 * Ответ 401 = вход истёк или сотрудника отключили: токен стирается, оболочка показывает экран входа.
 */

const TOKEN_KEY = 'clinic.token'
export const LOGOUT_EVENT = 'clinic:logout'

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* хранилище может быть недоступно (приватный режим) — вход живёт до перезагрузки */
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiFetch<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init
  const headers = new Headers(rest.headers)
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (json !== undefined) headers.set('Content-Type', 'application/json')

  let res: Response
  try {
    res = await fetch(`/api${path}`, { ...rest, headers, body: json !== undefined ? JSON.stringify(json) : rest.body })
  } catch {
    throw new ApiError(0, 'Нет связи с сервером')
  }

  if (res.status === 401 && token) {
    setToken(null)
    window.dispatchEvent(new Event(LOGOUT_EVENT))
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const detail = body?.detail
    // 422 от FastAPI — список ошибок полей
    const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? 'Проверьте заполнение полей' : `Ошибка сервера (${res.status})`
    throw new ApiError(res.status, msg)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}
