import { Ban, Boxes, CalendarDays, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DailyChart, HBars } from '../components/charts'
import { Card, CardHeader, PageHeader, Segmented } from '../components/ui'
import { Kpi } from '../components/ui/extra'
import { useData } from '../context/DataContext'
import { byCategory, byRoom, dailyConsumption, periodSum, topItems } from '../lib/analytics'
import { fmtRub, fmtRubShort } from '../lib/stock'

type P = '7' | '30' | '45'

export function AnalyticsPage() {
  const { movements, items } = useData()
  const [p, setP] = useState<P>('30')
  const days = Number(p)

  const data = useMemo(() => {
    const daily = dailyConsumption(movements, items, days)
    const sum = periodSum(movements, items, days, 0)
    const workDays = daily.filter((d) => !d.weekend).length || 1
    const price = new Map(items.map((i) => [i.id, i.price]))
    const t = Date.now() - days * 86_400_000
    const wo = movements.filter((m) => m.type === 'writeoff' && new Date(m.ts).getTime() >= t)
    return {
      daily, sum, perDay: sum / workDays,
      writeoff: wo.reduce((s, m) => s + m.qty * (price.get(m.itemId) ?? 0), 0),
      woList: wo,
      cats: byCategory(movements, items, days),
      rooms: byRoom(movements, items, days),
      top: topItems(movements, items, days),
    }
  }, [movements, items, days])

  return (
    <>
      <PageHeader
        title="Аналитика расхода"
        sub="Куда уходят деньги на расходники: по категориям, кабинетам и позициям"
        right={<Segmented value={p} onChange={setP} options={[{ value: '7', label: '7 дней' }, { value: '30', label: '30 дней' }, { value: '45', label: '45 дней' }]} />}
      />

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <Kpi i={0} label="Расход за период" value={fmtRubShort(data.sum)} icon={Wallet} tone="accent" />
        <Kpi i={1} label="В рабочий день" value={fmtRubShort(data.perDay)} sub="в среднем, без воскресений" icon={CalendarDays} />
        <Kpi i={2} label="Прогноз на месяц" value={fmtRubShort(data.perDay * 26)} sub="при текущем темпе" icon={Boxes} tone="ai" />
        <Kpi i={3} label="Списано" value={fmtRub(data.writeoff)} sub={`${data.woList.length} операций · брак и сроки`} icon={Ban} tone={data.writeoff ? 'warn' : 'ok'} />
      </div>

      <Card i={2} className="mt-4 p-4 md:p-5">
        <CardHeader title="Расход по дням, ₽" sub="выдача в кабинеты + списания · сегодня выделено" />
        <div className="mt-4"><DailyChart data={data.daily} height={260} /></div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card i={3} className="p-4 md:p-5">
          <CardHeader title="По категориям" sub="доля в расходе за период" />
          <div className="mt-4">
            <HBars rows={[...data.cats].sort((a, b) => b.sum - a.sum).map((c) => ({ id: c.id, name: c.name, value: c.sum, color: c.color }))} />
          </div>
        </Card>
        <Card i={4} className="p-4 md:p-5">
          <CardHeader title="По кабинетам" sub="куда выдано, ₽" />
          <div className="mt-4">
            <HBars rows={data.rooms.map((r) => ({ id: r.name, name: r.name, value: r.sum }))} />
          </div>
        </Card>
      </div>

      <Card i={5} className="mt-4 p-4 md:p-5">
        <CardHeader title="Топ позиций по сумме расхода" sub="на эти позиции стоит договориться о цене с поставщиком" />
        <div className="mt-4 max-w-3xl">
          <HBars rows={data.top.map((t) => ({ id: t.item.id, name: t.item.name, value: t.sum, sub: `${t.units} ${t.item.unit}` }))} />
        </div>
      </Card>
    </>
  )
}
