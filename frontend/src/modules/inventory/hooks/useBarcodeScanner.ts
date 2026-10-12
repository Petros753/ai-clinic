import { useEffect, useRef } from 'react'

/**
 * USB/Bluetooth-сканер в режиме «клавиатуры» (HID keyboard wedge) печатает код
 * очень быстро (≈5–30 мс между символами) и завершает Enter.
 * Хук ловит такие последовательности глобально, когда фокус не в поле ввода,
 * и отличает их от ручного набора по скорости.
 */
export function useBarcodeScanner(onScan: (code: string) => void, { enabled = true, minLength = 6, maxGapMs = 45 } = {}) {
  const buf = useRef('')
  const last = useRef(0)
  const cb = useRef(onScan)
  cb.current = onScan

  useEffect(() => {
    if (!enabled) return
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      const now = performance.now()
      if (now - last.current > maxGapMs) buf.current = ''
      last.current = now

      if (e.key === 'Enter') {
        if (buf.current.length >= minLength) {
          e.preventDefault()
          cb.current(buf.current)
        }
        buf.current = ''
        return
      }
      if (e.key.length === 1) buf.current += e.key
    }
    window.addEventListener('keydown', h, true)
    return () => window.removeEventListener('keydown', h, true)
  }, [enabled, minLength, maxGapMs])
}

/** Для демо без сканера: «печатает» код в окно так же быстро, как настоящий сканер */
export function emulateScan(code: string) {
  const el = document.activeElement as HTMLElement | null
  el?.blur?.()
  let i = 0
  const tick = () => {
    const key = i < code.length ? code[i] : 'Enter'
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
    i++
    if (i <= code.length) setTimeout(tick, 8)
  }
  tick()
}
