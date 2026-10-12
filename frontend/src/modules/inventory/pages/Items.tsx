import clsx from 'clsx'
import { ArrowDownUp, Download, PackagePlus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Card, Empty, PageHeader, Segmented, StatusPill } from '../components/ui'
import { useData } from '../context/DataContext'
import { useUi } from '../context/UiContext'
import { categories } from '../data/mock'
import {
  categoryOf, daysLeft, expiryDays, EXPIRY_WARN_DAYS, fmtDays, fmtRub, isExpiring, level, LEVEL, supplierOf,
} from '../lib/stock'
import type { Item } from '../types'

type Filter = 'all' | 'problem' | 'expiring' | 'ok'
type Sort = 'status' | 'name' | 'days' | 'sum'

const RANK = { out: 0, low: 1, ok: 2, over: 3 }

export function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export function ItemsPage() {
  const { items, lowCount, outCount, expiringCount } = useData()
  const { openItem, newItem } = useUi()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('all')
  const [filter, setFilter] = useState<Filter>('all')
  const [sort, setSort] = useState<Sort>('status')

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    const list = items.filter((i) => {
      if (cat !== 'all' && i.categoryId !== cat) return false
      const lv = level(i)
      if (filter === 'problem' && lv !== 'low' && lv !== 'out') return false
      if (filter === 'ok' && (lv === 'low' || lv === 'out')) return false
      if (filter === 'expiring' && !(isExpiring(i) && i.stock > 0)) return false
      return !s || `${i.name} ${i.brand} ${i.sku} ${i.barcode} ${i.location}`.toLowerCase().includes(s)
    })
    const by: Record<Sort, (a: Item, b: Item) => number> = {
      status: (a, b) => RANK[level(a)] - RANK[level(b)] || (daysLeft(a) ?? 1e9) - (daysLeft(b) ?? 1e9),
      name: (a, b) => a.name.localeCompare(b.name, 'ru'),
      days: (a, b) => (daysLeft(a) ?? 1e9) - (daysLeft(b) ?? 1e9),
      sum: (a, b) => b.stock * b.price - a.stock * a.price,
    }
    return [...list].sort(by[sort])
  }, [items, q, cat, filter, sort])

  const exportCsv = () =>
    downloadCsv('ostatki.csv', [
      ['Наименование', 'Производитель', 'Артикул', 'Штрихкод', 'Категория', 'Остаток', 'Ед.', 'Мин', 'Опт', 'Цена', 'Сумма', 'Место', 'Срок годности', 'Поставщик'],
      ...rows.map((i) => [i.name, i.brand, i.sku, i.barcode, categoryOf(i).name, i.stock, i.unit, i.min, i.max, i.price, i.stock * i.price, i.location, i.expiry ?? '', supplierOf(i).name]),
    ])

  return (
    <>
      <PageHeader
        title="Номенклатура"
        sub="Все позиции склада с остатками, порогами и сроками годности"
        right={
          <div className="flex gap-2">
            <Button variant="ghost" icon={Download} onClick={exportCsv}>CSV</Button>
            <Button variant="primary" icon={PackagePlus} onClick={() => newItem()}>Новая позиция</Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-64">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-3" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Название, артикул, штрихкод, место"
            className="h-10 w-full rounded-xl border border-line bg-white/[0.03] pl-9 pr-3 text-sm text-fg outline-none placeholder:text-fg-3 focus:border-accent/40"
          />
        </div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `Все · ${items.length}` },
            { value: 'problem', label: `Мало/нет · ${lowCount + outCount}` },
            { value: 'expiring', label: `Срок · ${expiringCount}` },
            { value: 'ok', label: 'В норме' },
          ]}
        />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[{ id: 'all', name: 'Все категории', color: '' }, ...categories].map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={clsx('inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition', cat === c.id ? 'border-white/20 bg-white/[0.07] text-fg' : 'border-line text-fg-2 hover:text-fg')}
          >
            {c.color && <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />}
            {c.name}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <Empty>Ничего не найдено. Попробуйте изменить фильтры или поиск.</Empty>
      ) : (
        <>
          {/* десктоп — таблица */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-line text-left">
                    <Th onClick={() => setSort('name')} active={sort === 'name'}>Позиция</Th>
                    <Th onClick={() => setSort('status')} active={sort === 'status'}>Статус</Th>
                    <Th className="text-right">Остаток</Th>
                    <Th onClick={() => setSort('days')} active={sort === 'days'}>Хватит на</Th>
                    <Th>Срок годности</Th>
                    <Th>Место</Th>
                    <Th onClick={() => setSort('sum')} active={sort === 'sum'} className="text-right">Сумма</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((i) => {
                    const lv = level(i)
                    const dl = daysLeft(i)
                    const ed = expiryDays(i)
                    return (
                      <tr key={i.id} onClick={() => openItem(i.id)} className="cursor-pointer transition hover:bg-white/[0.03]">
                        <td className="max-w-[320px] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: categoryOf(i).color }} title={categoryOf(i).name} />
                            <div className="min-w-0">
                              <div className="truncate font-medium text-fg">{i.name}</div>
                              <div className="truncate text-xs text-fg-3">{i.brand} · {i.pack} в {i.unit} · <span className="font-mono">{i.sku}</span></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusPill status={lv} /></td>
                        <td className="px-4 py-3 text-right">
                          <div className={clsx('num font-semibold', LEVEL[lv].text)}>{i.stock} <span className="font-normal text-fg-3">{i.unit}</span></div>
                          <div className="num text-[11px] text-fg-3">мин {i.min} · опт {i.max}</div>
                        </td>
                        <td className={clsx('px-4 py-3', dl != null && dl <= supplierOf(i).leadDays + 2 ? 'text-warn' : 'text-fg-2')}>
                          {dl == null ? '—' : dl === 0 ? 'закончилось' : `≈ ${fmtDays(dl)}`}
                        </td>
                        <td className={clsx('px-4 py-3', ed != null && ed <= EXPIRY_WARN_DAYS ? 'text-warn' : 'text-fg-2')}>
                          {ed == null ? '—' : ed <= 0 ? 'истёк' : new Date(i.expiry!).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-fg-2">{i.location}</td>
                        <td className="num px-4 py-3 text-right text-fg-2">{fmtRub(i.stock * i.price)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* телефон — карточки */}
          <ul className="space-y-2 md:hidden">
            {rows.map((i) => {
              const lv = level(i)
              const dl = daysLeft(i)
              return (
                <li key={i.id}>
                  <button type="button" onClick={() => openItem(i.id)} className="glass flex w-full items-center gap-3 p-3.5 text-left">
                    <span className="h-10 w-1 shrink-0 rounded-full" style={{ background: categoryOf(i).color }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-fg">{i.name}</div>
                      <div className="truncate text-xs text-fg-3">{i.location}{dl != null ? ` · ≈ ${fmtDays(dl)}` : ''}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={clsx('num text-base font-semibold', LEVEL[lv].text)}>{i.stock} <span className="text-xs font-normal text-fg-3">{i.unit}</span></div>
                      <div className="text-[11px] text-fg-3">{LEVEL[lv].label}</div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </>
  )
}

function Th({ children, onClick, active, className }: { children: ReactNode; onClick?: () => void; active?: boolean; className?: string }) {
  return (
    <th className={clsx('px-4 py-3 text-[11px] font-medium uppercase tracking-[0.08em] text-fg-3', className)}>
      {onClick ? (
        <button type="button" onClick={onClick} className={clsx('inline-flex items-center gap-1 uppercase tracking-[0.08em] hover:text-fg', active && 'text-fg')}>
          {children}<ArrowDownUp size={11} className={active ? 'text-accent' : 'opacity-40'} />
        </button>
      ) : children}
    </th>
  )
}
