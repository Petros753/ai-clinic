import { createContext, useContext } from 'react'
import type { PageId } from '../types'

export interface UiCtx {
  navigate: (p: PageId) => void
  openRoom: (id: number) => void
  openAssistant: () => void
}

export const UiContext = createContext<UiCtx>({
  navigate: () => {},
  openRoom: () => {},
  openAssistant: () => {},
})

export const useUi = () => useContext(UiContext)
