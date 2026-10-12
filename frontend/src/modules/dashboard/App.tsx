import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AiAvatar, AssistantChat, AssistantProvider } from './components/ai/AssistantChat'
import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { RoomDrawer } from './components/plan/RoomDrawer'
import { ToastProvider } from './components/ui/Toast'
import { DataProvider, useData } from './context/DataContext'
import { UiContext } from './context/UiContext'
import { AnalyticsPage } from './pages/Analytics'
import { AssistantPage } from './pages/Assistant'
import { CamerasPage } from './pages/Cameras'
import { DashboardPage } from './pages/Dashboard'
import { ReportsPage } from './pages/Reports'
import { RoomsPage } from './pages/Rooms'
import { SecurityPage } from './pages/Security'
import { SettingsPage } from './pages/Settings'
import type { PageId } from './types'

const PAGES: PageId[] = ['home', 'rooms', 'security', 'cameras', 'analytics', 'reports', 'assistant', 'settings']
/** Адрес раздела: #/dashboard/<страница>. page = null, если страницы в адресе нет или она неизвестна */
const parseHash = () => {
  const [mod, sub] = window.location.hash.replace(/^#\/?/, '').split('/')
  return { mod, page: PAGES.includes(sub as PageId) ? (sub as PageId) : null }
}
const writeHash = (p: PageId) => {
  try {
    window.history.replaceState(null, '', `#/dashboard/${p}`)
  } catch {
    /* sandbox может запрещать изменение URL — навигация работает и без него */
  }
}

/** active = раздел сейчас на экране (скрытый раздел остаётся в памяти, но не реагирует на адрес) */
function DashboardShell({ active }: { active: boolean }) {
  const { rooms } = useData()
  const [page, setPage] = useState<PageId>(() => parseHash().page ?? 'home')
  const [menu, setMenu] = useState(false)
  const [assistant, setAssistant] = useState(false)
  const [roomId, setRoomId] = useState<number | null>(null)

  const activeRef = useRef(active)
  activeRef.current = active
  const pageRef = useRef(page)
  pageRef.current = page

  useEffect(() => {
    const h = () => {
      if (!activeRef.current) return
      const { mod, page: p } = parseHash()
      if (mod !== 'dashboard') return
      setPage(p ?? 'home')
      setMenu(false)
      setAssistant(false)
    }
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])

  // Раздел снова на экране: берём страницу из адреса (ссылка, «назад») или записываем текущую в адрес
  useEffect(() => {
    if (!active) return
    const { mod, page: p } = parseHash()
    if (mod === 'dashboard' && p) setPage(p)
    else writeHash(pageRef.current)
  }, [active])

  const navigate = useCallback((p: PageId) => {
    setMenu(false)
    setAssistant(false)
    if (p === page) return
    writeHash(p)
    setPage(p)
    document.getElementById('main')?.scrollTo({ top: 0 })
    window.scrollTo({ top: 0 })
  }, [page])

  const ui = useMemo(() => ({ navigate, openRoom: setRoomId, openAssistant: () => setAssistant(true) }), [navigate])
  const room = rooms.find((r) => r.id === roomId) ?? null

  const Page = {
    home: DashboardPage, rooms: RoomsPage, security: SecurityPage, cameras: CamerasPage,
    analytics: AnalyticsPage, reports: ReportsPage, assistant: AssistantPage, settings: SettingsPage,
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
          <Topbar onMenu={() => setMenu(true)} onAssistant={() => setAssistant(true)} />
          <main id="main" className="mx-auto w-full max-w-[1520px] flex-1 px-4 pb-10 pt-6 md:px-6">
            <AnimatePresence mode="wait">
              <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
                <Page />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <RoomDrawer room={room} onClose={() => setRoomId(null)} />

      <AnimatePresence>
        {assistant && page !== 'assistant' && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-ink-950/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAssistant(false)} />
            <motion.aside
              role="dialog"
              aria-label="Ассистент директора"
              className="glass-strong fixed bottom-0 right-0 top-0 z-[61] flex w-full max-w-[480px] flex-col rounded-none sm:bottom-3 sm:right-3 sm:top-3 sm:rounded-3xl"
              initial={{ x: '105%' }} animate={{ x: 0 }} exit={{ x: '105%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between border-b border-line p-4">
                <div className="flex items-center gap-3">
                  <AiAvatar size={34} />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">Ассистент директора</div>
                    <div className="text-xs text-fg-3">Анализирует данные клиники в реальном времени</div>
                  </div>
                </div>
                <button type="button" onClick={() => setAssistant(false)} className="grid h-9 w-9 place-items-center rounded-lg text-fg-2 hover:bg-white/5" aria-label="Закрыть">
                  <X size={18} />
                </button>
              </div>
              <div className="min-h-0 flex-1"><AssistantChat variant="panel" /></div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </UiContext.Provider>
  )
}

export default function DashboardApp({ active }: { active: boolean }) {
  return (
    <ToastProvider>
      <DataProvider>
        <AssistantProvider>
          <DashboardShell active={active} />
        </AssistantProvider>
      </DataProvider>
    </ToastProvider>
  )
}
