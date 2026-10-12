import clsx from 'clsx'
import { Bell, Database, ScanBarcode, Send, Users } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button, Card, CardHeader, PageHeader } from '../components/ui'
import { Field, Input } from '../components/ui/extra'
import { useToast } from '../components/ui/Toast'
import { DEMO as isDemo } from '../../../shell/auth'
import { staff } from '../data/catalog'
import { EXPIRY_WARN_DAYS } from '../lib/stock'

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={clsx('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-accent' : 'bg-white/10')}>
      <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

function Row({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm text-fg">{title}</div>
        {sub && <div className="text-xs text-fg-3">{sub}</div>}
      </div>
      {children}
    </div>
  )
}

export function SettingsPage() {
  const toast = useToast()
  const [n, setN] = useState({ low: true, out: true, expiry: true, digest: true, orders: true })
  const [roles, setRoles] = useState<Record<string, boolean>>(() => Object.fromEntries(staff.map((s) => [s.id, !!s.telegram])))

  return (
    <>
      <PageHeader title="Настройки" sub="Уведомления, сотрудники, сканер и интеграции" />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card i={0} className="p-5">
          <CardHeader title="Уведомления в Telegram" icon={Bell} />
          <div className="mt-2 divide-y divide-line">
            <Row title="Ниже минимума" sub="Сразу, когда остаток опустился ниже порога"><Toggle label="Ниже минимума" on={n.low} onChange={(v) => setN({ ...n, low: v })} /></Row>
            <Row title="Позиция закончилась" sub="Срочное уведомление директору"><Toggle label="Закончилось" on={n.out} onChange={(v) => setN({ ...n, out: v })} /></Row>
            <Row title="Истекает срок годности" sub={`За ${EXPIRY_WARN_DAYS} дней до окончания`}><Toggle label="Срок годности" on={n.expiry} onChange={(v) => setN({ ...n, expiry: v })} /></Row>
            <Row title="Утренняя сводка" sub="В 08:30 — что заказать сегодня"><Toggle label="Утренняя сводка" on={n.digest} onChange={(v) => setN({ ...n, digest: v })} /></Row>
            <Row title="Заявки на согласование" sub="Директору — с кнопкой «Согласовать»"><Toggle label="Заявки" on={n.orders} onChange={(v) => setN({ ...n, orders: v })} /></Row>
          </div>
        </Card>

        <Card i={1} className="p-5">
          <CardHeader title="Сотрудники и получатели" icon={Users} />
          <ul className="mt-2 divide-y divide-line">
            {staff.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2b3c55] to-[#1a2536] text-xs font-semibold ring-1 ring-white/10">{s.initials}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-fg">{s.name}</div>
                  <div className="truncate text-xs text-fg-3">{s.role}{s.telegram ? ` · ${s.telegram}` : ' · Telegram не привязан'}</div>
                </div>
                <Toggle label={`Уведомления для ${s.name}`} on={roles[s.id]} onChange={(v) => setRoles({ ...roles, [s.id]: v })} />
              </li>
            ))}
          </ul>
        </Card>

        <Card i={2} className="p-5">
          <CardHeader title="Сканер штрихкодов" icon={ScanBarcode} />
          <div className="mt-3 space-y-3 text-sm leading-relaxed text-fg-2">
            <p>Подойдёт любой USB- или Bluetooth-сканер 1D/2D в режиме клавиатуры (HID) с суффиксом Enter — так настроены почти все сканеры с завода.</p>
            <p>Панель отличает сканер от ручного набора по скорости ввода, поэтому сканировать можно с любой страницы — откроется экран операции.</p>
            <p className="text-fg-3">Поддерживаются EAN-13, EAN-8, Code 128, DataMatrix (маркировка «Честный знак» — при 2D-сканере).</p>
          </div>
        </Card>

        <Card i={3} className="p-5">
          <CardHeader title="Интеграции" icon={Database} />
          <div className="mt-3 space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line p-3">
              <div>
                <div className="text-sm text-fg">Источник данных</div>
                <div className="text-xs text-fg-3">{isDemo ? 'Демо: данные в памяти браузера, сбрасываются при перезагрузке' : 'REST API подключён'}</div>
              </div>
              <span className={clsx('rounded-full px-2.5 py-1 text-xs font-medium', isDemo ? 'bg-warn/10 text-warn' : 'bg-ok/10 text-ok')}>{isDemo ? 'Demo' : 'Online'}</span>
            </div>
            <Field label="Telegram-бот" hint="Токен от @BotFather — задаётся на сервере, в браузер не передаётся">
              <div className="flex gap-2">
                <Input value="@smartclinic_sklad_bot" readOnly className="font-mono" />
                <Button variant="ghost" icon={Send} onClick={() => toast('Тестовое сообщение отправлено в Telegram (демо)')}>Тест</Button>
              </div>
            </Field>
            <p className="text-xs leading-relaxed text-fg-3">
              Экспорт остатков и журнала — CSV со страниц «Номенклатура» и «Журнал». Выгрузку в 1С или МойСклад можно добавить на следующем этапе.
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
