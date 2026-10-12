import type {
  AppNotification,
  Camera,
  CameraInsight,
  ClinicOverview,
  ReportData,
  Room,
  SecurityEvent,
} from '../types'

// ─────────────────────────────────────────────────────────────
// Demo data. Все значения — тестовые. В продакшене приходят из API.
// ─────────────────────────────────────────────────────────────

export const clinic: ClinicOverview = {
  name: 'Smart Clinic',
  subtitle: 'Стоматологическая клиника · 99 м²',
  open: true,
  systemsOk: true,
  director: { name: 'Артём', role: 'Директор клиники', initials: 'А' },
  version: 'v1.0 · demo',
}

const eq = (id: string, name: string, online = true) => ({ id, name, online })

export const rooms: Room[] = [
  {
    id: 14, name: 'Кабинет 14', shortName: 'Кабинет 14', kind: 'clinical', status: 'active',
    occupied: true, workplace: true, temperature: 22.1, targetTemperature: 22, humidity: 46, co2: 650,
    devices: { ac: true, vent: true, light: true, blinds: 40 },
    equipment: [eq('u14', 'Стоматологическая установка'), eq('r14', 'Рециркулятор'), eq('ac14', 'Кондиционер'), eq('v14', 'Вытяжка')],
    activity: 'Идёт приём', lastActivity: 'сейчас', usageToday: '6 ч 24 мин', loadPercent: 78,
    events: [
      { time: '16:32', text: 'Начало приёма', severity: 'info' },
      { time: '14:05', text: 'Проветривание завершено, CO₂ 580 ppm', severity: 'info' },
      { time: '08:52', text: 'Помещение подготовлено к работе', severity: 'info' },
    ],
    shape: '1050,565 1390,565 1390,735 1300,855 955,855 950,700 1000,620', labelAt: [1190, 700],
  },
  {
    id: 3, name: 'Малая операционная', shortName: 'Операционная', kind: 'clinical', status: 'warning',
    occupied: false, workplace: true, temperature: 23.8, targetTemperature: 22, humidity: 41, co2: 540,
    devices: { ac: true, vent: false, light: false, blinds: 50 },
    equipment: [eq('u3', 'Стоматологическая установка'), eq('r3', 'Рециркулятор'), eq('ac3', 'Кондиционер'), eq('v3', 'Вытяжка')],
    activity: 'Свободна', lastActivity: '42 мин назад', usageToday: '4 ч 10 мин', loadPercent: 61,
    events: [
      { time: '18:03', text: 'Температура 23.8°C при заданной 22°C', severity: 'warning' },
      { time: '14:32', text: 'Температура вернулась в норму', severity: 'info' },
      { time: '14:10', text: 'Превышение температуры: 24.1°C', severity: 'warning' },
    ],
    shape: '80,510 430,510 435,590 550,700 580,745 580,855 175,855 125,830 50,740 50,590', labelAt: [270, 670],
  },
  {
    id: 1, name: 'Холл ожидания', shortName: 'Холл ожидания', kind: 'public', status: 'active',
    occupied: true, workplace: true, temperature: 22.6, targetTemperature: 22.5, humidity: 44, co2: 720,
    devices: { ac: true, vent: null, light: true, blinds: null },
    equipment: [eq('rc1', 'Терминал ресепшн'), eq('r1', 'Рециркулятор'), eq('ac1', 'Кондиционер')],
    activity: '3 человека в зоне ожидания', lastActivity: 'сейчас', usageToday: 'с 08:40', loadPercent: 69,
    events: [
      { time: '17:45', text: 'Очередь рассосалась: 4 человека', severity: 'info' },
      { time: '17:10', text: 'Более 6 человек в зоне ожидания', severity: 'ai' },
      { time: '08:40', text: 'Первый посетитель', severity: 'info' },
    ],
    shape: '440,395 600,395 600,512 835,512 835,435 1045,435 1045,540 1030,555 950,640 885,700 880,855 585,855 580,745 530,680 440,590',
    labelAt: [760, 730],
  },
  {
    id: 5, name: 'Постоперационная', shortName: 'Постоперационная', kind: 'clinical', status: 'active',
    occupied: true, workplace: true, temperature: 22.4, targetTemperature: 22, humidity: 45, co2: 610,
    devices: { ac: true, vent: null, light: true, blinds: null },
    equipment: [eq('r5', 'Рециркулятор'), eq('ac5', 'Кондиционер')],
    activity: 'Пациент под наблюдением', lastActivity: 'сейчас', usageToday: '3 ч 05 мин', loadPercent: 52,
    events: [{ time: '17:58', text: 'Помещение занято', severity: 'info' }],
    shape: '248,235 498,235 498,380 248,380', labelAt: [370, 305],
  },
  {
    id: 13, name: 'Комната персонала', shortName: 'Персонал', kind: 'staff', status: 'active',
    occupied: true, workplace: true, temperature: 23.0, targetTemperature: 23, humidity: 43, co2: 810,
    devices: { ac: true, vent: null, light: true, blinds: null },
    equipment: [eq('ac13', 'Кондиционер')],
    activity: 'Активна', lastActivity: '3 мин назад', usageToday: '2 ч 40 мин', loadPercent: 47,
    events: [{ time: '18:20', text: 'CO₂ 810 ppm — рекомендуется проветривание', severity: 'ai' }],
    shape: '1105,335 1395,335 1395,545 1050,545 1050,425 1105,425', labelAt: [1240, 440],
  },
  {
    id: 11, name: 'Рентген', shortName: 'Рентген', kind: 'clinical', status: 'ok',
    occupied: false, workplace: true, temperature: 22.2, targetTemperature: 22, humidity: 42, co2: 520,
    devices: { ac: true, vent: true, light: false, blinds: null },
    equipment: [eq('x11', 'Рентген-аппарат'), eq('ac11', 'Кондиционер'), eq('v11', 'Вытяжка')],
    activity: 'Свободен', lastActivity: '18 мин назад', usageToday: '1 ч 55 мин', loadPercent: 43,
    events: [{ time: '18:07', text: 'Последний снимок выполнен', severity: 'info' }],
    shape: '745,235 1095,235 1095,415 930,415 745,420', labelAt: [915, 320],
  },
  {
    id: 4, name: 'Предоперационная', shortName: 'Предоперационная', kind: 'clinical', status: 'ok',
    occupied: false, workplace: true, temperature: 22.0, targetTemperature: 22, humidity: 44, co2: null,
    devices: { ac: true, vent: null, light: false, blinds: 60 },
    equipment: [eq('ac4', 'Кондиционер'), eq('r4', 'Рециркулятор')],
    activity: 'Свободна', lastActivity: '1 ч 10 мин назад', usageToday: '2 ч 15 мин', loadPercent: 34,
    events: [{ time: '17:08', text: 'Помещение освобождено', severity: 'info' }],
    shape: '50,240 238,240 238,478 50,478', labelAt: [140, 400],
  },
  {
    id: 2, name: 'Шлюз', shortName: 'Шлюз', kind: 'service', status: 'ok', occupied: false, workplace: false,
    temperature: 22.3, targetTemperature: 22, humidity: 44, co2: null, devices: { ac: null, vent: null, light: false, blinds: null },
    equipment: [], activity: 'Проход', lastActivity: '42 мин назад', usageToday: '—', loadPercent: 0,
    events: [], shape: '245,385 430,385 430,490 245,490', labelAt: [335, 440],
  },
  {
    id: 7, name: 'Тех. помещение', shortName: 'Тех. помещение', kind: 'service', status: 'ok', occupied: false, workplace: false,
    temperature: 24.5, targetTemperature: 25, humidity: 38, co2: null, devices: { ac: true, vent: true, light: false, blinds: null },
    equipment: [eq('cmp', 'Компрессор'), eq('asp', 'Аспиратор'), eq('nvr', 'Видеорегистратор'), eq('rack', 'Сетевой шкаф')],
    activity: 'Оборудование работает', lastActivity: 'вчера', usageToday: '—', loadPercent: 0,
    events: [{ time: '08:31', text: 'Компрессор запущен', severity: 'info' }],
    shape: '510,105 732,105 732,205 510,205', labelAt: [620, 150],
  },
  {
    id: 8, name: 'Уборочная', shortName: 'Уборочная', kind: 'service', status: 'idle', occupied: false, workplace: false,
    temperature: 22.0, targetTemperature: 22, humidity: 47, co2: null, devices: { ac: null, vent: null, light: false, blinds: null },
    equipment: [], activity: 'Не используется', lastActivity: 'вчера, 21:40', usageToday: '—', loadPercent: 0,
    events: [], shape: '505,235 735,235 735,380 505,380', labelAt: [620, 310],
  },
  {
    id: 12, name: 'Хранение отходов', shortName: 'Отходы', kind: 'service', status: 'idle', occupied: false, workplace: false,
    temperature: 21.4, targetTemperature: 21, humidity: 40, co2: null, devices: { ac: null, vent: true, light: false, blinds: null },
    equipment: [], activity: 'Не используется', lastActivity: '15:20', usageToday: '—', loadPercent: 0,
    events: [{ time: '15:20', text: 'Дверь открыта 2 мин', severity: 'info' }],
    shape: '1105,235 1390,235 1390,330 1105,330', labelAt: [1252, 285],
  },
  {
    id: 6, name: 'Санузел', shortName: 'СУ', kind: 'sanitary', status: 'ok', occupied: false, workplace: false,
    temperature: 22.2, targetTemperature: 22, humidity: 52, co2: null, devices: { ac: null, vent: true, light: false, blinds: null },
    equipment: [], activity: '—', lastActivity: '25 мин назад', usageToday: '—', loadPercent: 0,
    events: [], shape: '382,102 498,102 498,192 382,192', labelAt: [435, 150],
  },
  {
    id: 9, name: 'Санузел', shortName: 'СУ', kind: 'sanitary', status: 'ok', occupied: false, workplace: false,
    temperature: 22.1, targetTemperature: 22, humidity: 55, co2: null, devices: { ac: null, vent: true, light: false, blinds: null },
    equipment: [], activity: '—', lastActivity: '8 мин назад', usageToday: '—', loadPercent: 0,
    events: [], shape: '600,390 735,390 735,510 600,510', labelAt: [667, 458],
  },
  {
    id: 10, name: 'Санузел', shortName: 'СУ', kind: 'sanitary', status: 'ok', occupied: false, workplace: false,
    temperature: 22.3, targetTemperature: 22, humidity: 51, co2: null, devices: { ac: null, vent: true, light: false, blinds: null },
    equipment: [], activity: '—', lastActivity: '12 мин назад', usageToday: '—', loadPercent: 0,
    events: [], shape: '748,432 835,432 835,510 748,510', labelAt: [790, 470],
  },
]

export const cameras: Camera[] = [
  { id: 1, name: 'Главный вход', zone: 'Улица', online: true, outdoor: true, people: 0, motion: false, lastEvent: '18:12 вход посетителя' },
  { id: 2, name: 'Холл · общий план', zone: 'Холл ожидания', online: true, outdoor: false, people: 3, motion: true, lastEvent: 'сейчас' },
  { id: 3, name: 'Ресепшн', zone: 'Холл ожидания', online: true, outdoor: false, people: 1, motion: true, lastEvent: 'сейчас' },
  { id: 4, name: 'Коридор', zone: 'Клиническая зона', online: true, outdoor: false, people: 0, motion: false, lastEvent: 'вчера 18:14 потеря связи 4 мин' },
  { id: 5, name: 'Служебный вход', zone: 'Улица', online: true, outdoor: true, people: 0, motion: false, lastEvent: '08:28 персонал' },
  { id: 6, name: 'Операционная · вход', zone: 'Клиническая зона', online: true, outdoor: false, people: 0, motion: false, lastEvent: '17:21' },
  { id: 7, name: 'Кабинет 14 · вход', zone: 'Клиническая зона', online: true, outdoor: false, people: 0, motion: false, lastEvent: '16:31' },
  { id: 8, name: 'Тех. помещение', zone: 'Служебная зона', online: true, outdoor: false, people: 0, motion: false, lastEvent: '08:31' },
  { id: 9, name: 'Хранение отходов', zone: 'Служебная зона', online: true, outdoor: false, people: 0, motion: false, lastEvent: '15:20' },
  { id: 10, name: 'Парковка', zone: 'Улица', online: true, outdoor: true, people: 0, motion: false, lastEvent: '17:52 автомобиль' },
]

export const securityEvents: { day: string; items: SecurityEvent[] }[] = [
  {
    day: 'Сегодня',
    items: [
      { id: 's1', time: '17:10', text: 'Более 6 человек в зоне ожидания (до 17:45)', severity: 'ai', source: 'Камера 2 · AI' },
      { id: 's2', time: '15:20', text: 'Дверь помещения хранения отходов открыта 2 мин', severity: 'info', source: 'Датчик двери' },
      { id: 's3', time: '08:30', text: 'Клиника снята с охраны', severity: 'info', source: 'Охранная система' },
      { id: 's4', time: '08:28', text: 'Персонал вошёл через служебный вход', severity: 'info', source: 'Камера 5' },
    ],
  },
  {
    day: 'Вчера',
    items: [
      { id: 's5', time: '21:42', text: 'Движение в коридоре после закрытия · подтверждено: плановая уборка', severity: 'warning', source: 'Камера 4 · AI' },
      { id: 's6', time: '20:57', text: 'Клиника переведена в ночной режим', severity: 'info', source: 'Охранная система' },
      { id: 's7', time: '18:14', text: 'Камера №4 временно потеряла связь (4 мин)', severity: 'warning', source: 'Видеорегистратор' },
    ],
  },
]

export const cameraInsights: CameraInsight[] = [
  { id: 'i1', title: 'Зона ожидания', text: 'С 17:10 до 17:45 в зоне ожидания находилось более 6 человек.', severity: 'ai', metric: '6+ чел.' },
  { id: 'i2', title: 'Время ожидания', text: 'Среднее ожидание сегодня — 9 мин. Дольше 20 минут не ждал никто.', severity: 'info', metric: '9 мин' },
  { id: 'i3', title: 'Служебная зона', text: 'Посторонних в служебной зоне не зафиксировано.', severity: 'info', metric: '0' },
  { id: 'i4', title: 'Оставленные предметы', text: 'Оставленных предметов в холле не обнаружено.', severity: 'info', metric: '0' },
]

export const notifications: AppNotification[] = [
  { id: 'n1', severity: 'ai', title: 'AI-рекомендация', text: 'Рекомендуется проверить кондиционер в кабинете 3: за неделю он 4 раза не достигал заданной температуры.', time: '18:05', read: false },
  { id: 'n2', severity: 'warning', title: 'Малая операционная', text: 'Температура 23.8°C, заданная 22°C. Отклонение 1.8°C.', time: '18:03', read: false },
  { id: 'n3', severity: 'ai', title: 'Пиковая нагрузка', text: 'С 17:10 до 17:45 в холле было более 6 человек. Рассмотрите второго администратора в часы пик.', time: '17:46', read: false },
  { id: 'n4', severity: 'info', title: 'Охрана', text: 'Клиника снята с охраны в 08:30.', time: '08:30', read: true },
  { id: 'n5', severity: 'info', title: 'Камера №4', text: 'Связь восстановлена вчера в 18:18, перебоев сегодня нет.', time: 'вчера', read: true },
  { id: 'n6', severity: 'info', title: 'Отчёт', text: 'Ежедневный отчёт будет сформирован и отправлен в 21:00.', time: '08:00', read: true },
]

export const todayTimeline: { time: string; text: string; severity: 'info' | 'warning' | 'alarm' | 'ai' }[] = [
  { time: '08:30', text: 'Клиника снята с охраны', severity: 'info' },
  { time: '08:40', text: 'Первый посетитель', severity: 'info' },
  { time: '14:10', text: 'Операционная: превышение температуры', severity: 'warning' },
  { time: '14:32', text: 'Температура в норме', severity: 'info' },
  { time: '17:10', text: 'Пиковая нагрузка в холле', severity: 'ai' },
  { time: '18:03', text: 'Операционная: 23.8°C', severity: 'warning' },
]

// ── Аналитика ────────────────────────────────────────────────

export const hours = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20']

/** Посетителей в холле по часам (сегодня и среднее за прошлую неделю) */
export const hourlyLoad = hours.map((h, i) => ({
  hour: `${h}:00`,
  today: [2, 5, 7, 8, 6, 5, 6, 7, 9, 11, 10, 6, 3][i],
  avg: [2, 4, 6, 7, 6, 4, 5, 6, 8, 9, 8, 5, 2][i],
}))

export const roomLoad = [
  { room: 'Кабинет 14', value: 78 },
  { room: 'Холл ожидания', value: 69 },
  { room: 'Малая операционная', value: 61 },
  { room: 'Постоперационная', value: 52 },
  { room: 'Комната персонала', value: 47 },
  { room: 'Рентген', value: 43 },
  { room: 'Предоперационная', value: 34 },
]

export const temperatureSeries = hours.map((h, i) => ({
  hour: `${h}:00`,
  k14: [21.6, 21.8, 22.0, 22.1, 22.3, 22.2, 22.1, 22.0, 22.2, 22.3, 22.1, 22.0, 21.9][i],
  k3: [21.9, 22.0, 22.1, 22.4, 22.9, 23.4, 24.1, 22.6, 22.4, 22.8, 23.8, 23.6, 23.2][i],
  xray: [21.8, 21.9, 22.0, 22.1, 22.2, 22.2, 22.3, 22.3, 22.2, 22.2, 22.2, 22.1, 22.0][i],
}))

export const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export const climateDeviations = weekDays.map((d, i) => ({
  day: d,
  minutes: [0, 22, 0, 35, 18, 0, 22][i],
}))

/** Тревоги по дням текущего месяца (1–25 сентября) */
export const alarmsByDay = Array.from({ length: 25 }, (_, i) => ({
  day: String(i + 1),
  alarms: [0, 0, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0][i],
}))

export const eventsByDay = [
  { day: '12.09', events: 11 }, { day: '13.09', events: 6 }, { day: '14.09', events: 4 },
  { day: '15.09', events: 13 }, { day: '16.09', events: 15 }, { day: '17.09', events: 10 },
  { day: '18.09', events: 16 }, { day: '19.09', events: 12 }, { day: '20.09', events: 7 },
  { day: '21.09', events: 3 }, { day: '22.09', events: 14 }, { day: '23.09', events: 13 },
  { day: '24.09', events: 11 }, { day: '25.09', events: 12 },
]

export const weekLoad = weekDays.map((d, i) => ({
  day: d,
  thisWeek: [58, 74, 61, 77, 63, 38, 0][i],
  lastWeek: [55, 66, 60, 68, 59, 35, 0][i],
}))

/** Активность рабочих помещений по часам, 0..1 (для heatmap) */
export const activityHeatmap: { room: string; values: number[] }[] = [
  { room: 'Кабинет 14', values: [0.2, 0.9, 1, 0.95, 0.7, 0.4, 0.8, 0.9, 1, 1, 0.9, 0.5, 0.1] },
  { room: 'Операционная', values: [0, 0.3, 0.9, 1, 0.8, 0.2, 0.6, 0.7, 0.3, 0.2, 0, 0, 0] },
  { room: 'Холл', values: [0.2, 0.5, 0.6, 0.7, 0.5, 0.4, 0.5, 0.6, 0.8, 1, 0.9, 0.5, 0.2] },
  { room: 'Постоперационная', values: [0, 0, 0.3, 0.8, 0.9, 0.5, 0.2, 0.4, 0.5, 0.6, 0.8, 0.4, 0] },
  { room: 'Рентген', values: [0, 0.4, 0.5, 0.3, 0.2, 0.1, 0.3, 0.5, 0.6, 0.4, 0.3, 0, 0] },
  { room: 'Предоперационная', values: [0, 0.2, 0.7, 0.8, 0.3, 0, 0.3, 0.5, 0.2, 0.1, 0, 0, 0] },
  { room: 'Персонал', values: [0.6, 0.2, 0.1, 0.2, 0.3, 0.9, 0.5, 0.2, 0.2, 0.3, 0.4, 0.6, 0.3] },
]

export const kpiTrends = {
  activeRooms: [2, 4, 5, 5, 4, 3, 4, 5, 6, 5, 4],
  events: [1, 2, 2, 3, 4, 4, 5, 6, 8, 10, 12],
  temperature: [21.8, 22.0, 22.1, 22.3, 22.5, 22.4, 22.6, 22.4, 22.3, 22.5, 22.4],
}

// ── AI ───────────────────────────────────────────────────────

export const aiDailySummary = `Клиника работает штатно.
Наибольшая активность зафиксирована с 16:30 до 18:10.
Кабинет 14 использовался 6 ч 24 мин.
В малой операционной (помещение 3) температура на 1.8°C превышала заданную в течение 22 минут.
После закрытия тревог не зафиксировано. Все камеры работают.`

export const aiDailyDetails = [
  'Посетителей через холл: 74, среднее ожидание 9 мин.',
  'Пик в холле 17:10–17:45: более 6 человек одновременно.',
  'Кондиционер операционной второй день подряд не держит 22°C после 14:00.',
  'CO₂ в комнате персонала 810 ppm — стоит проветрить.',
]

export const quickQuestions = [
  'Что необычного было сегодня?',
  'Были ли тревоги ночью?',
  'Какие кабинеты были загружены больше всего?',
  'Где были проблемы с климатом?',
  'Какие камеры отключались?',
  'Сравни эту неделю с прошлой',
  'Что требует внимания?',
  'Подготовь отчёт за день',
]

export const aiAnswers: Record<string, string> = {
  'Что необычного было сегодня?': `Сегодня обнаружено **два отклонения**:

1. **Малая операционная:** температура превышала 24°C с 14:10 до 14:32 и сейчас снова 23.8°C при заданных 22°C.
2. **Холл ожидания:** с 17:10 до 17:45 одновременно находилось более 6 человек — это на 40% выше обычного пика.

Остальные системы работали штатно, все 10 камер онлайн.`,
  'Были ли тревоги ночью?': `**Тревог ночью не было.**

- 20:57 — клиника переведена в ночной режим.
- 21:42 — движение в коридоре после закрытия. AI сверил с графиком: это плановая уборка, событие закрыто.
- 08:30 — клиника снята с охраны в штатное время.

Дверь служебного входа ночью не открывалась.`,
  'Какие кабинеты были загружены больше всего?': `Загрузка рабочих помещений сегодня:

1. **Кабинет 14** — 78% (6 ч 24 мин)
2. **Холл ожидания** — 69%
3. **Малая операционная** — 61% (4 ч 10 мин)
4. **Постоперационная** — 52%
5. **Рентген** — 43%

Кабинет 14 загружен на 21% выше среднего по клинике. Пик приходится на 16:00–18:00.`,
  'Где были проблемы с климатом?': `Проблемы с климатом — только в **малой операционной**:

- 14:10–14:32 — до 24.1°C (заданная 22°C);
- с 18:03 — 23.8°C, отклонение 1.8°C.

За неделю это уже **третий** эпизод, все после обеда. Похоже, кондиционер не справляется с нагрузкой в тёплые часы — рекомендую сервисную проверку.

В остальных помещениях температура в пределах ±0.5°C от заданной.`,
  'Какие камеры отключались?': `Сегодня отключений не было — **10 из 10 камер онлайн**.

Вчера в 18:14 **камера №4 (коридор)** потеряла связь на 4 минуты. Связь восстановилась сама; причина, вероятнее всего, — кратковременный сбой питания PoE-коммутатора. Если повторится, стоит проверить коммутатор в тех. помещении.`,
  'Сравни эту неделю с прошлой': `Эта неделя **активнее прошлой на 9%**.

- Самые загруженные дни — **вторник (74%)** и **четверг (77%)**.
- Кабинет 14 использовался на 21% активнее среднего.
- Климатических отклонений: 5 против 2 на прошлой неделе — все в малой операционной.
- Тревог: 0 против 1.
- Событий в среднем 11 в день против 10.

Главное изменение — рост отклонений климата в операционной.`,
  'Что требует внимания?': `Требуют внимания **3 пункта**:

1. **Кондиционер в малой операционной** — 4 раза за неделю не достиг заданной температуры. Рекомендую вызвать сервис.
2. **Пик в холле 17:00–18:00** — более 6 человек, ожидание растёт. Стоит усилить ресепшн в эти часы.
3. **CO₂ в комнате персонала** — 810 ppm. Не критично, но стоит проветрить или включить приток.

Всё остальное работает штатно.`,
  'Подготовь отчёт за день': `**Отчёт за сегодня готов.**

- Рабочих помещений активно: 4 из 7
- Посетителей: 74, среднее ожидание 9 мин
- Загрузка кабинета 14: 78%
- Отклонений климата: 2 (малая операционная)
- Тревог: 0, камеры: 10/10

Полная версия — в разделе «Отчёты». Могу отправить её в Telegram или на email.`,
}

export const aiFallback = (q: string) => `По запросу «${q}» я проанализировал данные клиники за сегодня.

- Все системы работают штатно, тревог нет.
- Активно 4 из 7 рабочих помещений.
- Одно отклонение: температура в малой операционной 23.8°C.

Уточните вопрос — например, про конкретное помещение, камеры или период, и я дам подробный разбор.`

// ── Отчёты ───────────────────────────────────────────────────

export const reports: ReportData[] = [
  {
    period: 'day', title: 'Ежедневный отчёт', range: 'Сегодня · 08:00–20:00',
    summary: 'Клиника работала штатно. Наибольшая активность — с 16:30 до 18:10. Кабинет 14 использовался 6 ч 24 мин. В малой операционной дважды фиксировалось превышение температуры. Тревог не было, все камеры онлайн.',
    metrics: [
      { label: 'Активных помещений', value: '4 / 7' },
      { label: 'Посетителей', value: '74', delta: '+8%', good: true },
      { label: 'Среднее ожидание', value: '9 мин', delta: '−1 мин', good: true },
      { label: 'Отклонения климата', value: '2', delta: '+2', good: false },
      { label: 'Тревоги', value: '0' },
      { label: 'Камеры online', value: '10 / 10' },
    ],
    deviations: ['Малая операционная: 24.1°C с 14:10 до 14:32', 'Малая операционная: 23.8°C с 18:03', 'Холл: более 6 человек с 17:10 до 17:45'],
    events: [
      { time: '08:30', text: 'Снятие с охраны', severity: 'info' },
      { time: '14:10', text: 'Превышение температуры в операционной', severity: 'warning' },
      { time: '17:10', text: 'Пиковая нагрузка в холле', severity: 'ai' },
      { time: '18:03', text: 'Повторное превышение температуры', severity: 'warning' },
    ],
    recommendations: ['Вызвать сервис для проверки кондиционера в малой операционной.', 'Усилить ресепшн в часы 17:00–18:00.', 'Проветрить комнату персонала (CO₂ 810 ppm).'],
  },
  {
    period: 'week', title: 'Еженедельный отчёт', range: '19–25 сентября',
    summary: 'За неделю клиника работала стабильно. Наибольшая загрузка приходилась на вторник и четверг. Кабинет 14 использовался на 21% активнее среднего. В малой операционной трижды фиксировалось превышение температуры.',
    metrics: [
      { label: 'Средняя загрузка', value: '62%', delta: '+9%', good: true },
      { label: 'Посетителей', value: '412', delta: '+6%', good: true },
      { label: 'Отклонения климата', value: '5', delta: '+3', good: false },
      { label: 'Тревоги', value: '0', delta: '−1', good: true },
      { label: 'Событий', value: '78' },
      { label: 'Доступность камер', value: '99.97%' },
    ],
    deviations: ['Малая операционная: 3 превышения температуры (вт, чт, пт)', 'Камера №4: потеря связи 4 мин (чт)', 'Холл: 2 пика более 6 человек'],
    events: [
      { time: 'Вт', text: 'Пиковая загрузка недели: 74%', severity: 'info' },
      { time: 'Чт', text: 'Камера №4 — потеря связи', severity: 'warning' },
      { time: 'Чт', text: 'Максимальная загрузка: 77%', severity: 'info' },
      { time: 'Пт', text: 'Превышение температуры в операционной', severity: 'warning' },
    ],
    recommendations: ['Провести сервисное обслуживание кондиционера в операционной.', 'Перераспределить записи со вторника и четверга на среду.', 'Проверить PoE-коммутатор для камеры №4.'],
  },
  {
    period: 'month', title: 'Ежемесячный отчёт', range: 'Сентябрь 2026',
    summary: 'Месяц прошёл без серьёзных инцидентов. Загрузка выросла на 7% к августу. Зафиксировано 5 тревог, все — ложные срабатывания или подтверждённые плановые действия. Главная техническая проблема месяца — климат в малой операционной.',
    metrics: [
      { label: 'Средняя загрузка', value: '59%', delta: '+7%', good: true },
      { label: 'Посетителей', value: '1 684', delta: '+5%', good: true },
      { label: 'Тревоги', value: '5', delta: '−2', good: true },
      { label: 'Отклонения климата', value: '11', delta: '+4', good: false },
      { label: 'Событий', value: '312' },
      { label: 'Доступность систем', value: '99.9%' },
    ],
    deviations: ['Малая операционная: 11 превышений температуры', 'Ложные срабатывания датчика движения: 3', 'Перебои связи камер: 2 эпизода'],
    events: [
      { time: '03.09', text: 'Ложная тревога — датчик движения', severity: 'warning' },
      { time: '10.09', text: '2 тревоги — плановые работы без снятия с охраны', severity: 'alarm' },
      { time: '17.09', text: 'Ложная тревога — датчик движения', severity: 'warning' },
      { time: '24.09', text: 'Тревога — задержка снятия с охраны', severity: 'alarm' },
    ],
    recommendations: ['Заменить или обслужить кондиционер в малой операционной до начала отопительного сезона.', 'Настроить чувствительность датчика движения в коридоре.', 'Согласовать регламент снятия с охраны при плановых работах.'],
  },
]
