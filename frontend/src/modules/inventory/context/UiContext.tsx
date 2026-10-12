import { createContext, useContext } from 'react'
import type { PageId } from '../types'

export interface UiCtx {
  navigate: (p: PageId) => void
  /** Открыть карточку позиции */
  openItem: (id: string) => void
  /** Открыть форму новой позиции (например, после скана неизвестного штрихкода) */
  newItem: (barcode?: string) => void
  /** Последний штрихкод от сканера. n растёт с каждым сканом, даже если код тот же */
  incoming: { code: string; n: number } | null
}

export const UiContext = createContext<UiCtx>({
  navigate: () => {},
  openItem: () => {},
  newItem: () => {},
  incoming: null,
})

export const useUi = () => useContext(UiContext)
