import { create } from 'zustand'
import {
  ITEMS, CAPACITY, LOAD_SECONDS, BASE, EVENTS, HELP_EVENTS, BUILD_HELP_EVENT, SOLS, REPAIRS, LEAK_O2, ICE_MINE_O2, MID_SOL, SUPPLY_EVENT,
  BUILDS, BUILD_FX, BUILD_FROM_SOL, MISSION_FROM_SOL, MISSION_BONUS, EXPEDITION_EVENT, EXPEDITION_FROM_SOL, EXPEDITION_MAX,
} from './content'
import { loadSpaceWeather, buildSolWeather } from '../data/donki'
import { taskEffects, taskSpots } from './tasks'
import { randomLayout } from './shipLayout'

const savedLang = (() => { try { return localStorage.getItem('mm-lang') || 'es' } catch { return 'es' } })()
const savedSound = (() => { try { return localStorage.getItem('mm-sound') !== '0' } catch { return true } })()

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)
export const itemCount = (cargo, id) => cargo.filter((x) => x === id).length
export const cargoMass = (cargo) => cargo.reduce((s, id) => s + ITEMS.find((i) => i.id === id).mass, 0)

// Modo cadete (menos de 10 años): más tiempo, más lugar, menos eventos y tormentas más suaves
export const CADET_AGE = 9
export const isCadet = (age) => !!age && age <= CADET_AGE
export const capacityFor = (s) => (s.easy ? CAPACITY + 4 : CAPACITY)
export const loadSecondsFor = (s) => (s.easy ? 90 : LOAD_SECONDS)

const emptyAlloc = { life: 0, greenhouse: 0, shield: 0, science: 0, build: 0, fixLeak: false, fixPanel: false }
const repairChips = (a) => (a.fixLeak ? REPAIRS.leak.cost : 0) + (a.fixPanel ? REPAIRS.panel.cost : 0)
export const chipsUsed = (a) => a.life + a.greenhouse + a.shield + a.science + (a.build || 0) + repairChips(a)

// 🏗️ Obras
export const hasBuilt = (s, id) => s.build.done.includes(id)
/** Obras que todavía se pueden hacer (no terminadas y con lo necesario para hacerlas). */
export const availableBuilds = (s) => BUILDS.filter((b) => !hasBuilt(s, b.id) && (!b.requires || s.inventory[b.requires]))
/** ¿Ya se puede construir? (desde el sol 2, mientras quede alguna obra por hacer) */
export const canBuild = (s) => s.sol >= BUILD_FROM_SOL && (!!s.build.active || availableBuilds(s).length > 0)
export const buildLeft = (s, id) => { const b = BUILDS.find((x) => x.id === id); return b ? b.cost - (s.build.progress[id] || 0) : 0 }

/** Energía disponible este sol (fichas ⚡). */
export function chipsAvailable(s) {
  const dustFactor = 1 - (s.dust.sols > 0 ? s.dust.level : 0)
  const solar = Math.round(s.panels * BASE.chipsPerPanel * dustFactor)
  return Math.max(0, solar + s.battery + (s.today.bonus || 0) - s.today.chipsPenalty)
}

export function shieldFraction(s, chips) {
  const water = s.inventory.water ? BASE.waterShieldBonus : 0
  const shelter = hasBuilt(s, 'shelter') ? BUILD_FX.shelterShield : 0 // el refugio frena siempre, sin gastar ⚡
  const f = chips > 0 ? chips * BASE.shieldPerChip + water : water * 0.5
  return clamp(f + shelter, 0, BASE.maxShield)
}

/** Calcula qué va a pasar al terminar el sol con la energía repartida así (la UI lo muestra como pronóstico). */
/**
 * Consumo diario según la dificultad: los cadetes respiran y comen menos (más margen);
 * desde los 10 años la base consume más y la energía no alcanza para todo.
 */
export const needs = (s) => (s.easy ? { o2: BASE.o2Use, food: BASE.foodUse } : { o2: BASE.o2UseHard, food: BASE.foodUseHard })

export function project(s, alloc = s.alloc) {
  const used = chipsUsed(alloc)
  const avail = chipsAvailable(s)
  const leftover = Math.max(0, avail - used)
  const cap = s.inventory.battery ? BASE.batteryCapWithItem : BASE.batteryCap
  const o2PerChip = s.inventory.moxie ? BASE.o2PerChipMoxie : BASE.o2PerChip
  const leakLoss = s.base.leak && !alloc.fixLeak ? LEAK_O2 : 0
  const mine = s.base.iceMine ? ICE_MINE_O2 : 0
  const use = needs(s)
  const dO2 = alloc.life * o2PerChip - use.o2 - leakLoss + mine
  const foodPerChip = BASE.foodPerChip + (hasBuilt(s, 'farm') ? BUILD_FX.farmFood : 0)
  const foodMade = s.inventory.seeds ? alloc.greenhouse * foodPerChip : 0
  const dFood = foodMade - use.food
  const sciMult = s.inventory.science ? 2 : 1
  const lab = hasBuilt(s, 'lab') && !s.today.blockScience ? BUILD_FX.labScience : 0
  const dSci = (s.today.blockScience ? 0 : alloc.science * sciMult) + lab
  // obra en marcha: cuánto avanza hoy
  const bid = s.build.active
  const bdef = bid && BUILDS.find((b) => b.id === bid)
  const bBefore = bdef ? s.build.progress[bid] || 0 : 0
  const bAfter = bdef ? Math.min(bdef.cost, bBefore + (alloc.build || 0)) : 0
  const build = bdef ? { id: bid, before: bBefore, after: bAfter, cost: bdef.cost, done: bAfter >= bdef.cost } : null
  const storm = s.plan[s.sol - 1] || { level: 0 }
  const blocked = shieldFraction(s, alloc.shield)
  const stormDose = storm.level ? BASE.stormDose[storm.level] * (1 - blocked) * (s.easy ? 0.5 : 1) : 0
  const dose = BASE.baseDose + stormDose
  return {
    used, avail, leftover, saved: Math.min(leftover, cap), wasted: Math.max(0, leftover - cap),
    dO2, dFood, dSci, dose, stormDose, blocked, storm, foodMade, leakLoss, mine, build, lab,
  }
}

/** Cómo quedarían los recursos al terminar el sol con esta energía (lo muestra el papel de la terminal). */
export function forecast(s, alloc = s.alloc) {
  const p = project(s, alloc)
  let o2 = clamp(s.o2 + p.dO2, -50, 100)
  let food = clamp(s.food + p.dFood, -50, 100)
  let health = s.health
  const warn = []
  if (o2 <= 0) { health -= 30; warn.push('noO2'); o2 = 0 }
  if (food <= 0) { health -= 25; warn.push('noFood'); food = 0 }
  const stormHit = p.stormDose > 0 ? Math.round(p.stormDose * 4) : 0
  health -= stormHit
  const dose = s.dose + p.dose
  if (dose > BASE.doseLimit) { health -= 10; warn.push('limit') }
  health = clamp(health, 0, 100)
  return { o2, food, health, dose, science: s.science + p.dSci, battery: p.saved, stormHit, warn, p }
}

/** Cómo quedarían los recursos si se elige esta opción de un evento. */
export function forecastChoice(s, choice) {
  const one = (eff = {}) => ({
    o2: clamp(s.o2 + (eff.o2 || 0), 0, 100),
    food: clamp(s.food + (eff.food || 0), 0, 100),
    health: clamp(s.health + (eff.health || 0), 0, 100),
    science: s.science + (eff.science || 0),
    dose: s.dose + (eff.dose || 0),
    chips: eff.chipsPenalty || 0,
    leak: !!eff.leak, mine: !!eff.iceMine, panel: !!eff.breakPanel, dust: eff.dust || null,
    noSci: !!eff.blockScience, item: eff.useItem || null, sample: !!eff.sample, bonus: eff.bonusNext || 0,
  })
  const e = choice.effects
  if (e.chance !== undefined) return { chance: e.chance, success: one(e.success), fail: one(e.fail) }
  return one(e)
}

/**
 * 🤖 Ayudante: reparte la energía de una forma razonable y explica por qué (para los más chicos).
 * Devuelve { alloc, reasons: [[clave, vars], ...] }
 */
export function recommendAlloc(s) {
  const avail = chipsAvailable(s)
  let left = avail
  const a = { ...emptyAlloc }
  const reasons = []
  const take = (n) => { const k = Math.max(0, Math.min(n, left)); left -= k; return k }
  const perChip = s.inventory.moxie ? BASE.o2PerChipMoxie : BASE.o2PerChip
  const leak = s.base.leak ? LEAK_O2 : 0
  const mine = s.base.iceMine ? ICE_MINE_O2 : 0
  // 1) el aire primero
  let needAir = Math.ceil(Math.max(0, needs(s).o2 + leak - mine) / perChip)
  if (s.o2 < 40) needAir += 1
  a.life = Math.min(BASE.maxChipsPerSystem, take(needAir))
  reasons.push(['help.air', { n: a.life }])
  // 2) tormenta → escudo
  const storm = s.plan[s.sol - 1]
  if (storm?.level) { a.shield = Math.min(BASE.maxChipsPerSystem, take(3)); reasons.push(['help.shield', { n: a.shield }]) }
  // 3) comida si queda poca
  if (s.inventory.seeds && s.food < 70) { a.greenhouse = Math.min(BASE.maxChipsPerSystem, take(s.food < 35 ? 3 : 2)); if (a.greenhouse) reasons.push(['help.food', { n: a.greenhouse }]) }
  // 4) reparar lo roto
  if (s.base.leak && left >= REPAIRS.leak.cost) { a.fixLeak = true; left -= REPAIRS.leak.cost; reasons.push(['help.leak']) }
  if (s.base.brokenPanels > 0 && left >= REPAIRS.panel.cost) { a.fixPanel = true; left -= REPAIRS.panel.cost; reasons.push(['help.panel']) }
  // 5) un poco para la obra, si hay una en marcha
  if (s.build.active && left > 0) { a.build = take(Math.min(2, buildLeft(s, s.build.active))); if (a.build) reasons.push(['help.build', { n: a.build }]) }
  // 6) lo que sobra, a ciencia
  if (!s.today.blockScience && left > 0) { a.science = Math.min(BASE.maxChipsPerSystem, take(left)); if (a.science) reasons.push(['help.science', { n: a.science }]) }
  return { alloc: a, reasons }
}

/** 💡 La opción que recomendaría la tripulación en un evento (la que menos daño deja). */
export function recommendChoice(s, choices) {
  let best = 0, bestScore = -Infinity
  choices.forEach((c, i) => {
    const f = forecastChoice(s, c)
    // lo que está escaso vale el doble (si queda poco aire, conviene la opción que da aire)
    const sc = (x) => (x.o2 - s.o2) * (s.o2 < 45 ? 2 : 1) + (x.food - s.food) * (s.food < 45 ? 2 : 1) + (x.health - s.health) * 1.5 + (x.science - s.science) * 3 - (x.dose - s.dose) * 5 - x.chips * 4 - (x.leak ? 30 : 0) - (x.panel ? 25 : 0) + (x.mine ? 30 : 0) - (x.dust ? x.dust.sols * 4 : 0) - (x.noSci ? 2 : 0) + (x.sample ? 6 : 0) + x.bonus * 4
    const score = f.chance !== undefined ? f.chance * sc(f.success) + (1 - f.chance) * sc(f.fail) : sc(f)
    if (score > bestScore) { bestScore = score; best = i }
  })
  return best
}

/** 🎯 ¿Se está cumpliendo la misión de hoy con la energía repartida así? */
export function missionMet(s, f = forecast(s)) {
  if (!s.mission) return false
  const p = f.p, a = s.alloc
  switch (s.mission.id) {
    // Los números están pensados para que haya que cambiar el reparto de siempre (no se cumplen solas)
    case 'shield': return p.blocked >= 0.85
    case 'fix': return (a.fixLeak && s.base.leak) || (a.fixPanel && s.base.brokenPanels > 0)
    case 'air': return p.dO2 >= 10
    case 'food': return p.dFood >= 5
    case 'science': return p.dSci >= 3
    case 'save': return p.saved >= (s.inventory.battery ? 2 : 1)
    case 'build': return !!p.build && (a.build >= 2 || (p.build.done && a.build > 0))
    default: return false
  }
}
/** Elige la misión del sol: con tormenta fuerte es frenarla; si no, una al azar entre las que se pueden cumplir. */
function pickMission(s, storm) {
  if (s.sol < MISSION_FROM_SOL) return null
  if (storm?.level >= 2) return { id: 'shield' } // tormenta fuerte: la misión es frenarla
  const pool = ['save', 'science']
  if (storm?.level) pool.push('shield')
  if (s.o2 <= 85) pool.push('air')
  if (s.base.leak || s.base.brokenPanels > 0) pool.push('fix', 'fix')
  if (s.inventory.seeds && s.food <= 85) pool.push('food')
  if (s.build.active || availableBuilds(s).length) pool.push('build', 'build')
  const fresh = pool.filter((id) => id !== s.mission?.id)
  return { id: fresh[Math.floor(Math.random() * fresh.length)] }
}

// Objetos de la nave (las raciones aparecen 2 veces)
export function makeRoomItems() {
  const list = []
  ITEMS.forEach((it) => {
    for (let i = 0; i < (it.max || 1); i++) list.push({ key: `${it.id}-${i}`, id: it.id, state: 'shelf' })
  })
  return list
}
export const MAX_CARRY = 2

const ALL_EVENTS = [...EVENTS, ...HELP_EVENTS]
/** Una tarea nueva, recién empezada. */
// en la expedición, antes de salir se elige quién acompaña en el rover
const newTask = (id, choiceIdx) => ({ id, choiceIdx, elapsed: 0, near: null, mini: id === 'drive' ? 'mate' : null, busy: null, cleaned: [], found: [], arrived: false, talked: false, mate: null })

/** Pone primero en el mazo un evento que se resuelve a mano, así en los primeros soles se juega al menos uno. */
function handsOnFirst(deck) {
  const i = deck.findIndex((e) => ['leak', 'dust', 'panelbreak'].includes(e.id))
  return i > 0 ? [deck[i], ...deck.slice(0, i), ...deck.slice(i + 1)] : deck
}

/** Lo que se conserva al volver a jugar: idioma, jugador y preferencias. */
const keep = (s) => ({ lang: s.lang, player: s.player, voice: s.voice, lite: s.lite, sound: s.sound, seenIntro: s.seenIntro })

// Estado físico de la base: cambia con las decisiones y se ve en 3D
const freshBase = () => ({
  leak: false, // fuga abierta (castigo que dura)
  patches: 0, // parches visibles en el domo
  brokenPanels: 0, // paneles rotos (castigo que dura)
  iceMine: false, // mina de hielo (premio que dura)
  samples: 0, // muestras de roca guardadas
  plantsLost: 0, // plantas sacadas por la plaga
  uvGlow: 0,
})

let savedLite = false
try { savedLite = localStorage.getItem('mm-lite') === '1' } catch { /* sin localStorage */ }

const initialState = {
  lang: savedLang,
  voice: null, // 🔊 null = automático (prendida en modo cadete); true/false si el jugador la tocó
  lite: savedLite, // ⚙️ gráficos livianos para compus viejas
  sound: savedSound, // 🎵 efectos de sonido y ambiente
  seenIntro: false, // este comandante ya vio el despegue y el tutorial: al volver a jugar va directo a la nave
  paused: false, // ⏸️ menú de pausa (tecla Esc)
  quiz: { pre: null, post: null }, // respuestas del quiz final (solo en memoria)
  layout: {}, // objeto → lugar en la nave (al azar en cada partida)
  roomPlayerX: 0,
  roomFocus: null, // lo que el comandante tiene cerca (para mostrar la info al jugar con teclado)
  decisions: [], // bitácora de decisiones para el informe final
  helpReasons: null, // explicación del ayudante en el plan de energía
  screen: 'title', // title | character | mode | launch | tutorial | loading | landing | sol | end
  player: { name: '', age: null, character: null },
  easy: false,
  roomItems: makeRoomItems(),
  openFurn: [], // muebles abiertos en la nave
  roomLeft: null, // segundos que quedan en la nave (para la tormenta que se acerca)
  carrying: [],
  roomMsg: null,
  roomInspect: null, // objeto bajo el mouse (para la ficha del objeto)
  mode: 'recent',
  weather: null,
  weatherLoading: false,
  cargo: [],
  // estado de la base
  sol: 1,
  // dawn → (event | incident → decision → [task] → outcome)* → plan → report
  phase: 'dawn',
  o2: BASE.o2, food: BASE.food, health: BASE.health, science: 0, dose: 0,
  panels: BASE.panels, battery: 0,
  dust: { level: 0, sols: 0 },
  inventory: {},
  base: freshBase(),
  plan: [],
  alloc: { ...emptyAlloc },
  today: { chipsPenalty: 0, blockScience: false, bonus: 0 },
  lastBuildHelp: 0, // último sol en que la ingeniera pidió ayuda con la obra
  build: { active: null, progress: {}, done: [] }, // 🏗️ obra elegida, avance de cada una y las terminadas
  mission: null, // 🎯 misión de hoy: { id }
  medals: 0, // 🏅 misiones cumplidas
  bonusNext: 0, // ⚡ extra para mañana (misión cumplida, expedición)
  task: null, // 🛠️ tarea física en curso: { id, choiceIdx, elapsed, near, mini, busy, cleaned, sealed }
  visited: [], // 🚙 lugares ya explorados
  expeditions: 0,
  lastExpedition: 0,
  cards: [],
  cardResult: null,
  eventDeck: [],
  report: null,
  log: [],
  learned: [],
  outcome: null,
  loseReason: null,
}

export const BAD_FX = new Set(['leaking', 'dusty', 'worse', 'panelbroken', 'nothing'])
const phaseFor = (card) => (!card ? 'plan' : card.type === 'event' ? 'incident' : 'event')

export const useGame = create((set, get) => ({
  ...initialState,

  setLang: (lang) => {
    try { localStorage.setItem('mm-lang', lang) } catch { /* sin almacenamiento */ }
    set({ lang })
  },
  goTitle: () => set({ ...initialState, ...keep(get()) }),
  goCharacter: () => set({ screen: 'character', seenIntro: false }), // otro comandante (otro chico): vuelve a ver todo
  setPlayer: (patch) => set({ player: { ...get().player, ...patch } }),
  goModes: () => set({ ...initialState, ...keep(get()), screen: 'mode' }),

  // Modo elegido → cinemática de despegue (mientras tanto se consulta a la NASA)
  startLoading: (mode) => {
    const roomItems = makeRoomItems()
    // La primera vez: despegue + tutorial. Si este comandante ya los vio, va directo a cargar la cápsula.
    const screen = get().seenIntro ? 'loading' : 'launch'
    set({ ...initialState, ...keep(get()), screen, mode, easy: isCadet(get().player.age), weatherLoading: true, roomItems, layout: randomLayout(roomItems.map((r) => r.key)) })
    loadSpaceWeather(mode).then((weather) => set({ weather, weatherLoading: false }))
  },
  // Quiz final (4 preguntas para repasar lo aprendido). Se puede saltear.
  finishQuizPost: (answers) => set({ quiz: { pre: null, post: answers || [] } }),
  // ⏸️ Pausa: se puede pausar durante la misión (no en los menús)
  setPaused: (paused) => {
    const PAUSABLE = ['launch', 'tutorial', 'loading', 'landing', 'sol']
    if (paused && !PAUSABLE.includes(get().screen)) return
    set({ paused })
  },
  /** Reiniciar la misión desde cero, con el mismo comandante y el mismo modo. */
  restartMission: () => get().startLoading(get().mode || 'recent'),
  toggleVoice: () => set({ voice: !(get().voice ?? get().easy) }),
  toggleLite: () => {
    const lite = !get().lite
    try { localStorage.setItem('mm-lite', lite ? '1' : '0') } catch { /* nada */ }
    set({ lite })
  },
  /** 🎬 Demo rápida: salta el quiz, el despegue, la carga y el aterrizaje, con una carga razonable. Ideal para mostrar al jurado. */
  quickStart: async (mode = 'may2024') => {
    const roomItems = makeRoomItems()
    set({ ...initialState, ...keep(get()), screen: 'mode', mode, easy: isCadet(get().player.age), weatherLoading: true, roomItems, layout: randomLayout(roomItems.map((r) => r.key)) })
    const weather = await loadSpaceWeather(mode)
    set({ weather, weatherLoading: false, cargo: ['seeds', 'moxie', 'battery', 'water', 'repair', 'o2tank'] })
    get().launch()
    set({ screen: 'sol' })
    get().prepareSol()
  },
  // Orden: despegue (Tierra) → tutorial → recolección en la nave → aterrizaje (Marte) → Sol 1
  finishLaunch: () => { if (get().screen === 'launch') set({ screen: 'tutorial' }) },
  finishTutorial: () => { if (get().screen === 'tutorial') set({ screen: 'loading', seenIntro: true }) },
  /** Volver a mirar el tutorial desde la nave (antes de arrancar el reloj). */
  watchTutorial: () => { if (get().screen === 'loading') set({ screen: 'tutorial' }) },
  toggleSound: () => {
    const sound = !get().sound
    try { localStorage.setItem('mm-sound', sound ? '1' : '0') } catch { /* nada */ }
    set({ sound })
  },
  finishLanding: () => {
    if (get().screen !== 'landing') return
    set({ screen: 'sol' })
    get().prepareSol()
  },

  // ---- Nave: abrir muebles, agarrar y llevar objetos ----
  say: (type) => set({ roomMsg: { type, t: Date.now() } }),
  openFurniture: (id) => {
    const s = get()
    if (!s.openFurn.includes(id)) set({ openFurn: [...s.openFurn, id] })
  },

  pickItem: (key) => {
    const s = get()
    const ri = s.roomItems.find((r) => r.key === key)
    if (!ri || ri.state !== 'shelf') return false
    if (s.carrying.length >= MAX_CARRY) { s.say('hands'); return false }
    const item = ITEMS.find((i) => i.id === ri.id)
    const carriedMass = s.carrying.reduce((m, k) => m + ITEMS.find((i) => i.id === s.roomItems.find((r) => r.key === k).id).mass, 0)
    if (cargoMass(s.cargo) + carriedMass + item.mass > capacityFor(s)) { s.say('heavy'); return false }
    set({
      roomItems: s.roomItems.map((r) => (r.key === key ? { ...r, state: 'carried' } : r)),
      carrying: [...s.carrying, key],
      roomMsg: { type: 'picked', id: ri.id, t: Date.now() },
      roomInspect: null,
    })
    return true
  },

  depositAll: () => {
    const s = get()
    if (!s.carrying.length) return
    const ids = s.carrying.map((k) => s.roomItems.find((r) => r.key === k).id)
    set({
      roomItems: s.roomItems.map((r) => (s.carrying.includes(r.key) ? { ...r, state: 'loaded' } : r)),
      cargo: [...s.cargo, ...ids],
      carrying: [],
      roomMsg: { type: 'loaded', t: Date.now() },
    })
  },

  unload: (key) => {
    const s = get()
    const ri = s.roomItems.find((r) => r.key === key)
    if (!ri || ri.state !== 'loaded') return
    const idx = s.cargo.lastIndexOf(ri.id)
    set({
      roomItems: s.roomItems.map((r) => (r.key === key ? { ...r, state: 'shelf' } : r)),
      cargo: s.cargo.filter((_, i) => i !== idx),
    })
  },

  // Fin de la recolección → aterrizaje en Marte → empieza la misión
  launch: () => {
    const { cargo, weather, mode } = get()
    const inv = {}
    cargo.forEach((id) => (inv[id] = (inv[id] || 0) + 1))
    const plan = buildSolWeather(weather, SOLS, mode)
    const easy = isCadet(get().player.age) // modo cadete para los más chicos
    const bonus = easy ? 20 : 0
    set({
      easy,
      inventory: inv,
      base: freshBase(),
      panels: BASE.panels + (inv.panel || 0),
      o2: clamp(BASE.o2 + bonus + 30 * (inv.o2tank || 0), 0, 100),
      food: clamp(BASE.food + bonus + 30 * (inv.rations || 0), 0, 100),
      plan,
      eventDeck: handsOnFirst(shuffle(ALL_EVENTS.filter((e) => !e.requires || inv[e.requires]))),
      screen: 'landing',
      sol: 1,
      learned: [],
      log: [],
      decisions: [],
    })
  },

  prepareSol: () => {
    const s = get()
    const storm = s.plan[s.sol - 1]
    const cards = [{ type: 'briefing', storm: storm && storm.level > 0 ? storm : null, warn: storm?.warn || null, miss: storm?.miss || null, intro: s.sol === 1 }]
    const eventChance = storm && storm.level > 0 ? (s.easy ? 0.2 : 0.35) : s.sol === 1 ? 0 : s.easy ? 0.55 : 0.8
    let deck = s.eventDeck
    // 🚙 Expedición: solo en días sin tormenta, dejando al menos un sol entre una y otra
    const sites = EXPEDITION_EVENT.choices.map((c) => c.site).filter((x) => x && !s.visited.includes(x))
    const canExplore = !(storm && storm.level > 0) && s.sol >= EXPEDITION_FROM_SOL && s.sol !== MID_SOL && s.expeditions < EXPEDITION_MAX && s.sol - s.lastExpedition >= 2 && sites.length > 0
    let lastExpedition = s.lastExpedition
    let lastBuildHelp = s.lastBuildHelp
    if (s.sol === MID_SOL) {
      // 📦 Mitad de misión: siempre llega la cápsula de carga (y ese día no hay otro evento)
      cards.push({ type: 'event', event: SUPPLY_EVENT })
    } else if (canExplore && Math.random() < (s.expeditions === 0 && s.sol >= 4 ? 0.85 : 0.5)) {
      cards.push({ type: 'event', event: EXPEDITION_EVENT, sites: shuffle(sites).slice(0, 2) })
      lastExpedition = s.sol
    } else if (s.build.active && buildLeft(s, s.build.active) >= 2 && s.sol - s.lastBuildHelp >= 3 && Math.random() < 0.5) {
      // 🏗️ hay una obra a medio hacer: la ingeniera pide una mano
      cards.push({ type: 'event', event: BUILD_HELP_EVENT })
      lastBuildHelp = s.sol
    } else if (Math.random() < eventChance) {
      if (!deck.length) deck = shuffle(ALL_EVENTS.filter((e) => !e.requires || s.inventory[e.requires]))
      // No repetir la fuga si ya hay una abierta
      let idx = deck.findIndex((e) => !(e.id === 'leak' && s.base.leak))
      if (idx < 0) idx = 0
      const ev = deck[idx]
      cards.push({ type: 'event', event: ev })
      deck = deck.filter((_, i) => i !== idx)
    }
    set({
      cards, eventDeck: deck, cardResult: null, lastExpedition, lastBuildHelp,
      phase: 'dawn',
      today: { chipsPenalty: 0, blockScience: false, bonus: s.bonusNext },
      bonusNext: 0,
      mission: pickMission(s, storm),
      alloc: { ...emptyAlloc },
      helpReasons: null,
      report: null,
    })
  },

  afterDawn: () => set({ phase: phaseFor(get().cards[0]) }),
  toDecision: () => {
    const s = get()
    const ev = s.cards[0]?.event
    // 🙋 pedido de ayuda: no pasa por la computadora, se sale directo a la base a hablar con el compañero
    if (ev?.direct) return set({ phase: 'task', task: newTask(ev.choices[0].task, 0) })
    set({ phase: 'decision' })
  },

  choose: (choice) => {
    const s = get()
    if (s.phase !== 'decision') return // evita doble click mientras se cierra la computadora
    const card = s.cards[0]
    const choiceIdx = card.event.choices.indexOf(choice)
    // 🛠️ Esta opción se hace a mano: primero la tarea en la base, después se calculan los efectos
    if (choice.task) {
      return set({ phase: 'task', task: newTask(choice.task, choiceIdx) })
    }
    get().resolveChoice(choice, choiceIdx, choice.effects)
  },

  /** Aplica los efectos de una opción (o los que salieron de la tarea) y pasa a mostrar el resultado. */
  resolveChoice: (choice, choiceIdx, effects, taskLine = null) => {
    const s = get()
    const card = s.cards[0]
    let eff = effects
    let fx = choice.fx
    let ok = true
    if (eff.chance !== undefined) {
      ok = Math.random() < eff.chance
      eff = ok ? eff.success : eff.fail
      fx = ok ? choice.fx.success : choice.fx.fail
    }
    const patch = applyEffects(s, eff, fx)
    // dato aprendido: el del evento, o el del lugar explorado ("exp:N" = opción N de la expedición)
    const factKey = choice.fact ? `exp:${choiceIdx}` : card.event?.fact
    const learned = factKey && !s.learned.includes(factKey) ? [...s.learned, factKey] : s.learned
    if (card.event.expedition) { patch.expeditions = s.expeditions + 1; if (choice.site) patch.visited = [...s.visited, choice.site] }
    const good = !BAD_FX.has(fx)
    const decisions = [...s.decisions, { sol: s.sol, ev: card.event, choiceIdx, ok, fx, good, taskLine }]
    set({ ...patch, learned, decisions, task: null, phase: 'outcome', cardResult: { choiceIdx, ok, effects: eff, fx, good, taskLine, t: Date.now() } })
  },

  // ---- 🛠️ Tarea física en la base ----
  /** Actualiza la tarea en curso (lo usan la escena 3D y los desafíos). */
  taskPatch: (patch) => { const t = get().task; if (t) set({ task: { ...t, ...patch } }) },
  /** El comandante llegó a un lugar de la tarea y lo usa (tecla E, botón o tocándolo). */
  taskAct: (spotId) => {
    const s = get()
    const t = s.task
    if (s.phase !== 'task' || !t || t.mini || t.busy) return
    const spot = taskSpots(s).find((p) => p.id === spotId)
    if (!spot || spot.done) return
    if (spot.act === 'clean') set({ task: { ...t, busy: spotId } })
    else if (spot.act === 'arrive' || spot.act === 'pick') set({ task: { ...t, arrived: true, near: null } })
    else if (spot.act === 'home') get().finishTask({ time: t.elapsed })
    else if (spot.act === 'collect') {
      const found = [...t.found, Number(spotId.slice(6))]
      set({ task: { ...t, found, near: null } })
      if (found.length >= 3) setTimeout(() => get().finishTask({ arrived: true, found: found.length }), 600)
    } else set({ task: { ...t, mini: spot.act } })
  },
  /** Termina la tarea. result: lo que hizo el jugador (o { crew: true } si la deja a la tripulación). */
  finishTask: (result) => {
    const s = get()
    if (s.phase !== 'task' || !s.task) return
    const ev = s.cards[0].event
    // pedido de ayuda que no se acepta (o "ahora no"): es la segunda opción del evento, tal cual
    if (ev.direct && result.crew) return get().resolveChoice(ev.choices[1], 1, ev.choices[1].effects)
    const choice = ev.choices[s.task.choiceIdx]
    const { effects, line } = taskEffects(s, choice, result)
    get().resolveChoice(choice, s.task.choiceIdx, effects, line)
  },

  nextCard: () => {
    const s = get()
    if (s.phase !== 'event' && s.phase !== 'outcome') return
    const rest = s.cards.slice(1)
    let learned = s.learned
    const card = s.cards[0]
    if (card?.type === 'briefing' && card.storm && !learned.includes('storm')) learned = [...learned, 'storm']
    set({ cards: rest, cardResult: null, learned, phase: phaseFor(rest[0]) })
  },

  autoPlan: () => {
    const s = get()
    if (s.phase !== 'plan' || !s.easy) return // ayuda solo para cadetes
    const r = recommendAlloc(s)
    set({ alloc: r.alloc, helpReasons: r.reasons })
  },

  /** 🏗️ Elegir qué obra construir (se puede cambiar: lo avanzado en cada una no se pierde). */
  pickBuild: (id) => {
    const s = get()
    if (s.phase !== 'plan' || !canBuild(s) || !availableBuilds(s).some((b) => b.id === id)) return
    set({ build: { ...s.build, active: id }, alloc: { ...s.alloc, build: Math.min(s.alloc.build, buildLeft(s, id)) }, helpReasons: null })
  },

  setAlloc: (sys, val) => {
    const s = get()
    if (sys === 'build') {
      if (!s.build.active) return
      val = Math.min(val, buildLeft(s, s.build.active))
    }
    const v = typeof val === 'boolean' ? val : clamp(val, 0, BASE.maxChipsPerSystem)
    const next = { ...s.alloc, [sys]: v }
    if (chipsUsed(next) > chipsAvailable(s)) return
    set({ alloc: next, helpReasons: null })
  },

  endSol: () => {
    const s = get()
    if (s.phase !== 'plan') return
    const f = forecast(s)
    const p = f.p
    const notes = []
    const base = { ...s.base }
    let panels = s.panels
    if (s.alloc.fixLeak && base.leak) { base.leak = false; base.patches += 1; notes.push(['n.leakFixed']) }
    if (s.alloc.fixPanel && base.brokenPanels > 0) { base.brokenPanels -= 1; panels += 1; notes.push(['n.panelFixed']) }
    if (p.leakLoss) notes.push(['n.leakLoss', { n: p.leakLoss }])
    if (p.mine) notes.push(['n.mine', { n: p.mine }])
    if (f.warn.includes('noO2')) notes.push(['n.noO2'])
    if (f.warn.includes('noFood')) notes.push(['n.noFood'])
    if (f.stormHit) notes.push(['n.storm', { d: p.stormDose.toFixed(1), h: f.stormHit }])
    if (f.warn.includes('limit')) notes.push(['n.limit'])
    // 🏗️ obra
    let build = s.build
    let learned = s.learned
    let built = null
    if (p.build && s.alloc.build > 0) {
      const progress = { ...build.progress, [p.build.id]: p.build.after }
      if (p.build.done) {
        built = p.build.id
        build = { active: null, progress, done: [...build.done, built] }
        if (built === 'panel') panels += 1
        notes.push(['n.built', { build: built }])
        learned = [...learned, 'build:' + built]
      } else {
        build = { ...build, progress }
        notes.push(['n.building', { build: p.build.id, a: p.build.after, b: p.build.cost }])
      }
    }
    if (p.lab) notes.push(['n.lab', { n: p.lab }])
    // 🎯 misión del día
    const met = missionMet(s, f)
    if (s.mission) notes.push([met ? 'n.missionOk' : 'n.missionKo', { mission: s.mission.id, n: MISSION_BONUS }])
    const dust = s.dust.sols > 0 ? { ...s.dust, sols: s.dust.sols - 1 } : s.dust
    const report = { ...p, notes, o2Before: s.o2, foodBefore: s.food, healthBefore: s.health }
    const log = [...s.log, { sol: s.sol, storm: p.storm, alloc: s.alloc, dose: p.dose, stormDose: p.stormDose, blocked: p.blocked, health: f.health, fixedLeak: !!(s.alloc.fixLeak && s.base.leak), fixedPanel: !!(s.alloc.fixPanel && s.base.brokenPanels > 0), built, mission: s.mission?.id || null, missionMet: met }]
    set({ build, learned, medals: s.medals + (met ? 1 : 0), bonusNext: s.bonusNext + (met ? MISSION_BONUS : 0), o2: f.o2, food: f.food, health: f.health, dose: f.dose, science: f.science, battery: f.battery, dust, base, panels, report, log, phase: 'report' })
  },

  nextSol: () => {
    const s = get()
    if (s.phase !== 'report') return
    if (s.health <= 0) {
      const reason = s.o2 <= 0 ? 'oxygen' : s.food <= 0 ? 'food' : s.dose > BASE.doseLimit ? 'radiation' : 'health'
      return set({ screen: 'end', outcome: 'lose', loseReason: reason })
    }
    if (s.sol >= SOLS) return set({ screen: 'end', outcome: 'win' })
    set({ sol: s.sol + 1, base: { ...s.base, uvGlow: 0 } })
    get().prepareSol()
  },
}))

function applyEffects(s, e = {}, fx) {
  const patch = {}
  const base = { ...s.base }
  if (e.o2) patch.o2 = clamp(s.o2 + e.o2, 0, 100)
  if (e.food) patch.food = clamp(s.food + e.food, 0, 100)
  if (e.health) patch.health = clamp(s.health + e.health, 0, 100)
  if (e.science) patch.science = s.science + e.science
  if (e.dose) patch.dose = s.dose + e.dose
  if (e.dust) patch.dust = { ...e.dust }
  if (e.chipsPenalty || e.blockScience) {
    patch.today = {
      ...s.today,
      chipsPenalty: s.today.chipsPenalty + (e.chipsPenalty || 0),
      blockScience: s.today.blockScience || !!e.blockScience,
    }
  }
  if (e.bonusNext) patch.bonusNext = s.bonusNext + e.bonusNext
  // 🏗️ la obra avanza (nunca la termina: el último paso se hace de noche con la energía del plan)
  if (e.buildProgress && s.build.active) {
    const id = s.build.active
    patch.build = { ...s.build, progress: { ...s.build.progress, [id]: (s.build.progress[id] || 0) + e.buildProgress } }
  }
  if (e.useItem) patch.inventory = { ...s.inventory, [e.useItem]: Math.max(0, (s.inventory[e.useItem] || 0) - 1) }
  // Cambios que quedan en la base
  if (e.leak) base.leak = true
  if (fx === 'patched') base.patches += 1
  if (e.breakPanel) { base.brokenPanels += 1; patch.panels = Math.max(1, s.panels - 1) }
  if (e.iceMine) base.iceMine = true
  if (e.sample) base.samples += 1
  if (fx === 'fewerplants') base.plantsLost += 10
  if (fx === 'uv') base.uvGlow = 1
  patch.base = base
  return patch
}
