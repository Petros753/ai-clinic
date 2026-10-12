import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ItemDrawer } from './components/items/ItemDrawer'
import type { DrawerState } from './components/items/ItemDrawer'
import { BottomNav } from './components/layout/BottomNav'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { ToastProvider } from './components/ui/Toast'
import { DataProvider } from './context/DataContext'
import { UiContext } from './context/UiContext'
import { useBarcodeScanner } from './hooks/useBarcodeScanner'
import { AnalyticsPage } from './pages/Analytics'
import { BotPage } from './pages/Bot'
import { DashboardPage } from './pages/Dashboard'
import { ItemsPage } from './pages/Items'
import { MovementsPage } from './pages/Movements'
import { OrdersPage } from './pages/Orders'
import { ScanPage } from './pages/Scan'
import { SettingsPage } from './pages/Settings'
import type { PageId } from './types'

const PAGES: PageId[] = ['home', 'scan', 'items', 'movements', 'orders', 'analytics', 'bot', 'settings']
/** Адрес раздела: #/sklad/<страница>. page = null, если страницы в адресе нет или она неизвестна */
const parseHash = () => {
  const [mod, sub] = window.location.hash.replace(/^#\/?/, '').split('/')
  return { mod, page: PAGES.includes(sub as PageId) ? (sub as PageId) : null }
}
const writeHash = (p: PageId) => {
  try {
    window.history.replaceState(null, '', `#/sklad/${p}`)
  } catch {
    /* в песочнице изменение URL может быть запрещено — навигация работает и без него */
  }
}

/** active = раздел сейчас на экране (скрытый раздел остаётся в памяти, но не реагирует на адрес и сканер) */
function InventoryShell({ active }: { active: boolean }) {
  const [page, setPage] = useState<PageId>(() => parseHash().page ?? 'home')
  const [menu, setMenu] = useState(false)
  const [drawer, setDrawer] = useState<DrawerState>(null)
  const [incoming, setIncoming] = useState<{ code: string; n: number } | null>(null)
  const scanN = useRef(0)
  const activeRef = useRef(active)
  activeRef.current = active
  const pageRef = useRef(page)
  pageRef.current = page

  useEffect(() => {
    const h = () => {
      if (!activeRef.current) return
      const { mod, page: p } = parseHash()
      if (mod !== 'sklad') return
      setPage(p ?? 'home')
      setDrawer(null)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])

  // Раздел снова на экране: берём страницу из адреса (ссылка, «назад») или записываем текущую в адрес
  useEffect(() => {
    if (!active) return
    const { mod, page: p } = parseHash()
    if (mod === 'sklad' && p) setPage(p)
    else writeHash(pageRef.current)
  }, [active])

  const navigate = useCallback((p: PageId) => {
    setMenu(false)
    setDrawer(null)
    if (p === page) return
    writeHash(p)
    setPage(p)
    window.scrollTo({ top: 0 })
  }, [page])

  // Глобальный сканер: скан на любой странице ведёт на экран операции
  useBarcodeScanner((code) => {
    setDrawer(null)
    setMenu(false)
    if (page !== 'scan') navigate('scan')
    setIncoming({ code, n: ++scanN.current })
  }, { enabled: active })

  const closeDrawer = useCallback(() => setDrawer(null), [])
  const ui = useMemo(() => ({
    navigate,
    openItem: (id: string) => setDrawer({ mode: 'view', id }),
    newItem: (barcode?: string) => setDrawer({ mode: 'new', barcode }),
    incoming,
  }), [navigate, incoming])

  const Page = {
    home: DashboardPage, scan: ScanPage, items: ItemsPage, movements: MovementsPage,
    orders: OrdersPage, analytics: AnalyticsPage, bot: BotPage, settings: SettingsPage,
  }[page]

  return (
    <UiContext.Provider value={ui}>
      <div className="flex min-h-full">
        <aside className="sticky top-[var(--shell-h)] hidden h-[calc(100vh_-_var(--shell-h))] w-[248px] shrink-0 border-r border-line bg-ink-900/60 backdrop-blur-xl lg:block">
          <Sidebar page={page} onNavigate={navigate} />
        </aside>

        <AnimatePresence>
          {menu && (
            <>
              <motion.div className="fixed inset-0 z-[55] bg-ink-950/70 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)} />
              <motion.aside
                className="fixed inset-y-0 left-0 z-[56] w-[272px] border-r border-line bg-ink-900 lg:hidden"
                initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 360, damping: 36 }}
              >
                <Sidebar page={page} onNavigate={navigate} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main id="main" className="mx-auto w-full max-w-[1520px] flex-1 px-4 pb-28 pt-5 md:px-6 md:pt-6 lg:pb-10">
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                <Page />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <BottomNav page={page} onNavigate={navigate} onMore={() => setMenu(true)} />
      <ItemDrawer state={drawer} onClose={closeDrawer} />
    </UiContext.Provider>
  )
}

export default function InventoryApp({ active }: { active: boolean }) {
  return (
    <ToastProvider>
      <DataProvider>
        <InventoryShell active={active} />
      </DataProvider>
    </ToastProvider>
  )
}
