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

/**
 * ¿Llega esta CME a Marte? Lo dice la simulación WSA-ENLIL de la NASA que viene con la CME:
 * cada simulación tiene una lista de impactos (Tierra, Marte, sondas...). Devuelve la hora de llegada o null.
 */
function marsArrival(analyses) {
  for (const a of analyses) {
    for (const e of a.enlilList || []) {
      const hit = (e.impactList || []).find((i) => /mars/i.test(i.location || ''))
      if (hit?.arrivalTime) return hit.arrivalTime.slice(0, 16)
    }
  }
  return null
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
      if (!a || a.speed < MIN_SPEED) return null
      return [x.startTime.slice(0, 16), Math.round(a.speed), marsArrival(list)]
    })
    .filter(Boolean)
  const seps = [...new Set(sep.map((s) => s.eventTime.slice(0, 10)))]
  return {
    label: 'Clima solar EN VIVO: últimos 60 días',
    start: iso(start),
    end: iso(end),
    cmes,
    seps,
    marsSeps: [],
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

/**
 * Nivel de tormenta EN MARTE según la velocidad de la CME que llega.
 * (las partículas medidas en Marte, como el 20/05/2024, son siempre nivel 3)
 */
export function stormLevel(speed, marsSep) {
  if (marsSep || speed >= 1500) return 3
  if (speed >= 1000) return 2
  return 1
}

const ms = (t) => new Date(t.length <= 10 ? t + 'T12:00Z' : t + 'Z').getTime()

/** Lista de eventos que llegan a Marte: CMEs con llegada prevista + partículas medidas en Marte. */
function marsEvents(weather) {
  const ev = (weather.cmes || []).filter((c) => c[2]).map(([date, speed, arrival]) => ({ date, speed, arrival, level: stormLevel(speed, false) }))
  ;(weather.marsSeps || []).forEach(([date, speed, arrival]) => ev.push({ date, speed, arrival, level: 3, sep: true, rad: true }))
  return ev
}

// Simulacro de entrenamiento: la tormenta real del 14/05/2024 (2.119 km/s), que la simulación predijo en Marte el 16/05
export const DRILL = { level: 3, date: '2024-05-14T17:00', speed: 2119, arrival: '2024-05-16T20:47', drill: true }
const DRILL_AFTER = { level: 2, date: '2024-05-14T17:30', speed: 1199, arrival: '2024-05-17T15:08', drill: true }

/**
 * Giro a mitad de misión: una GRAN tormenta anunciada con 2 soles de anticipación
 * (como hace la oficina de clima espacial de la NASA para las misiones a la Luna y Marte).
 * Si los datos reales no traen una tormenta fuerte, se hace un SIMULACRO con la de mayo de 2024.
 */
function addBigStorm(plan) {
  let k = plan.findIndex((p, i) => i >= 4 && p.level === 3)
  if (k < 0) {
    k = 7
    plan[k] = { ...DRILL }
    if (plan[k + 1] && plan[k + 1].level < 2) plan[k + 1] = { ...DRILL_AFTER }
  }
  const big = plan[k]
  ;[2, 1].forEach((n) => { if (plan[k - n] && k - n > 0) plan[k - n] = { ...plan[k - n], warn: { in: n, speed: big.speed, drill: !!big.drill } } })
  big.big = true
  return plan
}

/**
 * Reparte el rango de fechas reales en N soles.
 * Cada sol del juego representa una "ventana" de días reales, y la tormenta cae el día que LLEGA a Marte.
 */
export function buildSolWeather(weather, sols, mode) {
  const start = new Date(weather.start + 'T00:00Z').getTime()
  const end = new Date(weather.end + 'T23:59Z').getTime()

  if (mode === 'random') {
    // Modo aleatorio: tormentas reales que llegaron a Marte, elegidas al azar del archivo
    const pool = [...marsEvents(SNAPSHOT.recent), ...marsEvents(SNAPSHOT.may2024)].filter((e) => e.level < 3)
    const plan = []
    for (let i = 0; i < sols; i++) {
      const hit = i > 0 && Math.random() < 0.38
      plan.push(hit ? { ...pool[Math.floor(Math.random() * pool.length)] } : { level: 0 })
    }
    if (!plan.some((p) => p.level > 0)) plan[3] = { ...pool[0] }
    return addBigStorm(plan)
  }

  const events = marsEvents(weather)
  const span = (end - start) / sols
  const plan = []
  for (let i = 0; i < sols; i++) {
    const a = start + i * span
    const b = a + span
    const winLabel = [new Date(a), new Date(b - 1)]
    const inWin = events.filter((e) => ms(e.arrival) >= a && ms(e.arrival) < b).sort((x, y) => y.level - x.level || y.speed - x.speed)
    if (inWin.length) { plan.push({ ...inWin[0], count: inWin.length, window: winLabel }); continue }
    // CME rápida que salió ese día pero NO va hacia Marte: se cuenta, sin daño
    const miss = (weather.cmes || []).filter((c) => !c[2] && c[1] >= 900 && ms(c[0]) >= a && ms(c[0]) < b).sort((x, y) => y[1] - x[1])[0]
    plan.push({ level: 0, window: winLabel, miss: miss ? { date: miss[0], speed: miss[1] } : null })
  }
  // El primer sol siempre es tranquilo para aprender
  if (plan[0]) plan[0] = { level: 0, window: plan[0].window }
  return addBigStorm(plan)
}

export function fmtDate(d, lang = 'es') {
  const date = typeof d === 'string' ? new Date(d.length <= 10 ? d + 'T12:00Z' : d + 'Z') : d
  return date.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
