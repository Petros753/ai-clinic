import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Sparkles } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { api } from '../../api/client'
import { quickQuestions } from '../../data/mock'
import type { ChatMessage } from '../../types'
import { RichText } from '../ui'

// ── Состояние чата общее для страницы и боковой панели ─────────
interface ChatCtx {
  messages: ChatMessage[]
  thinking: boolean
  typingId: string | null
  ask: (q: string) => void
  doneTyping: () => void
}
const Ctx = createContext<ChatCtx | null>(null)

const GREETING: ChatMessage = {
  id: 'hello',
  role: 'ai',
  text: 'Здравствуйте, Артём. Я слежу за состоянием клиники, камерами и климатом. Спросите меня о чём угодно — например, **что требует внимания сегодня**.',
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [thinking, setThinking] = useState(false)
  const [typingId, setTypingId] = useState<string | null>(null)

  const ask = useCallback((q: string) => {
    const text = q.trim()
    if (!text) return
    setMessages((m) => [...m, { id: `u${Date.now()}`, role: 'user', text }])
    setThinking(true)
    api
      .ask(text)
      .then((answer) => {
        const id = `a${Date.now()}`
        setMessages((m) => [...m, { id, role: 'ai', text: answer }])
        setTypingId(id)
      })
      .catch(() => setMessages((m) => [...m, { id: `e${Date.now()}`, role: 'ai', text: 'Не удалось получить ответ. Проверьте подключение к серверу клиники и повторите вопрос.' }]))
      .finally(() => setThinking(false))
  }, [])

  return (
    <Ctx.Provider value={{ messages, thinking, typingId, ask, doneTyping: () => setTypingId(null) }}>
      {children}
    </Ctx.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAssistant = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAssistant outside provider')
  return c
}

// ── Печатающийся текст ─────────────────────────────────────────
export function TypingText({ text, speed = 14, onDone, className }: { text: string; speed?: number; onDone?: () => void; className?: string }) {
  const [n, setN] = useState(0)
  const done = useRef(false)
  useEffect(() => {
    setN(0)
    done.current = false
    const step = Math.max(1, Math.round(text.length / 220))
    const t = setInterval(() => {
      setN((v) => {
        const next = Math.min(text.length, v + step)
        if (next >= text.length && !done.current) {
          done.current = true
          clearInterval(t)
          setTimeout(() => onDone?.(), 0)
        }
        return next
      })
    }, speed)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])
  let shown = text.slice(0, n)
  if ((shown.match(/\*\*/g)?.length ?? 0) % 2) shown += '**'
  return (
    <div className={clsx(n < text.length && 'caret', className)}>
      <RichText text={shown} />
    </div>
  )
}

function Thinking() {
  return (
    <div className="flex items-center gap-2 text-sm text-fg-3">
      <span className="ai-shimmer font-medium">Анализирую данные клиники</span>
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-ai" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }} />
        ))}
      </span>
    </div>
  )
}

export function AiAvatar({ size = 30 }: { size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#a898ff] to-[#5a8cff] text-white shadow-[0_0_18px_-4px_rgba(157,140,255,0.8)]" style={{ width: size, height: size }}>
      <Sparkles size={size * 0.5} strokeWidth={2} />
    </span>
  )
}

// ── Чат ────────────────────────────────────────────────────────
export function AssistantChat({ variant = 'page' }: { variant?: 'page' | 'panel' }) {
  const { messages, thinking, typingId, ask, doneTyping } = useAssistant()
  const [input, setInput] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const busy = thinking || typingId !== null

  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const id = setInterval(() => (el.scrollTop = el.scrollHeight), 120)
    el.scrollTop = el.scrollHeight
    const stop = setTimeout(() => clearInterval(id), typingId ? 6000 : 300)
    return () => {
      clearInterval(id)
      clearTimeout(stop)
    }
  }, [messages.length, thinking, typingId])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (busy) return
    ask(input)
    setInput('')
  }
  const onlyGreeting = messages.length === 1

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scroller} className={clsx('min-h-0 flex-1 space-y-5 overflow-y-auto', variant === 'page' ? 'px-1 py-2' : 'px-4 py-4')}>
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className={clsx('flex gap-3', m.role === 'user' && 'justify-end')}>
              {m.role === 'ai' && <AiAvatar />}
              <div
                className={clsx(
                  'max-w-[min(640px,85%)] text-[14px] leading-relaxed',
                  m.role === 'user'
                    ? 'rounded-2xl rounded-br-md border border-accent/20 bg-accent/10 px-4 py-2.5 text-fg'
                    : 'rounded-2xl rounded-tl-md border border-line bg-white/[0.03] px-4 py-3 text-fg-2',
                )}
              >
                {m.role === 'ai' && m.id === typingId ? <TypingText text={m.text} onDone={doneTyping} /> : <RichText text={m.text} />}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {thinking && (
          <div className="flex gap-3">
            <AiAvatar />
            <div className="rounded-2xl rounded-tl-md border border-line bg-white/[0.03] px-4 py-3"><Thinking /></div>
          </div>
        )}
      </div>

      <div className={clsx('shrink-0 space-y-3', variant === 'page' ? 'pt-3' : 'border-t border-line p-4')}>
        <div className={clsx('flex gap-2', onlyGreeting || variant === 'page' ? 'flex-wrap' : 'overflow-x-auto pb-1')}>
          {quickQuestions.map((q) => (
            <button
              key={q}
              type="button"
              disabled={busy}
              onClick={() => ask(q)}
              className="shrink-0 rounded-full border border-line bg-white/[0.03] px-3 py-1.5 text-xs text-fg-2 transition hover:border-ai/40 hover:bg-ai/10 hover:text-fg disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="flex items-center gap-2 rounded-2xl border border-line bg-ink-900/80 p-1.5 pl-4 transition focus-within:border-ai/50 focus-within:shadow-[0_0_0_4px_rgba(157,140,255,0.08)]">
          <Sparkles size={16} className="shrink-0 text-ai" />
          <label htmlFor={`ask-${variant}`} className="sr-only">Вопрос AI</label>
          <input
            id={`ask-${variant}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Спросить AI о клинике…"
            className="min-w-0 flex-1 bg-transparent py-2 text-sm text-fg placeholder:text-fg-3 focus:outline-none"
            autoComplete="off"
          />
          <button type="submit" disabled={busy || !input.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#a898ff] to-[#6f5ce6] text-white transition hover:brightness-110 disabled:opacity-30" aria-label="Отправить">
            <ArrowUp size={17} />
          </button>
        </form>
      </div>
    </div>
  )
}
