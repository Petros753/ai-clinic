import { Activity, CalendarDays, ChartColumn, Clock, DoorOpen, Siren, Sparkles, Thermometer } from 'lucide-react'
import {
  ActivityHeatmap, HourlyLoadChart, LegendRow, RoomLoadBars, SimpleBars, TemperatureChart, WeekCompareChart, CHART,
} from '../components/charts'
import { Card, CardHeader, PageHeader } from '../components/ui'
import {
  activityHeatmap, alarmsByDay, climateDeviations, eventsByDay, hourlyLoad, hours, roomLoad, temperatureSeries, weekLoad,
} from '../data/mock'

export function AnalyticsPage() {
  return (
    <div>
      <PageHeader title="Аналитика" sub="Загрузка, климат, тревоги и события. Данные за сегодня, неделю и месяц." />

      <Card i={0} className="mb-5 flex flex-wrap items-start gap-4 border-ai/20 p-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ai/15 text-ai"><Sparkles size={18} /></span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Вывод AI</div>
          <p className="mt-1 max-w-[90ch] text-[14px] leading-relaxed text-fg-2">
            Загрузка на этой неделе выше прошлой на 9%, пики — вторник и четверг. Кабинет 14 загружен на 21% выше среднего.
            Все климатические отклонения приходятся на малую операционную после 14:00 — это похоже на недостаточную мощность кондиционера, а не на случайность.
          </p>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card i={1} className="p-5">
          <CardHeader title="Загрузка кабинетов" icon={DoorOpen} sub="Доля рабочего времени, сегодня" />
          <div className="mt-5"><RoomLoadBars data={roomLoad} /></div>
        </Card>

        <Card i={2} className="p-5">
          <CardHeader title="Нагрузка по времени" icon={Clock} sub="Посетители в холле, 08:00–20:00" />
          <div className="mt-4"><HourlyLoadChart data={hourlyLoad} /></div>
          <div className="mt-2"><LegendRow items={[{ label: 'Сегодня', color: CHART.accent }, { label: 'Среднее за прошлую неделю', color: CHART.muted, dashed: true }]} /></div>
        </Card>

        <Card i={3} className="p-5">
          <CardHeader title="Температура по помещениям" icon={Thermometer} sub="Сегодня, по часам" />
          <div className="mt-4"><TemperatureChart data={temperatureSeries} /></div>
        </Card>

        <Card i={4} className="p-5">
          <CardHeader title="Загрузка по дням недели" icon={CalendarDays} sub="Эта неделя против прошлой" />
          <div className="mt-4"><WeekCompareChart data={weekLoad} /></div>
        </Card>

        <Card i={5} className="p-5 xl:col-span-2">
          <CardHeader title="Активность помещений" icon={Activity} sub="Тепловая карта по часам, сегодня" />
          <div className="mt-4"><ActivityHeatmap rows={activityHeatmap} hours={hours} /></div>
        </Card>

        <div className="grid gap-5 md:grid-cols-3 xl:col-span-2">
          <Card i={6} className="p-5">
            <CardHeader title="Отклонения климата" icon={Thermometer} sub="Минут вне нормы, эта неделя" />
            <div className="mt-4"><SimpleBars data={climateDeviations} xKey="day" dataKey="minutes" unit=" мин" color="#3987e5" warnAbove={20} height={180} /></div>
            <p className="mt-2 text-xs text-fg-3"><span className="text-warn">■</span> больше 20 минут подряд</p>
          </Card>
          <Card i={7} className="p-5">
            <CardHeader title="Тревоги" icon={Siren} sub="По дням, сентябрь" />
            <div className="mt-4"><SimpleBars data={alarmsByDay} xKey="day" dataKey="alarms" color="#e5484d" height={180} /></div>
            <p className="mt-2 text-xs text-fg-3">5 за месяц, все закрыты</p>
          </Card>
          <Card i={8} className="p-5">
            <CardHeader title="События" icon={ChartColumn} sub="Последние 14 дней" />
            <div className="mt-4"><SimpleBars data={eventsByDay} xKey="day" dataKey="events" color="#3987e5" highlightLast height={180} /></div>
            <p className="mt-2 text-xs text-fg-3">сегодня — 12, среднее — 10.5</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
