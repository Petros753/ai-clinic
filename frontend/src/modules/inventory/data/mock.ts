import type { AppNotification, Category, ClinicInfo, Item, Movement, MovementSource, Staff, Supplier } from '../types'

// Демо-данные склада. Помещения совпадают с планом клиники из AI-дашборда.
// История движений генерируется детерминированно на 45 дней назад от текущей даты,
// поэтому демо всегда выглядит «живым».

export const clinic: ClinicInfo = {
  name: 'Smart Clinic',
  subtitle: 'Склад расходников',
  user: { name: 'Заказчик', role: 'Директор клиники', initials: 'З' },
  version: 'v0.1 · demo',
}

export const rooms = ['Кабинет 14', 'Малая операционная', 'Предоперационная', 'Постоперационная', 'Рентген'] as const

// Порядок и цвета — проверенная категориальная палитра для тёмного фона (CVD ΔE ≥ 8)
export const categories: Category[] = [
  { id: 'ppe', name: 'СИЗ и гигиена', color: '#3987e5' },
  { id: 'anest', name: 'Анестезия', color: '#d95926' },
  { id: 'fill', name: 'Пломбировочные', color: '#199e70' },
  { id: 'endo', name: 'Эндодонтия', color: '#c98500' },
  { id: 'steril', name: 'Стерилизация', color: '#d55181' },
  { id: 'disp', name: 'Одноразовые', color: '#008300' },
  { id: 'impr', name: 'Оттиски', color: '#9085e9' },
]

export const suppliers: Supplier[] = [
  { id: 'dent', name: 'Денталика', contact: '+7 (8512) 00-00-01 · zakaz@dentalika.demo', leadDays: 2 },
  { id: 'stom', name: 'СтомаДепо', contact: '+7 (8512) 00-00-02 · opt@stomadepo.demo', leadDays: 3 },
  { id: 'med', name: 'МедСнаб Юг', contact: '+7 (8512) 00-00-03 · sales@medsnab.demo', leadDays: 1 },
]

export const staff: Staff[] = [
  { id: 'u1', name: 'Заказчик', role: 'Директор', initials: 'З', telegram: '@director' },
  { id: 'u2', name: 'Анна К.', role: 'Старшая медсестра', initials: 'АК', telegram: '@anna_k' },
  { id: 'u3', name: 'Ирина М.', role: 'Ассистент', initials: 'ИМ', telegram: '@irina_m' },
  { id: 'u4', name: 'Олег П.', role: 'Врач-стоматолог', initials: 'ОП' },
  { id: 'u5', name: 'Мария С.', role: 'Администратор', initials: 'МС', telegram: '@maria_admin' },
]

/** EAN-13 с корректной контрольной цифрой (демо-коды, префикс 460 — Россия) */
function ean(body: string): string {
  const d = ('460' + body).slice(0, 12).padEnd(12, '0')
  const sum = d.split('').reduce((s, c, i) => s + Number(c) * (i % 2 ? 3 : 1), 0)
  return d + ((10 - (sum % 10)) % 10)
}

const today = new Date()
const inDays = (n: number) => {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

type Seed = Omit<Item, 'barcode' | 'dailyUse'> & { code: string; use: number }

const seeds: Seed[] = [
  // СИЗ
  { id: 'i01', code: '100000001', sku: 'PPE-GLV-M', name: 'Перчатки нитриловые, M', brand: 'Benovy', categoryId: 'ppe', unit: 'уп', pack: '100 шт', stock: 3, min: 6, max: 20, price: 690, supplierId: 'med', location: 'Шкаф А · полка 1', expiry: inDays(540), use: 1.4 },
  { id: 'i02', code: '100000002', sku: 'PPE-GLV-S', name: 'Перчатки нитриловые, S', brand: 'Benovy', categoryId: 'ppe', unit: 'уп', pack: '100 шт', stock: 9, min: 4, max: 14, price: 690, supplierId: 'med', location: 'Шкаф А · полка 1', expiry: inDays(610), use: 0.9 },
  { id: 'i03', code: '100000003', sku: 'PPE-MSK-3', name: 'Маски трёхслойные', brand: 'Aviora', categoryId: 'ppe', unit: 'уп', pack: '50 шт', stock: 12, min: 4, max: 16, price: 240, supplierId: 'med', location: 'Шкаф А · полка 2', expiry: inDays(900), use: 0.8 },
  { id: 'i04', code: '100000004', sku: 'PPE-CAP', name: 'Шапочки-берет', brand: 'Aviora', categoryId: 'ppe', unit: 'уп', pack: '100 шт', stock: 5, min: 2, max: 8, price: 310, supplierId: 'med', location: 'Шкаф А · полка 2', expiry: null, use: 0.3 },
  { id: 'i05', code: '100000005', sku: 'PPE-BIB', name: 'Нагрудники двухслойные', brand: 'Kerr', categoryId: 'ppe', unit: 'уп', pack: '500 шт', stock: 2, min: 1, max: 4, price: 1450, supplierId: 'stom', location: 'Шкаф А · полка 3', expiry: null, use: 0.12 },
  // Анестезия
  { id: 'i06', code: '200000006', sku: 'AN-ULT-DSF', name: 'Ультракаин Д-С форте 1,7 мл', brand: 'Sanofi', categoryId: 'anest', unit: 'уп', pack: '100 карпул', stock: 1, min: 2, max: 5, price: 4890, supplierId: 'dent', location: 'Сейф · полка 1', expiry: inDays(210), use: 0.21 },
  { id: 'i07', code: '200000007', sku: 'AN-SEPT', name: 'Септанест 1:100 000', brand: 'Septodont', categoryId: 'anest', unit: 'уп', pack: '50 карпул', stock: 3, min: 2, max: 5, price: 2950, supplierId: 'dent', location: 'Сейф · полка 1', expiry: inDays(24), use: 0.15 },
  { id: 'i08', code: '200000008', sku: 'AN-NDL-30G', name: 'Иглы карпульные 30G 0,3×21', brand: 'Septoject', categoryId: 'anest', unit: 'уп', pack: '100 шт', stock: 4, min: 2, max: 6, price: 1320, supplierId: 'dent', location: 'Шкаф Б · полка 1', expiry: inDays(730), use: 0.22 },
  { id: 'i09', code: '200000009', sku: 'AN-GEL', name: 'Гель аппликационный', brand: 'Dentsply', categoryId: 'anest', unit: 'фл', pack: '30 г', stock: 2, min: 1, max: 3, price: 890, supplierId: 'dent', location: 'Шкаф Б · полка 1', expiry: inDays(12), use: 0.06 },
  // Пломбировочные
  { id: 'i10', code: '300000010', sku: 'FL-Z250-A2', name: 'Filtek Z250, A2', brand: '3M', categoryId: 'fill', unit: 'шпр', pack: '4 г', stock: 6, min: 3, max: 10, price: 1780, supplierId: 'stom', location: 'Шкаф Б · полка 2', expiry: inDays(320), use: 0.3 },
  { id: 'i11', code: '300000011', sku: 'FL-Z250-A3', name: 'Filtek Z250, A3', brand: '3M', categoryId: 'fill', unit: 'шпр', pack: '4 г', stock: 2, min: 3, max: 10, price: 1780, supplierId: 'stom', location: 'Шкаф Б · полка 2', expiry: inDays(300), use: 0.35 },
  { id: 'i12', code: '300000012', sku: 'FL-EST-A2', name: 'Estelite Sigma Quick, A2', brand: 'Tokuyama', categoryId: 'fill', unit: 'шпр', pack: '3,8 г', stock: 4, min: 2, max: 6, price: 2150, supplierId: 'stom', location: 'Шкаф Б · полка 2', expiry: inDays(45), use: 0.14 },
  { id: 'i13', code: '300000013', sku: 'FL-SBU', name: 'Адгезив Single Bond Universal', brand: '3M', categoryId: 'fill', unit: 'фл', pack: '5 мл', stock: 3, min: 1, max: 4, price: 5400, supplierId: 'stom', location: 'Холодильник', expiry: inDays(160), use: 0.07 },
  { id: 'i14', code: '300000014', sku: 'FL-ETCH', name: 'Протравка гель 37%', brand: 'Vococid', categoryId: 'fill', unit: 'шпр', pack: '2 мл', stock: 7, min: 3, max: 10, price: 390, supplierId: 'stom', location: 'Шкаф Б · полка 2', expiry: inDays(400), use: 0.28 },
  { id: 'i15', code: '300000015', sku: 'FL-FUJI9', name: 'Fuji IX GP, стеклоиономер', brand: 'GC', categoryId: 'fill', unit: 'наб', pack: '15 г + 6,4 мл', stock: 1, min: 1, max: 2, price: 6900, supplierId: 'stom', location: 'Шкаф Б · полка 3', expiry: inDays(260), use: 0.03 },
  // Эндо
  { id: 'i16', code: '400000016', sku: 'EN-KF-15', name: 'K-файлы 25 мм, №15', brand: 'Mani', categoryId: 'endo', unit: 'уп', pack: '6 шт', stock: 8, min: 3, max: 10, price: 520, supplierId: 'dent', location: 'Шкаф В · полка 1', expiry: null, use: 0.2 },
  { id: 'i17', code: '400000017', sku: 'EN-PTG', name: 'ProTaper Gold, 25 мм', brand: 'Dentsply', categoryId: 'endo', unit: 'уп', pack: '6 шт', stock: 0, min: 1, max: 4, price: 5200, supplierId: 'dent', location: 'Шкаф В · полка 1', expiry: null, use: 0.08 },
  { id: 'i18', code: '400000018', sku: 'EN-NAOCL', name: 'Гипохлорит натрия 3%', brand: 'Омега-Дент', categoryId: 'endo', unit: 'фл', pack: '100 мл', stock: 4, min: 2, max: 6, price: 210, supplierId: 'dent', location: 'Шкаф В · полка 2', expiry: inDays(180), use: 0.18 },
  { id: 'i19', code: '400000019', sku: 'EN-GP', name: 'Гуттаперчевые штифты 04', brand: 'Meta', categoryId: 'endo', unit: 'уп', pack: '60 шт', stock: 3, min: 2, max: 5, price: 480, supplierId: 'dent', location: 'Шкаф В · полка 2', expiry: inDays(500), use: 0.07 },
  { id: 'i20', code: '400000020', sku: 'EN-AHP', name: 'AH Plus, силер', brand: 'Dentsply', categoryId: 'endo', unit: 'наб', pack: '2×4 мл', stock: 1, min: 1, max: 2, price: 4300, supplierId: 'dent', location: 'Шкаф В · полка 2', expiry: inDays(75), use: 0.02 },
  // Стерилизация
  { id: 'i21', code: '500000021', sku: 'ST-PKG-100', name: 'Крафт-пакеты 100×200', brand: 'СтериТ', categoryId: 'steril', unit: 'уп', pack: '100 шт', stock: 6, min: 3, max: 10, price: 560, supplierId: 'med', location: 'Предоперационная', expiry: inDays(700), use: 0.4 },
  { id: 'i22', code: '500000022', sku: 'ST-IND', name: 'Индикаторы стерилизации 132°', brand: 'Винар', categoryId: 'steril', unit: 'уп', pack: '500 шт', stock: 1, min: 1, max: 3, price: 980, supplierId: 'med', location: 'Предоперационная', expiry: inDays(20), use: 0.04 },
  { id: 'i23', code: '500000023', sku: 'ST-WIPE', name: 'Дезинфицирующие салфетки', brand: 'Оптимакс', categoryId: 'steril', unit: 'уп', pack: '120 шт', stock: 2, min: 3, max: 8, price: 450, supplierId: 'med', location: 'Предоперационная', expiry: inDays(330), use: 0.45 },
  { id: 'i24', code: '500000024', sku: 'ST-CONC', name: 'Дезсредство концентрат 1 л', brand: 'Лизоформин', categoryId: 'steril', unit: 'фл', pack: '1 л', stock: 5, min: 2, max: 6, price: 1150, supplierId: 'med', location: 'Тех. помещение', expiry: inDays(420), use: 0.1 },
  // Одноразовые
  { id: 'i25', code: '600000025', sku: 'DS-SAL', name: 'Слюноотсосы', brand: 'Latus', categoryId: 'disp', unit: 'уп', pack: '100 шт', stock: 4, min: 3, max: 10, price: 280, supplierId: 'stom', location: 'Шкаф А · полка 3', expiry: null, use: 0.5 },
  { id: 'i26', code: '600000026', sku: 'DS-COT', name: 'Валики ватные №2', brand: 'Celluron', categoryId: 'disp', unit: 'уп', pack: '300 шт', stock: 7, min: 2, max: 8, price: 350, supplierId: 'stom', location: 'Шкаф А · полка 3', expiry: null, use: 0.25 },
  { id: 'i27', code: '600000027', sku: 'DS-BRUSH', name: 'Микробраши', brand: 'Latus', categoryId: 'disp', unit: 'уп', pack: '100 шт', stock: 24, min: 3, max: 8, price: 260, supplierId: 'stom', location: 'Шкаф Б · полка 3', expiry: null, use: 0.15 },
  { id: 'i28', code: '600000028', sku: 'DS-CUP', name: 'Стаканы одноразовые 200 мл', brand: 'Latus', categoryId: 'disp', unit: 'уп', pack: '100 шт', stock: 5, min: 2, max: 8, price: 170, supplierId: 'med', location: 'Тех. помещение', expiry: null, use: 0.3 },
  // Оттиски
  { id: 'i29', code: '700000029', sku: 'IM-ALG', name: 'Альгинатная масса', brand: 'Zhermack', categoryId: 'impr', unit: 'уп', pack: '453 г', stock: 2, min: 1, max: 4, price: 890, supplierId: 'stom', location: 'Шкаф В · полка 3', expiry: inDays(250), use: 0.06 },
  { id: 'i30', code: '700000030', sku: 'IM-SIL-A', name: 'Силикон А-типа, лайт', brand: 'Zhermack', categoryId: 'impr', unit: 'наб', pack: '2×50 мл', stock: 1, min: 1, max: 3, price: 3100, supplierId: 'stom', location: 'Шкаф В · полка 3', expiry: inDays(190), use: 0.04 },
]

export const items: Item[] = seeds.map(({ code, use, ...s }) => ({ ...s, barcode: ean(code), dailyUse: use }))

// ---------- генерация истории ----------

/** Детерминированный ГПСЧ, чтобы демо не «прыгало» между перезагрузками */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const HISTORY_DAYS = 45

function genMovements(): Movement[] {
  const r = rng(20260928)
  const out: Movement[] = []
  const workers = ['Анна К.', 'Ирина М.', 'Олег П.']
  let n = 0
  const at = (dayAgo: number, h: number, m: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() - dayAgo)
    d.setHours(h, m, 0, 0)
    return d
  }

  for (let day = HISTORY_DAYS; day >= 0; day--) {
    const date = at(day, 0, 0)
    const weekday = date.getDay()
    if (weekday === 0) continue // воскресенье — выходной
    const load = weekday === 6 ? 0.55 : 1

    for (const it of items) {
      // расход: вероятностно, в среднем ≈ dailyUse
      let rest = it.dailyUse * load * (0.7 + r() * 0.6)
      while (rest > 0) {
        if (r() < Math.min(rest, 1)) {
          const h = 9 + Math.floor(r() * 10)
          const ts = at(day, h, Math.floor(r() * 60))
          if (day === 0 && ts > today) break
          out.push({
            id: `m${++n}`,
            ts: ts.toISOString(),
            itemId: it.id,
            type: 'out',
            qty: 1,
            user: workers[Math.floor(r() * workers.length)],
            room: it.categoryId === 'steril' ? 'Предоперационная' : rooms[Math.floor(r() * (rooms.length - 1))],
            source: (r() < 0.82 ? 'scanner' : r() < 0.5 ? 'bot' : 'manual') as MovementSource,
          })
        }
        rest -= 1
      }
    }

    // поставки: по понедельникам и четвергам от поставщика, раз в ~10 дней
    if ((weekday === 1 || weekday === 4) && day > 0) {
      const sup = suppliers[(Math.floor(day / 3) + weekday) % suppliers.length]
      const batch = items.filter((i) => i.supplierId === sup.id && r() < 0.45)
      for (const it of batch) {
        out.push({
          id: `m${++n}`,
          ts: at(day, 10 + Math.floor(r() * 3), Math.floor(r() * 60)).toISOString(),
          itemId: it.id,
          type: 'in',
          qty: Math.max(1, Math.round(it.max * (0.3 + r() * 0.4))),
          user: 'Анна К.',
          note: `Поставка ${sup.name}`,
          source: 'scanner',
        })
      }
    }
  }

  // пара списаний по сроку годности — для правдоподобия
  out.push({ id: `m${++n}`, ts: at(9, 17, 40).toISOString(), itemId: 'i09', type: 'writeoff', qty: 1, user: 'Анна К.', note: 'Истёк срок годности', source: 'manual' })
  out.push({ id: `m${++n}`, ts: at(21, 18, 5).toISOString(), itemId: 'i12', type: 'writeoff', qty: 1, user: 'Анна К.', note: 'Повреждена упаковка', source: 'scanner' })

  return out.sort((a, b) => b.ts.localeCompare(a.ts))
}

export const movements: Movement[] = genMovements()

export const notifications: AppNotification[] = [
  { id: 'n1', severity: 'alarm', title: 'Закончилось: ProTaper Gold', text: 'Остаток 0 уп. Добавлено в заказ Денталике.', time: '09:12', read: false },
  { id: 'n2', severity: 'warning', title: 'Ниже минимума: 5 позиций', text: 'Перчатки M, Ультракаин, Filtek A3, салфетки, стеклоиономер.', time: '08:30', read: false },
  { id: 'n3', severity: 'warning', title: 'Истекает срок: Гель аппликационный', text: 'Годен ещё 12 дней, на складе 2 фл.', time: '08:30', read: false },
  { id: 'n4', severity: 'ai', title: 'Прогноз: перчатки M закончатся через 2 дня', text: 'Расход вырос на 18% за неделю. Рекомендуем заказать сегодня.', time: 'вчера', read: true },
  { id: 'n5', severity: 'info', title: 'Поставка принята', text: 'МедСнаб Юг · 6 позиций отсканировано.', time: 'вчера', read: true },
]
