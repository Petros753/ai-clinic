import * as mock from '../data/mock'
import type {
  AppNotification,
  Camera,
  CameraInsight,
  ClinicOverview,
  ReportData,
  Room,
  SecurityEvent,
} from '../types'

/**
 * Слой доступа к данным.
 *
 * Сейчас все функции отдают mock-данные с имитацией сетевой задержки.
 * Чтобы подключить реальный backend, задайте VITE_API_URL в .env —
 * функции начнут ходить в REST API с теми же контрактами (типы в src/types).
 *
 *   GET  /overview          → ClinicOverview
 *   GET  /rooms             → Room[]
 *   GET  /cameras           → Camera[]
 *   GET  /security/events   → { day, items: SecurityEvent[] }[]
 *   GET  /security/insights → CameraInsight[]
 *   GET  /notifications     → AppNotification[]
 *   GET  /reports           → ReportData[]
 *   POST /assistant/ask     → { answer: string }
 */

const API_URL: string | undefined = import.meta.env.VITE_API_URL

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function get<T>(path: string, fallback: () => T): Promise<T> {
  if (!API_URL) {
    await delay(250)
    return structuredClone(fallback())
  }
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`)
  return (await res.json()) as T
}

export const api = {
  overview: () => get<ClinicOverview>('/overview', () => mock.clinic),
  rooms: () => get<Room[]>('/rooms', () => mock.rooms),
  cameras: () => get<Camera[]>('/cameras', () => mock.cameras),
  securityEvents: () =>
    get<{ day: string; items: SecurityEvent[] }[]>('/security/events', () => mock.securityEvents),
  cameraInsights: () => get<CameraInsight[]>('/security/insights', () => mock.cameraInsights),
  notifications: () => get<AppNotification[]>('/notifications', () => mock.notifications),
  reports: () => get<ReportData[]>('/reports', () => mock.reports),

  /** AI-ассистент. В проде — POST на backend с LLM (RAG по событиям и телеметрии клиники). */
  async ask(question: string): Promise<string> {
    if (!API_URL) {
      await delay(700 + Math.random() * 500)
      return mock.aiAnswers[question] ?? matchAnswer(question)
    }
    const res = await fetch(`${API_URL}/assistant/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })
    if (!res.ok) throw new Error(`Assistant: ${res.status}`)
    const data = (await res.json()) as { answer: string }
    return data.answer
  },
}

/** Простой подбор готового ответа по ключевым словам (только для демо). */
function matchAnswer(q: string): string {
  const s = q.toLowerCase()
  const rules: [RegExp, string][] = [
    [/темп|климат|жарк|кондиц|холод/, 'Где были проблемы с климатом?'],
    [/камер|видео|связ/, 'Какие камеры отключались?'],
    [/трев|ноч|охран|движен/, 'Были ли тревоги ночью?'],
    [/загруж|загрузк|кабинет|занят/, 'Какие кабинеты были загружены больше всего?'],
    [/недел|сравн|прошл/, 'Сравни эту неделю с прошлой'],
    [/отч[её]т/, 'Подготовь отчёт за день'],
    [/внимани|проблем|риск|провер/, 'Что требует внимания?'],
    [/необычн|сегодня|что было|итог/, 'Что необычного было сегодня?'],
  ]
  const hit = rules.find(([re]) => re.test(s))
  return hit ? mock.aiAnswers[hit[1]] : mock.aiFallback(q)
}
