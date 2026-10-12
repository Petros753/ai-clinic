import clsx from 'clsx'
import { Copy, PackageCheck, Send, Truck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Empty, PageHeader, StatusPill } from '../components/ui'
import { Stepper } from '../components/ui/extra'
import { useToast } from '../components/ui/Toast'
import { useData } from '../context/DataContext'
import { useUi } from '../context/UiContext'
import { suppliers } from '../data/mock'
import { daysLeft, fmtDays, fmtRub, level, orderLine } from '../lib/stock'

/**
 * Автозаказ: всё, что ниже минимума или закончится раньше, чем придёт поставка.
 * Количество — до оптимального остатка, можно поправить вручную.
 */
export function OrdersPage() {
  const { toOrder, notify } = useData()
  const { openItem } = useUi()
  const toast = useToast()
  const [qty, setQty] = useState<Record<string, number>>({})
  const [off, setOff] = useState<Record<string, boolean>>({})
  const [sent, setSent] = useState<Record<string, string>>({})

  // новые позиции в заказе получают рекомендованное количество
  useEffect(() => {
    setQty((q) => {
      const next = { ...q }
      for (const i of toOrder) if (next[i.id] == null) next[i.id] = orderLine(i).qty
      return next
    })
  }, [toOrder])

  const groups = useMemo(() => suppliers
    .map((s) => {
      const lines = toOrder.filter((i) => i.supplierId === s.id).map((i) => ({ item: i, qty: qty[i.id] ?? orderLine(i).qty }))
      const active = lines.filter((l) => !off[l.item.id])
      return { s, lines, sum: active.reduce((a, l) => a + l.qty * l.item.price, 0), count: active.length }
    })
    .filter((g) => g.lines.length), [toOrder, qty, off])

  const total = groups.reduce((a, g) => a + g.sum, 0)

  const text = (g: (typeof groups)[number]) =>
    [`Заявка от Smart Clinic для ${g.s.name}:`, ...g.lines.filter((l) => !off[l.item.id]).map((l, n) => `${n + 1}. ${l.item.name} (${l.item.brand}, арт. ${l.item.sku}) — ${l.qty} ${l.item.unit}`), `Итого: ${fmtRub(g.sum)}`].join('\n')

  const copy = async (g: (typeof groups)[number]) => {
    try {
      await navigator.clipboard.writeText(text(g))
      toast('Заявка скопирована — можно вставить в письмо или мессенджер')
    } catch {
      toast('Не удалось скопировать — браузер запретил доступ к буферу')
    }
  }

  const send = (g: (typeof groups)[number]) => {
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    setSent((x) => ({ ...x, [g.s.id]: time }))
    notify({ severity: 'info', title: `Заявка отправлена: ${g.s.name}`, text: `${g.count} поз. на ${fmtRub(g.sum)}. Копия — директору в Telegram.` })
    toast(`Заявка ${g.s.name} отправлена на согласование директору`)
  }

  return (
    <>
      <PageHeader
        title="Заказ поставщикам"
        sub="Формируется автоматически: позиции ниже минимума и те, что закончатся раньше, чем придёт поставка"
        right={total > 0 && <div className="glass px-4 py-2 text-right"><div className="label">Итого к заказу</div><div className="num text-lg font-semibold text-fg">{fmtRub(total)}</div></div>}
      />

      {groups.length === 0 ? (
        <Empty>
          <PackageCheck className="mx-auto mb-2 text-ok" />
          Всё в наличии — заказывать пока нечего
        </Empty>
      ) : (
        <div className="space-y-4">
          {groups.map((g, gi) => (
            <Card key={g.s.id} i={gi} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-white/[0.03] text-fg-2"><Truck size={16} /></span>
                  <div className="min-w-0">
                    <div className="font-semibold text-fg">{g.s.name}</div>
                    <div className="truncate text-xs text-fg-3">{g.s.contact} · доставка {g.s.leadDays} дн.</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="num mr-2 text-sm text-fg-2">{g.count} поз. · <b className="text-fg">{fmtRub(g.sum)}</b></span>
                  <Button variant="ghost" icon={Copy} onClick={() => copy(g)} disabled={!g.count}>Текст заявки</Button>
                  <Button variant={sent[g.s.id] ? 'ghost' : 'primary'} icon={Send} onClick={() => send(g)} disabled={!g.count}>
                    {sent[g.s.id] ? `Отправлено ${sent[g.s.id]}` : 'На согласование'}
                  </Button>
                </div>
              </div>
              <ul className="divide-y divide-line">
                {g.lines.map((l) => {
                  const dl = daysLeft(l.item)
                  const disabled = off[l.item.id]
                  return (
                    <li key={l.item.id} className={clsx('flex flex-wrap items-center gap-3 px-4 py-3 transition', disabled && 'opacity-40')}>
                      <input
                        type="checkbox"
                        checked={!disabled}
                        onChange={() => setOff((x) => ({ ...x, [l.item.id]: !x[l.item.id] }))}
                        className="h-4 w-4 shrink-0 accent-[#5cc8ff]"
                        aria-label={`Включить ${l.item.name} в заказ`}
                      />
                      <button type="button" onClick={() => openItem(l.item.id)} className="min-w-0 flex-1 basis-56 text-left">
                        <div className="truncate text-sm font-medium text-fg hover:text-accent">{l.item.name}</div>
                        <div className="truncate text-xs text-fg-3">
                          остаток {l.item.stock} {l.item.unit} · мин {l.item.min} · опт {l.item.max}{l.item.stock <= 0 ? ' · закончилось' : dl != null ? ` · хватит ≈ на ${fmtDays(dl)}` : ''}
                        </div>
                      </button>
                      <StatusPill status={level(l.item)} />
                      <Stepper value={l.qty} onChange={(v) => setQty((x) => ({ ...x, [l.item.id]: v }))} />
                      <span className="num w-24 shrink-0 text-right text-sm text-fg-2">{fmtRub(l.qty * l.item.price)}</span>
                    </li>
                  )
                })}
              </ul>
            </Card>
          ))}
          <p className="text-xs text-fg-3">
            Когда поставка приедет — отсканируйте упаковки в режиме «Приход»: остатки обновятся, позиции уйдут из заказа.
          </p>
        </div>
      )}
    </>
  )
}
