import { create } from 'zustand'
import { ITEMS, CAPACITY, BASE, EVENTS, SOLS, REPAIRS, LEAK_O2, ICE_MINE_O2 } from './content'
import { loadSpaceWeather, buildSolWeather } from '../data/donki'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)
export const itemCount = (cargo, id) => cargo.filter((x) => x === id).length
export const cargoMass = (cargo) => cargo.reduce((s, id) => s + ITEMS.find((i) => i.id === id).mass, 0)

const emptyAlloc = { life: 0, greenhouse: 0, shield: 0, science: 0, fixLeak: false, fixPanel: false }
const repairChips = (a) => (a.fixLeak ? REPAIRS.leak.cost : 0) + (a.fixPanel ? REPAIRS.panel.cost : 0)
export const chipsUsed = (a) => a.life + a.greenhouse + a.shield + a.science + repairChips(a)

/** Energía disponible este sol (fichas ⚡). */
export function chipsAvailable(s) {
  const dustFactor = 1 - (s.dust.sols > 0 ? s.dust.level : 0)
  const solar = Math.round(s.panels * BASE.chipsPerPanel * dustFactor)
  return Math.max(0, solar + s.battery - s.today.chipsPenalty)
}

export function shieldFraction(s, chips) {
  const water = s.inventory.water ? BASE.waterShieldBonus : 0
  const f = chips > 0 ? chips * BASE.shieldPerChip + water : water * 0.5
  return clamp(f, 0, BASE.maxShield)
}

/** Calcula qué va a pasar al terminar el sol con la energía repartida así (la UI lo muestra como pronóstico). */
export function project(s, alloc = s.alloc) {
  const used = chipsUsed(alloc)
  const avail = chipsAvailable(s)
  const leftover = Math.max(0, avail - used)
  const cap = s.inventory.battery ? BASE.batteryCapWithItem : BASE.batteryCap
  const o2PerChip = s.inventory.moxie ? BASE.o2PerChipMoxie : BASE.o2PerChip
  const leakLoss = s.base.leak && !alloc.fixLeak ? LEAK_O2 : 0
  const mine = s.base.iceMine ? ICE_MINE_O2 : 0
  const dO2 = alloc.life * o2PerChip - BASE.o2Use - leakLoss + mine
  const foodMade = s.inventory.seeds ? alloc.greenhouse * BASE.foodPerChip : 0
  const dFood = foodMade - BASE.foodUse
  const sciMult = s.inventory.science ? 2 : 1
  const dSci = s.today.blockScience ? 0 : alloc.science * sciMult
  const storm = s.plan[s.sol - 1] || { level: 0 }
  const blocked = shieldFraction(s, alloc.shield)
  const stormDose = storm.level ? BASE.stormDose[storm.level] * (1 - blocked) * (s.easy ? 0.6 : 1) : 0
  const dose = BASE.baseDose + stormDose
  return {
    used, avail, leftover, saved: Math.min(leftover, cap), wasted: Math.max(0, leftover - cap),
    dO2, dFood, dSci, dose, stormDose, blocked, storm, foodMade, leakLoss, mine,
  }
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

const initialState = {
  screen: 'title', // title | character | mode | landing | loading | sol | end
  player: { name: '', age: null, character: null },
  easy: false,
  roomItems: makeRoomItems(),
  openFurn: [], // muebles abiertos en la nave
  roomLeft: null, // segundos que quedan en la nave (para la tormenta que se acerca)
  carrying: [],
  roomMsg: null,
  mode: 'recent',
  weather: null,
  weatherLoading: false,
  cargo: [],
  // estado de la base
  sol: 1,
  // dawn → (event | incident → decision → outcome)* → plan → report
  phase: 'dawn',
  o2: BASE.o2, food: BASE.food, health: BASE.health, science: 0, dose: 0,
  panels: BASE.panels, battery: 0,
  dust: { level: 0, sols: 0 },
  inventory: {},
  base: freshBase(),
  plan: [],
  alloc: { ...emptyAlloc },
  today: { chipsPenalty: 0, blockScience: false },
  cards: [],
  cardResult: null,
  eventDeck: [],
  report: null,
  log: [],
  learned: [],
  outcome: null,
  loseReason: null,
}

const phaseFor = (card) => (!card ? 'plan' : card.type === 'event' ? 'incident' : 'event')

export const useGame = create((set, get) => ({
  ...initialState,

  goTitle: () => set({ ...initialState, player: get().player }),
  goCharacter: () => set({ screen: 'character' }),
  setPlayer: (patch) => set({ player: { ...get().player, ...patch } }),
  goModes: () => set({ ...initialState, player: get().player, screen: 'mode' }),

  // Modo elegido → cinemática de aterrizaje (mientras tanto se consulta a la NASA)
  startLoading: (mode) => {
    set({ ...initialState, player: get().player, screen: 'landing', mode, weatherLoading: true, roomItems: makeRoomItems() })
    loadSpaceWeather(mode).then((weather) => set({ weather, weatherLoading: false }))
  },
  finishLanding: () => set({ screen: 'loading' }),

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
    if (cargoMass(s.cargo) + carriedMass + item.mass > CAPACITY) { s.say('heavy'); return false }
    set({
      roomItems: s.roomItems.map((r) => (r.key === key ? { ...r, state: 'carried' } : r)),
      carrying: [...s.carrying, key],
      roomMsg: { type: 'picked', id: ri.id, t: Date.now() },
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

  // Fin de la recolección → empieza la misión
  launch: () => {
    const { cargo, weather, mode } = get()
    const inv = {}
    cargo.forEach((id) => (inv[id] = (inv[id] || 0) + 1))
    const plan = buildSolWeather(weather, SOLS, mode)
    const age = get().player.age
    const easy = !!age && age <= 8 // modo cadete para los más chicos
    const bonus = easy ? 15 : 0
    set({
      easy,
      inventory: inv,
      base: freshBase(),
      panels: BASE.panels + (inv.panel || 0),
      o2: clamp(BASE.o2 + bonus + 30 * (inv.o2tank || 0), 0, 100),
      food: clamp(BASE.food + bonus + 30 * (inv.rations || 0), 0, 100),
      plan,
      eventDeck: shuffle(EVENTS.filter((e) => !e.requires || inv[e.requires])),
      screen: 'sol',
      sol: 1,
      learned: [],
      log: [],
    })
    get().prepareSol()
  },

  prepareSol: () => {
    const s = get()
    const storm = s.plan[s.sol - 1]
    const cards = []
    if (storm && storm.level > 0) cards.push({ type: 'storm', storm })
    const eventChance = storm && storm.level > 0 ? 0.35 : s.sol === 1 ? 0 : 0.8
    let deck = s.eventDeck
    if (Math.random() < eventChance) {
      if (!deck.length) deck = shuffle(EVENTS.filter((e) => !e.requires || s.inventory[e.requires]))
      // No repetir la fuga si ya hay una abierta
      let idx = deck.findIndex((e) => !(e.id === 'leak' && s.base.leak))
      if (idx < 0) idx = 0
      const ev = deck[idx]
      cards.push({ type: 'event', event: ev })
      deck = deck.filter((_, i) => i !== idx)
    }
    if (s.sol === 1) cards.unshift({ type: 'intro' })
    set({
      cards, eventDeck: deck, cardResult: null,
      phase: 'dawn',
      today: { chipsPenalty: 0, blockScience: false },
      alloc: { ...emptyAlloc },
      report: null,
    })
  },

  afterDawn: () => set({ phase: phaseFor(get().cards[0]) }),
  toDecision: () => set({ phase: 'decision' }),

  choose: (choice) => {
    const s = get()
    let eff = choice.effects
    let outcome = choice.outcome
    let fx = choice.fx
    if (eff.chance !== undefined) {
      const ok = Math.random() < eff.chance
      eff = ok ? eff.success : eff.fail
      outcome = ok ? choice.outcome.success : choice.outcome.fail
      fx = ok ? choice.fx.success : choice.fx.fail
    }
    const patch = applyEffects(s, eff, fx)
    const card = s.cards[0]
    const learned = card.event?.fact && !s.learned.includes(card.event.fact) ? [...s.learned, card.event.fact] : s.learned
    set({ ...patch, learned, phase: 'outcome', cardResult: { text: outcome, effects: eff, fx, t: Date.now() } })
  },

  nextCard: () => {
    const s = get()
    const rest = s.cards.slice(1)
    let learned = s.learned
    const card = s.cards[0]
    if (card?.type === 'storm' && !learned.includes('storm')) learned = [...learned, 'storm']
    set({ cards: rest, cardResult: null, learned, phase: phaseFor(rest[0]) })
  },

  setAlloc: (sys, val) => {
    const s = get()
    const v = typeof val === 'boolean' ? val : clamp(val, 0, BASE.maxChipsPerSystem)
    const next = { ...s.alloc, [sys]: v }
    if (chipsUsed(next) > chipsAvailable(s)) return
    set({ alloc: next })
  },

  endSol: () => {
    const s = get()
    const p = project(s)
    let o2 = clamp(s.o2 + p.dO2, -50, 100)
    let food = clamp(s.food + p.dFood, -50, 100)
    let health = s.health
    const notes = []
    const base = { ...s.base }
    let panels = s.panels
    if (s.alloc.fixLeak && base.leak) { base.leak = false; base.patches += 1; notes.push('🩹 ¡Fuga reparada!') }
    if (s.alloc.fixPanel && base.brokenPanels > 0) { base.brokenPanels -= 1; panels += 1; notes.push('🔧 ¡Panel reparado!') }
    if (p.leakLoss) notes.push(`💨 La fuga se llevó ${p.leakLoss} de oxígeno.`)
    if (p.mine) notes.push(`⛏️🧊 La mina de hielo dio +${p.mine} de oxígeno.`)
    if (o2 <= 0) { health -= 30; notes.push('¡Sin oxígeno! (−30 ❤️)'); o2 = 0 }
    if (food <= 0) { health -= 15; notes.push('¡Sin comida! (−15 ❤️)'); food = 0 }
    if (p.stormDose > 0) {
      const dmg = Math.round(p.stormDose * 4)
      health -= dmg
      notes.push(`☢️ +${p.stormDose.toFixed(1)} mSv de la tormenta (−${dmg} ❤️).`)
    }
    const dose = s.dose + p.dose
    if (dose > BASE.doseLimit) { health -= 10; notes.push('☢️ Límite de radiación superado (−10 ❤️).') }
    health = clamp(health, 0, 100)
    const science = s.science + p.dSci
    const dust = s.dust.sols > 0 ? { ...s.dust, sols: s.dust.sols - 1 } : s.dust
    const report = { ...p, notes, o2Before: s.o2, foodBefore: s.food, healthBefore: s.health }
    const log = [...s.log, { sol: s.sol, storm: p.storm, alloc: s.alloc, dose: p.dose, health }]
    set({ o2, food, health, dose, science, battery: p.saved, dust, base, panels, report, log, phase: 'report' })
  },

  nextSol: () => {
    const s = get()
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
      chipsPenalty: s.today.chipsPenalty + (e.chipsPenalty || 0),
      blockScience: s.today.blockScience || !!e.blockScience,
    }
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
