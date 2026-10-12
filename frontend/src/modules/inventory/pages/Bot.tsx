import clsx from 'clsx'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Camera, ChevronLeft, Minus, Search, ShoppingCart, UserCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader, PageHeader } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { DEMO } from '../../../shell/auth'
import { useData } from '../context/DataContext'
import { rooms } from '../data/catalog'
import { daysLeft, fmtDays, fmtRub, level, orderLine, supplierOf } from '../lib/stock'
import type { Item } from '../types'

interface Msg {
  id: string
  from: 'bot' | 'me'
  text: string
  time: string
  /** inline-кнопки под сообщением бота */
  actions?: { label: string; run: () => void }[]
}

const t = () => new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
let seq = 0
const mid = () => `b${++seq}`

// Чат живёт между переходами по страницам (кнопки старых сообщений снимаем —
// их обработчики принадлежат прошлому экземпляру страницы).
let savedChat: Msg[] | null = null
const seenGlobal = new Set(['n1', 'n2', 'n3', 'n4', 'n5'])

/**
 * Превью Telegram-бота на живых данных демо. В проде это aiogram-бот
 * на том же backend: те же позиции, тот же журнал, те же пороги.
 */
export function BotPage() {
  const { items, notifications, toOrder, move, byId } = useData()
  const toast = useToast()
  const [msgs, setMsgs] = useState<Msg[]>(() => savedChat?.map(({ actions: _a, ...m }) => m) ?? [
    { id: mid(), from: 'bot', time: '09:00', text: '👋 Доброе утро! Я бот склада Smart Clinic.\n\nПишу, когда что-то заканчивается или истекает срок, и помогаю выдать расходники без компьютера.' },
  ])
  const [typing, setTyping] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const seenNotif = useRef(seenGlobal)

  useEffect(() => {
    savedChat = msgs
  }, [msgs])

  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' })
  }, [msgs, typing])

  // push-уведомления из панели → в чат
  useEffect(() => {
    const fresh = notifications.filter((n) => !seenNotif.current.has(n.id) && (n.severity === 'alarm' || n.severity === 'warning'))
    fresh.forEach((n) => seenNotif.current.add(n.id))
    if (fresh.length) setMsgs((m) => [...m, ...fresh.map((n) => ({ id: mid(), from: 'bot' as const, time: t(), text: `${n.severity === 'alarm' ? '🔴' : '🟡'} ${n.title}\n${n.text}` }))])
  }, [notifications])

  const reply = (userText: string, answer: () => Omit<Msg, 'id' | 'time' | 'from'>) => {
    setMsgs((m) => [...m, { id: mid(), from: 'me', text: userText, time: t() }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [...m, { id: mid(), from: 'bot', time: t(), ...answer() }])
    }, 650)
  }

  const low = () => reply('📦 Что заканчивается?', () => {
    const list = items.filter((i) => level(i) === 'out' || level(i) === 'low')
    if (!list.length) return { text: '✅ Всё в наличии, ниже минимума ничего нет.' }
    return {
      text: `Ниже минимума — ${list.length} поз.:\n\n` + list.map((i) => `${level(i) === 'out' ? '🔴' : '🟡'} ${i.name} — ${i.stock} ${i.unit} (мин ${i.min})`).join('\n'),
      actions: [{ label: '🛒 Сформировать заказ', run: order }],
    }
  })

  const order = () => reply('🛒 Заказ', () => {
    if (!toOrder.length) return { text: 'Заказывать пока нечего 👌' }
    const bySup = new Map<string, Item[]>()
    toOrder.forEach((i) => bySup.set(supplierOf(i).name, [...(bySup.get(supplierOf(i).name) ?? []), i]))
    const total = toOrder.reduce((s, i) => s + orderLine(i).sum, 0)
    return {
      text: `Предлагаю заказать на ${fmtRub(total)}:\n\n` + [...bySup.entries()].map(([s, xs]) => `🚚 ${s}\n` + xs.map((i) => `  • ${i.name} — ${orderLine(i).qty} ${i.unit}`).join('\n')).join('\n\n'),
      actions: [
        { label: '✅ Согласовать', run: () => { reply('✅ Согласовать', () => ({ text: 'Готово. Заявки отправлены поставщикам, копия — в панели «Заказ поставщикам».' })) } },
        { label: '✏️ Изменить в панели', run: () => toast('В проде откроется веб-панель на странице заказа') },
      ],
    }
  })

  const stock = () => reply('🔍 Остаток', () => {
    const pick = [...items].sort(() => Math.random() - 0.5).slice(0, 4)
    return {
      text: 'Напишите название или отправьте фото штрихкода. Например:',
      actions: pick.map((i) => ({ label: i.name, run: () => showItem(i.id) })),
    }
  })

  const showItem = (id: string) => {
    const i = byId(id)
    if (!i) return
    reply(i.name, () => {
      const cur = byId(id) ?? i
      const dl = daysLeft(cur)
      return {
        text: `${cur.name}\n${cur.brand} · ${cur.pack}\n\nОстаток: ${cur.stock} ${cur.unit} (мин ${cur.min})\nМесто: ${cur.location}${dl != null ? `\nХватит ≈ на ${fmtDays(dl)}` : ''}`,
        actions: cur.stock > 0 ? [{ label: '➖ Выдать 1', run: () => issue(cur.id, 1) }] : [],
      }
    })
  }

  const photo = () => {
    const pool = items.filter((i) => i.stock > 0)
    const i = pool[Math.floor(Math.random() * pool.length)]
    setMsgs((m) => [...m, { id: mid(), from: 'me', text: '📷 Фото штрихкода', time: t() }])
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMsgs((m) => [...m, {
        id: mid(), from: 'bot', time: t(),
        text: `Распознал: ${i.barcode}\n${i.name} — на складе ${i.stock} ${i.unit}.\n\nСколько выдать?`,
        actions: [1, 2, 3].filter((n) => n <= i.stock).map((n) => ({ label: `➖ ${n}`, run: () => issue(i.id, n) })),
      }])
    }, 900)
  }

  const issue = async (id: string, qty: number) => {
    const room = rooms[0]
    try {
      // в демо — от имени ассистента, на сервере — от того, кто вошёл
      const r = await move({ lines: [{ itemId: id, qty }], type: 'out', room, user: DEMO ? 'Ирина М.' : undefined, source: 'bot' })
      const it = r.items[0]
      reply(`➖ Выдать ${qty}`, () => ({
        text: `✅ Выдано: ${it.name} × ${qty} → ${room}\nОстаток: ${it.stock} ${it.unit}. ${r.queued ? 'Нет связи — проведётся, когда сеть вернётся.' : 'Запись в журнале.'}`,
      }))
    } catch (e) {
      toast(`Не проведено: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const keyboard = [
    { label: '📦 Что заканчивается', run: low },
    { label: '📷 Выдать по фото', run: photo },
    { label: '🔍 Остаток', run: stock },
    { label: '🛒 Заказ', run: order },
  ]

  return (
    <>
      <PageHeader title="Telegram-бот" sub="Превью бота на живых данных демо — операции из чата сразу видны в панели и журнале" />

      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* телефон */}
        <div className="mx-auto w-full max-w-[380px]">
          <div className="overflow-hidden rounded-[36px] border-[6px] border-[#1c2530] bg-[#0e1621] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-3 border-b border-black/30 bg-[#17212b] px-3 py-2.5">
              <ChevronLeft size={20} className="text-[#6ab3f3]" />
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#5cc8ff] to-[#3a7df0] text-sm font-bold text-ink-950">SC</div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">Склад Smart Clinic</div>
                <div className="text-[11px] text-[#6d8599]">{typing ? 'печатает…' : 'бот'}</div>
              </div>
            </div>

            <div ref={box} className="h-[460px] space-y-2 overflow-y-auto px-3 py-3" style={{ backgroundImage: 'radial-gradient(circle at 20% 10%, rgba(92,200,255,0.05), transparent 40%)' }}>
              <AnimatePresence initial={false}>
                {msgs.map((m) => (
                  <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={clsx('flex flex-col', m.from === 'me' ? 'items-end' : 'items-start')}>
                    <div className={clsx('max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-[13px] leading-snug text-white', m.from === 'me' ? 'rounded-br-md bg-[#2b5278]' : 'rounded-bl-md bg-[#182533]')}>
                      {m.text}
                      <span className="float-right ml-2 mt-1.5 text-[10px] text-[#6d8599]">{m.time}</span>
                    </div>
                    {m.actions && m.actions.length > 0 && (
                      <div className="mt-1 grid w-[85%] gap-1">
                        {m.actions.map((a) => (
                          <button key={a.label} type="button" onClick={a.run} className="truncate rounded-lg bg-[#1e2c3a] px-3 py-1.5 text-[12px] text-white transition hover:bg-[#25384a]">{a.label}</button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {typing && (
                <div className="flex gap-1 rounded-2xl rounded-bl-md bg-[#182533] px-3 py-3 w-14">
                  {[0, 1, 2].map((i) => <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-[#6d8599]" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1 bg-[#17212b] p-1.5">
              {keyboard.map((k) => (
                <button key={k.label} type="button" onClick={k.run} disabled={typing} className="rounded-md bg-[#232e3c] px-2 py-2.5 text-[12px] text-white transition hover:bg-[#2b3949] disabled:opacity-50">
                  {k.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* описание */}
        <div className="min-w-0 space-y-4">
          <Card className="p-5">
            <CardHeader title="Что умеет бот" />
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Bell, title: 'Уведомления', text: 'Сразу пишет директору и старшей медсестре, когда позиция ушла ниже минимума, закончилась или истекает срок годности.' },
                { icon: Camera, title: 'Выдача по фото', text: 'Врач или ассистент фотографирует штрихкод — бот распознаёт позицию и списывает в кабинет. Без компьютера и сканера.' },
                { icon: Search, title: 'Остатки', text: 'Сколько осталось, где лежит и на сколько дней хватит — одним сообщением.' },
                { icon: ShoppingCart, title: 'Заказ', text: 'Утренняя сводка «что заказать» с разбивкой по поставщикам. Директор согласует одной кнопкой.' },
                { icon: UserCheck, title: 'Роли', text: 'Директор видит всё и согласует заказы. Персонал только выдаёт и смотрит остатки.' },
                { icon: Minus, title: 'Единый журнал', text: 'Операция из бота попадает в тот же журнал, что и скан на складе, — с сотрудником и временем.' },
              ].map((f) => (
                <li key={f.title} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-white/[0.03] text-accent"><f.icon size={16} /></span>
                  <div>
                    <div className="text-sm font-medium text-fg">{f.title}</div>
                    <div className="mt-0.5 text-sm leading-relaxed text-fg-3">{f.text}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-5">
            <CardHeader title="Попробуйте" sub="всё работает на данных этой панели" />
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-fg-2 marker:text-accent">
              <li>Нажмите «📷 Выдать по фото» и выдайте позицию — затем откройте «Журнал операций»: там будет запись с источником Telegram.</li>
              <li>На странице «Приход / расход» выдайте позицию до минимума — бот пришлёт уведомление в этот чат.</li>
              <li>«🛒 Заказ» покажет ту же заявку, что и страница заказа поставщикам.</li>
            </ol>
          </Card>
        </div>
      </div>
    </>
  )
}
