import clsx from 'clsx'
import { motion } from 'framer-motion'
import { AudioLines, CircleAlert, Clock, Lightbulb, Pause, Play, Quote, ThumbsDown, ThumbsUp, TriangleAlert } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { CHECKLIST, doctorOf, score, talkShare } from './data/visits'
import type { Speaker, Visit } from './data/visits'
import { Card, Head, MarkIcon, ScoreRing, TONE, tone } from './ui'

const SPEAKER: Record<Speaker, { label: string; cls: string }> = {
  doc: { label: 'Врач', cls: 'bg-accent/15 text-accent' },
  pat: { label: 'Пациент', cls: 'bg-ai/15 text-ai' },
  asst: { label: 'Ассистент', cls: 'bg-white/[0.06] text-fg-2' },
}

const toSec = (t: string) => { const [m, s] = t.split(':').map(Number); return m * 60 + s }
const fmt = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.floor(sec % 60)).padStart(2, '0')}`

/** Имена в расшифровке замаскированы — подсвечиваем маску */
function Masked({ text }: { text: string }) {
  return <>{text.split(/(\[ИМЯ\])/g).map((p, i) => p === '[ИМЯ]' ? <span key={i} className="rounded bg-white/[0.08] px-1 font-mono text-[11px] text-fg-3" title="Имя пациента скрыто">имя скрыто</span> : <span key={i}>{p}</span>)}</>
}

export function VisitDetail({ v }: { v: Visit }) {
  const d = doctorOf(v)
  const sc = score(v)
  const t = TONE[tone(sc)]
  const share = talkShare(v)
  const [hl, setHl] = useState<number | null>(null)
  const lineRefs = useRef<(HTMLLIElement | null)[]>([])
  const total = v.duration * 60

  useEffect(() => { setHl(null) }, [v.id])

  const jump = (i: number) => {
    setHl(i)
    lineRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const counts = useMemo(() => ({
    ok: v.checks.filter((c) => c.mark === 'ok').length,
    partial: v.checks.filter((c) => c.mark === 'partial').length,
    fail: v.checks.filter((c) => c.mark === 'fail').length,
  }), [v])

  return (
    <motion.div key={v.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-4">
      {/* шапка */}
      <Card className="p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <ScoreRing value={sc} size={72} />
          <div className="min-w-0 flex-1">
            <div className="text-xs text-fg-3">{v.time} · {v.room}</div>
            <h2 className="mt-0.5 text-xl font-semibold leading-snug text-fg">{v.service}</h2>
            <div className="mt-1 text-sm text-fg-2">{d.name} · {d.role} · пациент <span className="font-mono text-fg">{v.patient}</span> ({v.patientInfo})</div>
          </div>
          <div className="flex basis-full flex-wrap gap-2 text-xs md:basis-auto">
            <span className={clsx('rounded-full px-2.5 py-1 font-medium ring-1 ring-inset', t.bg, t.text, t.ring)}>{t.label}</span>
            <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1', v.duration > v.planned ? 'border-warn/30 text-warn' : 'border-line text-fg-2')}>
              <Clock size={12} />{v.duration} из {v.planned} мин
            </span>
          </div>
        </div>

        {v.flags.length > 0 && (
          <ul className="mt-4 space-y-2">
            {v.flags.map((f) => (
              <li key={f.text} className={clsx('flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm', f.level === 'crit' ? 'border-crit/30 bg-crit/[0.07] text-crit' : 'border-warn/30 bg-warn/[0.07] text-warn')}>
                {f.level === 'crit' ? <CircleAlert size={16} className="shrink-0" /> : <TriangleAlert size={16} className="shrink-0" />}
                <span className="font-medium">{f.text}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-[15px] leading-relaxed text-fg-2">{v.summary}</p>
      </Card>

      {/* хорошо / плохо / улучшить */}
      <div className="grid gap-4 lg:grid-cols-3">
        {([
          { title: 'Сделано хорошо', icon: ThumbsUp, items: v.good, cls: 'text-ok', dot: 'bg-ok' },
          { title: 'Сделано плохо', icon: ThumbsDown, items: v.bad, cls: 'text-crit', dot: 'bg-crit' },
          { title: 'Что улучшить', icon: Lightbulb, items: v.improve, cls: 'text-ai', dot: 'bg-ai' },
        ] as const).map((b) => (
          <Card key={b.title} className="p-4">
            <div className={clsx('flex items-center gap-2 text-sm font-semibold', b.cls)}><b.icon size={16} />{b.title}</div>
            <ul className="mt-3 space-y-2">
              {b.items.map((x) => (
                <li key={x} className="flex gap-2.5 text-sm leading-snug text-fg-2">
                  <span className={clsx('mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full', b.dot)} />{x}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* чек-лист */}
      <Card className="p-4 md:p-5">
        <Head
          title="Чек-лист приёма"
          sub="стандарт клиники · нажмите на цитату, чтобы найти место в разговоре"
          right={<div className="num flex shrink-0 gap-3 text-xs"><span className="text-ok">✓ {counts.ok}</span><span className="text-warn">± {counts.partial}</span><span className="text-crit">✕ {counts.fail}</span></div>}
        />
        <ul className="mt-4 divide-y divide-line">
          {CHECKLIST.map((item) => {
            const c = v.checks.find((x) => x.id === item.id)!
            return (
              <li key={item.id} className={clsx('flex items-start gap-3 py-2.5', c.mark === 'na' && 'opacity-50')}>
                <MarkIcon mark={c.mark} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
                    {item.title}
                    {item.critical && c.mark === 'fail' && <span className="rounded bg-crit/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-crit">критично</span>}
                  </div>
                  <div className="text-xs leading-relaxed text-fg-3">{c.note}</div>
                </div>
                {c.quote != null && (
                  <button type="button" onClick={() => jump(c.quote!)} className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2 py-1 font-mono text-[11px] text-fg-2 transition hover:border-accent/40 hover:text-accent">
                    <Quote size={11} />{v.lines[c.quote].t}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      {/* расшифровка */}
      <Card className="overflow-hidden">
        <div className="border-b border-line p-4 md:p-5">
          <Head title="Расшифровка разговора" icon={AudioLines} sub={`${v.lines.length} реплик · голоса разделены автоматически, имена скрыты · в демо без звука`} />
          <Player total={total} lines={v.lines.map((l) => toSec(l.t))} active={hl} onSeek={jump} key={v.id} />
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[11px] text-fg-3"><span>Говорил врач · {share}%</span><span>Пациент и ассистент · {100 - share}%</span></div>
            <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full">
              <div className="bg-accent" style={{ width: `${share}%` }} />
              <div className="flex-1 bg-ai" />
            </div>
          </div>
        </div>
        <ul className="max-h-[520px] divide-y divide-white/[0.04] overflow-y-auto">
          {v.lines.map((l, i) => {
            const quoted = v.checks.some((c) => c.quote === i)
            return (
              <li
                key={i}
                ref={(el) => { lineRefs.current[i] = el }}
                className={clsx('flex gap-3 px-4 py-2.5 transition-colors duration-500 md:px-5', hl === i ? 'bg-accent/[0.12]' : quoted ? 'bg-white/[0.015]' : '')}
              >
                <button type="button" onClick={() => setHl(i)} className="num w-11 shrink-0 pt-0.5 text-left font-mono text-[11px] text-fg-3 hover:text-accent">{l.t}</button>
                <span className={clsx('h-fit w-[74px] shrink-0 rounded-md px-1.5 py-0.5 text-center text-[11px] font-medium', SPEAKER[l.s].cls)}>{SPEAKER[l.s].label}</span>
                <p className={clsx('min-w-0 flex-1 text-sm leading-relaxed', l.s === 'doc' ? 'text-fg' : 'text-fg-2', l.text.startsWith('(') && 'italic text-fg-3')}>
                  <Masked text={l.text} />
                </p>
              </li>
            )
          })}
        </ul>
      </Card>
    </motion.div>
  )
}

/** Плеер записи. В демо звука нет: полоса показывает таймлайн разговора и метки реплик. */
function Player({ total, lines, active, onSeek }: { total: number; lines: number[]; active: number | null; onSeek: (i: number) => void }) {
  const [pos, setPos] = useState(active != null ? lines[active] : 0)
  const [play, setPlay] = useState(false)
  const bars = useMemo(() => Array.from({ length: 96 }, (_, i) => {
    const sec = (i / 96) * total
    const near = lines.some((s) => Math.abs(s - sec) < total / 60)
    return near ? 0.45 + ((i * 37) % 11) / 20 : 0.12 + ((i * 13) % 7) / 40
  }), [total, lines])

  useEffect(() => { if (active != null) setPos(lines[active]) }, [active, lines])
  useEffect(() => {
    if (!play) return
    const id = setInterval(() => setPos((p) => (p + 8 >= total ? (setPlay(false), total) : p + 8)), 120)
    return () => clearInterval(id)
  }, [play, total])

  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const sec = ((e.clientX - r.left) / r.width) * total
    let best = 0
    lines.forEach((s, i) => { if (Math.abs(s - sec) < Math.abs(lines[best] - sec)) best = i })
    onSeek(best)
  }

  return (
    <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-white/[0.02] p-2.5">
      <button type="button" onClick={() => setPlay((p) => !p)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-ink-950 transition hover:brightness-110" aria-label={play ? 'Пауза' : 'Воспроизвести'}>
        {play ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <div className="relative flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-[2px]" onClick={seek} role="slider" aria-label="Позиция записи" aria-valuemin={0} aria-valuemax={total} aria-valuenow={pos}>
        {bars.map((h, i) => (
          <span key={i} className={clsx('flex-1 rounded-full', (i / 96) * total <= pos ? 'bg-accent' : 'bg-white/15')} style={{ height: `${h * 100}%` }} />
        ))}
      </div>
      <span className="num shrink-0 font-mono text-[11px] text-fg-3">{fmt(pos)} / {fmt(total)}</span>
    </div>
  )
}
