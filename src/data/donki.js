// Conexión con NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information)
// Docs: https://api.nasa.gov  (sección DONKI)
import { SNAPSHOT, SNAPSHOT_DATE } from './snapshot'

const API_KEY = import.meta.env.VITE_NASA_API_KEY
const MIN_SPEED = 700 // km/s: solo nos interesan las CME rápidas

const iso = (d) => d.toISOString().slice(0, 10)

async function fetchJson(url, ms = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try {
    const r = await fetch(url, { signal: ctrl.signal })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    const txt = await r.text()
    return txt ? JSON.parse(txt) : []
  } finally {
    clearTimeout(t)
  }
}

/** Trae las CME de los últimos 60 días (máximo que permite DONKI por consulta). */
async function fetchLiveRecent() {
  if (!API_KEY) throw new Error('Sin API key (VITE_NASA_API_KEY)')
  const end = new Date()
  const start = new Date(end.getTime() - 59 * 864e5)
  const base = 'https://api.nasa.gov/DONKI'
  const q = `startDate=${iso(start)}&endDate=${iso(end)}&api_key=${API_KEY}`
  const [cme, sep] = await Promise.all([
    fetchJson(`${base}/CME?${q}`),
    fetchJson(`${base}/SEP?${q}`).catch(() => []),
  ])
  const cmes = cme
    .map((x) => {
      const list = x.cmeAnalyses || []
      const a = list.find((a) => a.isMostAccurate) || list[0]
      return a && a.speed >= MIN_SPEED ? [x.startTime.slice(0, 16), Math.round(a.speed)] : null
    })
    .filter(Boolean)
  const seps = [...new Set(sep.map((s) => s.eventTime.slice(0, 10)))]
  return {
    label: 'Clima solar EN VIVO: últimos 60 días',
    start: iso(start),
    end: iso(end),
    cmes,
    seps,
  }
}

/**
 * Devuelve los datos de clima espacial para el modo elegido.
 * source: 'live' (API en vivo) | 'snapshot' (copia guardada, con su fecha) | 'archive' (evento histórico)
 */
export async function loadSpaceWeather(mode) {
  if (mode === 'may2024') {
    return { ...SNAPSHOT.may2024, source: 'archive', savedAt: SNAPSHOT_DATE }
  }
  if (mode === 'recent' || mode === 'random') {
    try {
      const live = await fetchLiveRecent()
      return { ...live, source: 'live', savedAt: iso(new Date()) }
    } catch (e) {
      console.info('[DONKI] usando copia guardada:', e.message)
      return { ...SNAPSHOT.recent, source: 'snapshot', savedAt: SNAPSHOT_DATE }
    }
  }
  return { ...SNAPSHOT.recent, source: 'snapshot', savedAt: SNAPSHOT_DATE }
}

/** Nivel de tormenta para el juego según la CME más rápida y si hubo partículas (SEP). */
export function stormLevel(speed, sep) {
  if (speed >= 1800 || (sep && speed >= 900)) return 3
  if (speed >= 1200) return 2
  if (speed >= 900) return 1
  return 0
}

/**
 * Reparte el rango de fechas reales en N soles.
 * Cada sol del juego representa una "ventana" de días reales.
 */
export function buildSolWeather(weather, sols, mode) {
  const start = new Date(weather.start + 'T00:00Z').getTime()
  const end = new Date(weather.end + 'T23:59Z').getTime()

  if (mode === 'random') {
    // Modo aleatorio: tormentas reales elegidas al azar del archivo completo
    const pool = [...SNAPSHOT.recent.cmes, ...SNAPSHOT.may2024.cmes].filter((c) => c[1] >= 900)
    const plan = []
    for (let i = 0; i < sols; i++) {
      const hit = i > 0 && Math.random() < 0.38
      if (!hit) { plan.push({ level: 0 }); continue }
      const c = pool[Math.floor(Math.random() * pool.length)]
      const day = c[0].slice(0, 10)
      const sep = SNAPSHOT.may2024.seps.includes(day)
      plan.push({ level: stormLevel(c[1], sep), date: c[0], speed: c[1], sep })
    }
    if (!plan.some((p) => p.level > 0)) {
      const c = pool[0]
      plan[3] = { level: stormLevel(c[1], false), date: c[0], speed: c[1], sep: false }
    }
    return plan
  }

  const span = (end - start) / sols
  const plan = []
  for (let i = 0; i < sols; i++) {
    const a = start + i * span
    const b = a + span
    const inWin = weather.cmes.filter(([t]) => {
      const ms = new Date(t + 'Z').getTime()
      return ms >= a && ms < b
    })
    const sepDays = weather.seps.filter((d) => {
      const ms = new Date(d + 'T12:00Z').getTime()
      return ms >= a && ms < b
    })
    const top = inWin.sort((x, y) => y[1] - x[1])[0]
    const winLabel = [new Date(a), new Date(b - 1)]
    if (!top) { plan.push({ level: 0, window: winLabel }); continue }
    const level = stormLevel(top[1], sepDays.length > 0)
    plan.push({
      level,
      date: top[0],
      speed: top[1],
      sep: sepDays.length > 0,
      count: inWin.length,
      window: winLabel,
    })
  }
  // El primer sol siempre es tranquilo para aprender
  if (plan[0]) plan[0] = { ...plan[0], level: 0, skippedForTutorial: plan[0].level > 0 }
  return plan
}

export function fmtDate(d) {
  const date = typeof d === 'string' ? new Date(d.length <= 10 ? d + 'T12:00Z' : d + 'Z') : d
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
