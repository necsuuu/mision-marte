// 🛠️ TAREAS FÍSICAS: algunas decisiones no se resuelven solas. Después de elegir en la computadora,
// el comandante sale a la base, camina hasta el lugar y lo arregla con sus manos (un pequeño desafío).
// Cómo lo haga cambia el resultado: los efectos salen de las mismas reglas que el resto del juego
// (oxígeno, comida, ⚡, polvo en los paneles), no hay puntos aparte.
//
// En content.js, cada opción que lleva tarea tiene `task: 'id'`.
// Acá están: dónde se hace, qué compañero ayuda y cómo el desempeño cambia los efectos.

// ---------- Lugares (coordenadas del mundo 3D de la base) ----------
const DOME_DIR = [0.688, 0.725] // hacia donde quedó el agujero del meteorito
const PANELS_AT = [7.5, -2] // centro del grupo de paneles

/** Posición de cada panel solar (mismo orden y separación que SolarArray en baseParts.jsx). */
export const panelPos = (i) => [PANELS_AT[0] + (i % 3) * 2.2 - 2.2, 0, PANELS_AT[1] + Math.floor(i / 3) * 2.6]

/** Lugares de expedición alrededor de la base (los dibuja builds.jsx). */
export const SITES = {
  crater: [15, 0, 14],
  cave: [-17.5, 0, 12],
  oldrover: [18.5, 0, -12.5],
  hill: [-14, 0, -18.5],
}
// a qué distancia del centro de cada lugar se para el rover (el cerro y la cueva son grandes)
const SITE_GAP = { crater: 3.4, cave: 4.8, oldrover: 2.4, hill: 6 }
/** Punto de llegada del rover a un lugar: un poco antes, del lado de la base. */
export function siteStand(id) {
  const [x, , z] = SITES[id]
  const d = Math.hypot(x, z)
  const k = 1 - SITE_GAP[id] / d
  return [x * k, 0, z * k]
}
/** Las 3 muestras para juntar alrededor del punto de llegada. */
export function samplesAt(id) {
  const [sx, , sz] = siteStand(id)
  const base = Math.atan2(sx, sz)
  return [-1.1, 0.15, 1.3].map((a, i) => {
    const r = 3 + (i % 2) * 0.8
    return [sx - Math.sin(base + a) * r, 0, sz - Math.cos(base + a) * r]
  })
}

/** Donde arranca el comandante cuando sale (al lado de la puerta del domo). */
export const TASK_START = [4.6, 0, 5.4]

/** Lugares del mapa donde no se puede caminar: [x, z, radio] */
export function colliders(s) {
  const out = [[0, 0, 4.1], [-7.5, 1.5, 2.6], [-10, -8.5, 2.8], [3.5, -6.5, 0.7]]
  const done = s.build?.done || []
  if (done.includes('shelter')) out.push([-3.6, -6.6, 2.7])
  if (done.includes('farm')) out.push([-8.2, 6.8, 2.2])
  if (done.includes('lab')) out.push([11.6, 5.4, 0.5])
  if (s.decisions?.some((d) => d.ev.id === 'supply')) out.push([1.5, 9.5, 1.4])
  if (s.task?.id === 'drive') out.push([SITES.cave[0], SITES.cave[2], 3.4], [SITES.hill[0], SITES.hill[2], 4.8])
  return out
}

// ---------- Definición de cada tarea ----------
// crew: qué compañero avisa y ayuda (engineer = ingeniera 🔧, botanist = botánico 🌱)
// mini: el desafío que se abre al llegar (si no tiene, se hace caminando entre varios lugares)
// limit: segundos que hay (solo algunas)
export const TASKS = {
  seal: { icon: '🧰', crew: 'engineer', mini: 'seal', helperAt: [5.6, 0, 2.2] },
  clean: { icon: '🧹', crew: 'engineer', limit: 45, limitCadet: 70, helperAt: [10.8, 0, 2.6] },
  circuit: { icon: '🔌', crew: 'engineer', mini: 'circuit', helperAt: [10.8, 0, 2.6] },
  plants: { icon: '🌱', crew: 'botanist', mini: 'plants', helperAt: [-4.6, 0, 4.6] },
  // 🚙 expedición: se maneja el rover hasta el lugar y se juntan muestras antes de que se gaste la batería
  drive: { icon: '🚙', crew: null, limit: 60, limitCadet: 90, avatar: 'rover', speed: 7.5, worldR: 27, start: [6, 0, 7.5] },
  // 🙋 un compañero pide ayuda: primero hay que ir a hablarle, después hacer el trabajo
  water: { icon: '💧', crew: 'botanist', mini: 'water', talk: true, helperAt: [-4.4, 0, 5.4] },
  aim: { icon: '📡', crew: 'engineer', mini: 'aim', talk: true, helperAt: [6.4, 0, -4] },
}

/** Lugares donde hay que ir en esta tarea: { id, stand (donde se para), at (lo que se marca), label } */
export function taskSpots(s) {
  const t = s.task
  if (!t) return []
  switch (t.id) {
    case 'seal': {
      const [dx, dz] = DOME_DIR
      return [{ id: 'leak', stand: [dx * 4.8, 0, dz * 4.8], at: [dx * 2.4, 1.9, dz * 2.4], act: 'seal' }]
    }
    case 'clean': {
      // un lugar por panel sano que esté sucio (los rotos no generan energía)
      return Array.from({ length: s.panels }).map((_, i) => {
        const p = panelPos(i)
        return { id: 'panel' + i, panel: i, stand: [p[0], 0, p[2] + 1.35], at: [p[0], 1.35, p[2]], act: 'clean', done: t.cleaned.includes(i) }
      })
    }
    case 'circuit': {
      const p = panelPos(s.panels - 1) // el último panel es el que se rompió
      return [{ id: 'box', stand: [p[0] + 0.2, 0, p[2] + 1.35], at: [p[0], 0.9, p[2] + 0.3], act: 'wire' }]
    }
    case 'plants':
      return [{ id: 'greenhouse', stand: [-7.5, 0, 4.5], at: [-7.5, 1.4, 1.5], act: 'check' }]
    case 'drive': {
      const site = s.cards?.[0]?.event?.choices?.[t.choiceIdx]?.site
      if (!site) return []
      if (!t.arrived) {
        const st = siteStand(site)
        return [{ id: 'site', stand: st, at: [SITES[site][0], 2.5, SITES[site][2]], act: 'arrive', auto: true }]
      }
      return samplesAt(site).map((p, i) => ({ id: 'sample' + i, stand: p, at: [p[0], 0.6, p[2]], act: 'collect', auto: true, small: true, done: t.found.includes(i) }))
    }
    case 'water':
    case 'aim': {
      const d = TASKS[t.id]
      if (!t.talked) return [{ id: 'crew', stand: [d.helperAt[0], 0, d.helperAt[2] + 1.4], at: [d.helperAt[0], 1.6, d.helperAt[2]], act: 'talk' }]
      return t.id === 'water'
        ? [{ id: 'valves', stand: [-7.5, 0, 4.5], at: [-7.5, 1.4, 1.5], act: 'water' }]
        : [{ id: 'antenna', stand: [3.5, 0, -4.4], at: [3.5, 2.6, -6.5], act: 'aim' }]
    }
    default:
      return []
  }
}

/** Lo que pasa si se termina el tiempo de una tarea con apuro. */
export function timeUpResult(s) {
  const t = s.task
  if (t.id === 'clean') return { cleaned: t.cleaned.length, total: s.panels }
  if (t.id === 'drive') return { arrived: !!t.arrived, found: t.found.length }
  return { crew: true }
}

/** Segundos que da la tarea (o null si no tiene apuro). */
export const taskLimit = (s) => {
  const d = TASKS[s.task?.id]
  if (!d?.limit) return null
  return s.easy ? d.limitCadet : d.limit
}

// ---------- Desafíos: tamaños según la edad ----------
export const CIRCUIT_WIRES = (easy) => (easy ? 3 : 4)
/** Riego: franja verde de humedad (más ancha para los cadetes). */
export const WATER_BAND = (easy) => (easy ? [50, 85] : [60, 80])
export const PLANT_GRID = (easy) => (easy ? { total: 9, sick: 3 } : { total: 12, sick: 4 })

// ---------- Fuga: el aire se escapa mientras no se selle ----------
/** Oxígeno perdido por la fuga después de `sec` segundos. */
export function leakLoss(s, sec) {
  const every = s.easy ? 4 : 2.5 // un punto de aire cada tantos segundos
  const cap = s.easy ? 5 : 8 // la tripulación cierra la compuerta interna: más de esto no se pierde
  return Math.min(cap, Math.floor(sec / every))
}

/**
 * Efectos finales de la opción elegida según cómo salió la tarea.
 * result.crew = true → la hizo la tripulación sola (más lento y menos prolijo que hacerlo uno).
 * Devuelve { effects, line: [clave de texto, variables] } para el resultado y la bitácora.
 */
export function taskEffects(s, choice, result) {
  const base = { ...choice.effects }
  const crew = !!result.crew
  switch (s.task.id) {
    case 'seal': {
      const lost = crew ? leakLoss(s, 999) : leakLoss(s, result.time)
      delete base.o2
      return { effects: { ...base, o2: -lost }, line: crew ? ['task.crewLine.seal', { n: lost }] : ['task.line.seal', { s: Math.round(result.time), n: lost }] }
    }
    case 'clean': {
      const total = Math.max(1, result.total)
      const f = crew ? 0.5 : result.cleaned / total
      const level = Math.round((0.5 - 0.3 * f) * 100) / 100 // todos limpios: 20% menos ⚡ · ninguno: 50% menos
      const dust = { level, sols: f >= 1 ? 2 : 3 }
      return { effects: { ...base, dust }, line: crew ? ['task.crewLine.clean', { pct: Math.round((1 - level) * 100) }] : ['task.line.clean', { a: result.cleaned, b: result.total, pct: Math.round((1 - level) * 100) }] }
    }
    case 'circuit': {
      const shorts = crew ? 1 : Math.min(2, result.shorts)
      const effects = { ...base, chipsPenalty: (base.chipsPenalty || 0) + shorts }
      return { effects, line: crew ? ['task.crewLine.circuit', { n: shorts }] : shorts ? ['task.line.circuitShorts', { n: shorts }] : ['task.line.circuitOk'] }
    }
    case 'plants': {
      if (crew) return { effects: base, line: ['task.crewLine.plants', { n: -(base.food || 0) }] }
      const lost = 6 + result.wrong * 3 + result.missed * 4
      return { effects: { ...base, food: -lost }, line: ['task.line.plants', { ok: result.right, w: result.wrong, m: result.missed, n: lost }] }
    }
    case 'drive': {
      // llegar a tiempo y juntar muestras sube la chance de que la expedición salga bien
      const r = crew ? { arrived: true, found: 1 } : result // piloto automático: llega, pero junta una sola muestra
      if (base.chance !== undefined) {
        if (!r.arrived) return { effects: { ...base, chance: 0 }, line: ['task.line.driveLate'] }
        const chance = Math.min(0.95, base.chance + 0.08 * r.found)
        return { effects: { ...base, chance }, line: [crew ? 'task.crewLine.drive' : 'task.line.drive', { n: r.found, pct: Math.round(chance * 100) }] }
      }
      // lugar seguro (cerro): las muestras suman ciencia
      if (!r.arrived) return { effects: { ...base, science: 0 }, line: ['task.line.driveLate'] }
      const extra = r.found >= 2 ? 1 : 0
      return { effects: { ...base, science: (base.science || 0) + extra }, line: [crew ? 'task.crewLine.drive' : 'task.line.driveSafe', { n: r.found, x: extra }] }
    }
    case 'water': {
      const food = Math.max(0, result.inBand * 3 - result.spills * 2)
      return { effects: { ...base, food }, line: ['task.line.water', { ok: result.inBand, sp: result.spills, n: food }] }
    }
    case 'aim': {
      const secs = Math.round(result.time)
      const sci = 2 + (secs <= 12 ? 1 : 0) // rápido: un punto más
      return { effects: { ...base, science: sci }, line: ['task.line.aim', { s: secs, n: sci }] }
    }
    default:
      return { effects: base, line: null }
  }
}
