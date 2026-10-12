import clsx from 'clsx'
import { motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { fmtTime, useClock } from '../../hooks/useClock'
import type { Camera } from '../../types'

/**
 * Превью камеры. В демо — стилизованная схема сцены (реальных видеопотоков нет).
 * В проде сюда встраивается HLS/WebRTC-поток из видеорегистратора.
 */
export function CameraFeed({ camera, className, showMeta = true }: { camera: Camera; className?: string; showMeta?: boolean }) {
  const now = useClock()
  const hue = camera.outdoor ? 'from-[#101a22] via-[#0c141c] to-[#070b10]' : 'from-[#141d2a] via-[#0e1621] to-[#080c12]'
  const seed = camera.id * 37
  return (
    <div className={clsx('relative aspect-video overflow-hidden rounded-xl border border-line bg-gradient-to-br', hue, className)}>
      {camera.online ? (
        <>
          <svg viewBox="0 0 320 180" className="absolute inset-0 h-full w-full" preserveAspectRatio="none" aria-hidden>
            <defs>
              <filter id={`n${camera.id}`}>
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
                <feColorMatrix values="0 0 0 0 0.6  0 0 0 0 0.7  0 0 0 0 0.8  0 0 0 0.06 0" />
              </filter>
              <radialGradient id={`v${camera.id}`} cx="50%" cy="45%" r="75%">
                <stop offset="0.55" stopColor="#000" stopOpacity="0" />
                <stop offset="1" stopColor="#000" stopOpacity="0.55" />
              </radialGradient>
            </defs>
            {camera.outdoor ? (
              <g stroke="rgba(170,195,225,0.16)" strokeWidth="1" fill="none">
                <path d="M0 120 L320 104" />
                <path d="M40 180 L150 108 M280 180 L190 106" />
                <path d="M210 104 V40 H300 V100" />
                <path d="M225 104 V60 H250 V104" />
                <circle cx="60" cy="40" r="14" stroke="rgba(170,195,225,0.08)" />
              </g>
            ) : (
              <g stroke="rgba(170,195,225,0.16)" strokeWidth="1" fill="none">
                <path d="M0 0 L110 60 H210 L320 0" />
                <path d="M0 180 L110 125 H210 L320 180" />
                <path d="M110 60 V125 M210 60 V125" />
                <path d="M130 125 V82 H160 V125" />
                <path d="M235 150 h45 v-18 h-45z M20 150 h60 v-14 h-60z" stroke="rgba(170,195,225,0.1)" />
              </g>
            )}
            <rect width="320" height="180" filter={`url(#n${camera.id})`} />
            <rect width="320" height="180" fill={`url(#v${camera.id})`} />
          </svg>

          {Array.from({ length: Math.min(camera.people, 3) }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-[3px] border border-accent/80 bg-accent/[0.06]"
              style={{ width: '9%', height: '34%', top: `${40 + (i % 2) * 6}%`, left: `${22 + i * 22}%` }}
              animate={{ x: [0, 10 - i * 6, 0], y: [0, 3, 0] }}
              transition={{ duration: 6 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="absolute -top-4 left-0 whitespace-nowrap rounded bg-accent/85 px-1 text-[8px] font-medium text-ink-950">человек</span>
            </motion.div>
          ))}

          {showMeta && (
            <>
              <div className="absolute left-2.5 top-2 flex items-center gap-1.5 text-[10px] font-medium text-white/85">
                <span className="alarm-pulse h-1.5 w-1.5 rounded-full bg-crit" />
                REC
              </div>
              <div className="num absolute right-2.5 top-2 font-mono text-[10px] text-white/70">{fmtTime(now)}:{String(now.getSeconds()).padStart(2, '0')}</div>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-6">
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-white">{camera.name}</div>
                  <div className="text-[10px] text-white/55">CAM {String(camera.id).padStart(2, '0')} · {camera.zone}</div>
                </div>
                {camera.people > 0 && <span className="num rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-accent">{camera.people} чел.</span>}
              </div>
            </>
          )}
        </>
      ) : (
        <div className="absolute inset-0 grid place-items-center text-center text-xs text-fg-3">
          <div><WifiOff className="mx-auto mb-2" size={20} />Нет сигнала</div>
        </div>
      )}
    </div>
  )
}
