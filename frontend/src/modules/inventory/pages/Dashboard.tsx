import clsx from 'clsx'
import { ArrowRight, CalendarClock, History, PackageX, Sparkles, TrendingDown, Wallet, Boxes } from 'lucide-react'
import { useMemo } from 'react'
import { DailyChart } from '../components/charts'
import { Button, Card, CardHeader, PageHeader, StatusDot } from '../components/ui'
import { Kpi } from '../components/ui/extra'
import { useData } from '../context/DataContext'
import { useUi } from '../context/UiContext'
import { categories } from '../data/catalog'
import { dailyConsumption, periodSum } from '../lib/analytics'
import {
  daysLeft, expiryDays, EXPIRY_WARN_DAYS, fmtDays, fmtRub, fmtRubShort, fmtWhen, level, LEVEL, MOVE, SOURCE, stockValue, supplierOf,
} from '../lib/stock'

export function DashboardPage() {
  const { items, movements, lowCount, outCount, expiringCount, toOrder } = useData()
  const { navigate, openItem } = useUi()

  const days = useMemo(() => dailyConsumption(movements, items, 30), [movements, items])
  const today = days[days.length - 1]
  const week = periodSum(movements, items, 7, 0)
  const prevWeek = periodSum(movements, items, 14, 7)
  const weekDelta = prevWeek ? Math.round(((week - prevWeek) / prevWeek) * 100) : 0

  const attention = useMemo(() => {
    const rows: { id: string; tone: 'out' | 'low' | 'expiry' | 'forecast'; text: string; sub: string }[] = []
    for (const i of items) {
      const lv = level(i)
      const ed = expiryDays(i)
      const dl = daysLeft(i)
      if (lv === 'out') rows.push({ id: i.id, tone: 'out', text: i.name, sub: `Закончилось · поставщик ${supplierOf(i).name}` })
      else if (lv === 'low') rows.push({ id: i.id, tone: 'low', text: i.name, sub: `Осталось ${i.stock} ${i.unit} при минимуме ${i.min}${dl != null ? ` · хватит ≈ на ${fmtDays(dl)}` : ''}` })
      else if (dl != null && dl <= supplierOf(i).leadDays + 2) rows.push({ id: i.id, tone: 'forecast', text: i.name, sub: `По расходу закончится через ${fmtDays(dl)}, поставка ${supplierOf(i).leadDays} дн.` })
      if (ed != null && ed <= EXPIRY_WARN_DAYS && i.stock > 0) rows.push({ id: i.id + 'e', tone: 'expiry', text: i.name, sub: ed <= 0 ? 'Срок годности истёк' : `Срок годности истекает через ${fmtDays(ed)} · ${i.stock} ${i.unit}` })
    }
    const order = { out: 0, low: 1, forecast: 2, expiry: 3 }
    return rows.sort((a, b) => order[a.tone] - order[b.tone])
  }, [items])

  const orderSum = toOrder.reduce((s, i) => s + Math.max(1, i.max - i.stock) * i.price, 0)
  const recent = movements.slice(0, 7)

  const TONE = {
    out: { cls: 'text-crit', dot: 'out' as const, tag: 'Нет' },
    low: { cls: 'text-warn', dot: 'low' as const, tag: 'Мало' },
    forecast: { cls: 'text-ai', dot: null, tag: 'Прогноз' },
    expiry: { cls: 'text-warn', dot: null, tag: 'Срок' },
  }

  return (
    <>
      <PageHeader
        title="Обзор склада"
        sub={`${items.length} позиций в ${categories.length} категориях · данные обновляются при каждом скане`}
        right={<Button variant="primary" onClick={() => navigate('scan')}>Приход / расход</Button>}
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-5">
        <Kpi i={0} label="Стоимость склада" value={fmtRubShort(stockValue(items))} sub={`${items.reduce((s, i) => s + i.stock, 0)} единиц учёта`} icon={Wallet} tone="neutral" />
        <Kpi i={1} label="Закончилось" value={outCount} sub={outCount ? 'нужна срочная закупка' : 'всё в наличии'} icon={PackageX} tone={outCount ? 'crit' : 'ok'} onClick={() => navigate('items')} />
        <Kpi i={2} label="Ниже минимума" value={lowCount} sub="сработал порог остатка" icon={TrendingDown} tone={lowCount ? 'warn' : 'ok'} onClick={() => navigate('items')} />
        <Kpi i={3} label="Истекает срок" value={expiringCount} sub={`в ближайшие ${EXPIRY_WARN_DAYS} дней`} icon={CalendarClock} tone={expiringCount ? 'warn' : 'ok'} />
        <Kpi
          i={4}
          label="Расход за неделю"
          value={fmtRubShort(week)}
          sub={<span className={clsx(weekDelta > 0 ? 'text-warn' : 'text-ok')}>{weekDelta > 0 ? '+' : ''}{weekDelta}% к прошлой неделе</span>}
          icon={Boxes}
          tone="accent"
          trend={days.slice(-14).map((d) => d.sum)}
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card i={2} className="p-4 md:p-5">
          <CardHeader
            title="Требует внимания"
            sub={`${attention.length} ${attention.length === 1 ? 'пункт' : 'пунктов'} · обновлено ${fmtWhen(new Date().toISOString())}`}
            right={<Button variant="ghost" onClick={() => navigate('orders')} className="shrink-0">Заказ · {toOrder.length} поз.</Button>}
          />
          <ul className="mt-4 max-h-[380px] space-y-1 overflow-y-auto pr-1">
            {attention.map((r) => {
              const t = TONE[r.tone]
              return (
                <li key={r.id + r.tone}>
                  <button type="button" onClick={() => openItem(r.id.replace(/e$/, ''))} className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-white/[0.04]">
                    {t.dot ? <StatusDot status={t.dot} /> : r.tone === 'forecast' ? <Sparkles size={12} className="shrink-0 text-ai" /> : <CalendarClock size={12} className="shrink-0 text-warn" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-fg">{r.text}</div>
                      <div className="truncate text-xs text-fg-3">{r.sub}</div>
                    </div>
                    <span className={clsx('shrink-0 rounded-md bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium', t.cls)}>{t.tag}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        <Card i={3} className="flex flex-col p-4 md:p-5">
          <CardHeader title="AI-сводка" icon={Sparkles} sub="на основе расхода за 45 дней" />
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-fg-2">
            <p>
              Сегодня выдано <b className="text-fg">{today.units} ед.</b> на <b className="text-fg">{fmtRub(today.sum)}</b>.
              За неделю расход {weekDelta >= 0 ? 'вырос' : 'снизился'} на <b className={weekDelta > 0 ? 'text-warn' : 'text-ok'}>{Math.abs(weekDelta)}%</b>.
            </p>
            {outCount + lowCount > 0 && (
              <p>
                <b className="text-fg">{outCount + lowCount}</b> позиций ниже минимума. Чтобы закрыть потребность до оптимального уровня,
                нужен заказ на <b className="text-fg">{fmtRub(orderSum)}</b> у {new Set(toOrder.map((i) => i.supplierId)).size} поставщиков.
              </p>
            )}
            {expiringCount > 0 && (
              <p>У <b className="text-fg">{expiringCount}</b> позиций скоро истекает срок годности — лучше расходовать их в первую очередь.</p>
            )}
          </div>
          <div className="mt-auto pt-4">
            <Button variant="ai" icon={ArrowRight} onClick={() => navigate('orders')} className="w-full">Сформировать заказ</Button>
          </div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card i={4} className="p-4 md:p-5">
          <CardHeader title="Расход по дням" sub="выдача и списание за 30 дней, ₽" right={<Button variant="subtle" onClick={() => navigate('analytics')}>Аналитика</Button>} />
          <div className="mt-4"><DailyChart data={days} /></div>
        </Card>

        <Card i={5} className="p-4 md:p-5">
          <CardHeader title="Последние операции" icon={History} right={<Button variant="subtle" onClick={() => navigate('movements')}>Журнал</Button>} />
          <ul className="mt-3 space-y-0.5">
            {recent.map((m) => {
              const it = items.find((i) => i.id === m.itemId)
              const t = MOVE[m.type]
              return (
                <li key={m.id}>
                  <button type="button" onClick={() => it && openItem(it.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/[0.04]">
                    <span className={clsx('num w-11 shrink-0 rounded-md py-0.5 text-center text-xs font-semibold', t.bg, t.text)}>{t.sign}{m.qty}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-fg">{it?.name}</div>
                      <div className="truncate text-[11px] text-fg-3">{m.user} · {m.room ?? m.note ?? t.label} · {SOURCE[m.source]}</div>
                    </div>
                    {it && <span className={clsx('num shrink-0 text-xs', LEVEL[level(it)].text)}>{it.stock} {it.unit}</span>}
                  </button>
                  <div className="sr-only">{fmtWhen(m.ts)}</div>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>
    </>
  )
}
