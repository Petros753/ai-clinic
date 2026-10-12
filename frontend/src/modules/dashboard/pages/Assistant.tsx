import { Cctv, Database, DoorOpen, FileText, Gauge, ListChecks, ShieldCheck } from 'lucide-react'
import { AiAvatar, AssistantChat } from '../components/ai/AssistantChat'
import { Card, CardHeader } from '../components/ui'

const SOURCES = [
  { icon: DoorOpen, label: 'Помещения', value: '14' },
  { icon: Gauge, label: 'Датчики климата и присутствия', value: '48' },
  { icon: Cctv, label: 'Камеры с AI-детекцией', value: '10' },
  { icon: ListChecks, label: 'Журнал событий', value: '30 дней' },
  { icon: ShieldCheck, label: 'Охранная система', value: 'онлайн' },
  { icon: FileText, label: 'Отчёты', value: '42' },
]

export function AssistantPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card i={0} className="flex h-[calc(100vh_-_7.5rem_-_var(--shell-h))] min-h-[560px] flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-3 border-b border-line pb-4">
          <AiAvatar size={40} />
          <div>
            <h1 className="text-lg font-semibold">Ассистент директора</h1>
            <p className="text-xs text-fg-3">Отвечает по данным клиники: помещения, климат, камеры, события и отчёты</p>
          </div>
        </div>
        <div className="min-h-0 flex-1"><AssistantChat variant="page" /></div>
      </Card>

      <div className="space-y-5">
        <Card i={1} className="p-5">
          <CardHeader title="Что видит AI" icon={Database} sub="Источники данных для ответов" />
          <ul className="mt-4 space-y-2.5">
            {SOURCES.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex items-center gap-2.5 text-fg-2"><s.icon size={15} className="text-fg-3" />{s.label}</span>
                <span className="num text-fg">{s.value}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card i={2} className="p-5">
          <div className="text-sm font-semibold">Приватность</div>
          <p className="mt-2 text-[13px] leading-relaxed text-fg-2">
            AI работает с обезличенными событиями: считает людей и фиксирует движение, но не распознаёт лица и не хранит персональные данные пациентов.
          </p>
        </Card>
      </div>
    </div>
  )
}
