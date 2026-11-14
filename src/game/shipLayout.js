// Plano de la nave: 3 sectores, muebles, lugares posibles para los objetos y obstáculos.
// Coordenadas: x = izquierda/derecha (−34..34), z = fondo/frente (−7 = pared del fondo).

export const SECTORS = [
  { id: 'medical', x0: -34, x1: -11.5, emoji: '🏥', color: '#7fd8ff' },
  { id: 'cabin', x0: -11.5, x1: 11.5, emoji: '🛰️', color: '#ffd166' },
  { id: 'engineering', x0: 11.5, x1: 34, emoji: '🔧', color: '#ff9f5a' },
]
export const sectorAt = (x) => SECTORS.find((s) => x >= s.x0 && x < s.x1) || SECTORS[1]

// kind: shelf/console/bench/rack = abiertos · wallcab/locker/glasscase/drawers/crate/fridge = hay que abrirlos
export const FURN = {
  // --- Cabina principal ---
  pantry: { pos: [-8, 0, -6.3], front: [-8, 0, -4.5], kind: 'shelf', icon: '🗄️' },
  console: { pos: [0.5, 0, -0.2], front: [0.5, 0, 1.6], kind: 'console', icon: '🖥️' },
  cabLocker: { pos: [2.4, 0, -6.35], front: [2.4, 0, -4.5], kind: 'locker', icon: '🔒' },
  // --- Módulo médico ---
  medcab: { pos: [-15.5, 0, -6.75], front: [-15.5, 0, -4.5], kind: 'wallcab', icon: '➕' },
  medLocker: { pos: [-19.5, 0, -6.35], front: [-19.5, 0, -4.5], kind: 'locker', color: '#e9eef2', icon: '🔒' },
  fridge: { pos: [-29.5, 0, -6.35], front: [-29.5, 0, -4.5], kind: 'locker', color: '#cfe8f5', icon: '❄️' },
  medBench: { pos: [-19.5, 0, 3.6], front: [-19.5, 0, 1.8], kind: 'bench', icon: '🛠️' },
  supplyCrate: { pos: [-30.5, 0, 3], front: [-28.6, 0, 3], kind: 'crate', color: '#8a6a3f', icon: '📦' },
  // --- Módulo de ingeniería ---
  glasscase: { pos: [15.5, 0, -6.45], front: [15.5, 0, -4.5], kind: 'glasscase', icon: '🧪' },
  drawers: { pos: [20.5, 0, -6.15], front: [20.5, 0, -4.2], kind: 'drawers', icon: '🗃️' },
  engLocker: { pos: [25, 0, -6.35], front: [25, 0, -4.5], kind: 'locker', color: '#8a7f63', icon: '🔒' },
  workbench: { pos: [26.5, 0, 3.8], front: [26.5, 0, 2], kind: 'bench', icon: '🛠️' },
  engCrate: { pos: [16.5, 0, 3.6], front: [16.5, 0, 1.8], kind: 'crate', color: '#4f7d3b', icon: '📦' },
  tankRack: { pos: [31.5, 0, 3.2], front: [31.5, 0, 1.6], kind: 'rack', icon: '🧱' },
}
export const CLOSED_KINDS = new Set(['wallcab', 'locker', 'glasscase', 'drawers', 'crate'])

// Lugares donde puede aparecer un objeto. En cada partida se reparten al azar.
export const SLOTS = [
  { id: 'pantry-a', furn: 'pantry', at: [-8.6, 1.22, -6.2], s: 0.8 },
  { id: 'pantry-b', furn: 'pantry', at: [-7.4, 2.12, -6.2], s: 0.8 },
  { id: 'console', furn: 'console', at: [1.7, 1.02, -0.2], s: 0.8 },
  { id: 'cabLocker', furn: 'cabLocker', at: [2.4, 0.25, -6.25], s: 0.9 },
  { id: 'medcab', furn: 'medcab', at: [-15.5, 1.55, -6.45], s: 0.6 },
  { id: 'medLocker', furn: 'medLocker', at: [-19.5, 0.25, -6.25], s: 0.9 },
  { id: 'fridge', furn: 'fridge', at: [-29.5, 0.25, -6.25], s: 0.9 },
  { id: 'medBench', furn: 'medBench', at: [-19.5, 1.02, 3.6], s: 0.85 },
  { id: 'supplyCrate', furn: 'supplyCrate', at: [-30.5, 0.55, 3], s: 0.85 },
  { id: 'glasscase', furn: 'glasscase', at: [15.5, 0.75, -6.3], s: 0.9 },
  { id: 'drawers', furn: 'drawers', at: [20.5, 1.18, -5.25], s: 0.6 },
  { id: 'engLocker', furn: 'engLocker', at: [25, 0.25, -6.25], s: 0.9 },
  { id: 'workbench-a', furn: 'workbench', at: [25.8, 1.02, 3.8], s: 0.8 },
  { id: 'workbench-b', furn: 'workbench', at: [27.3, 1.02, 3.8], s: 0.8 },
  { id: 'engCrate', furn: 'engCrate', at: [16.5, 0.55, 3.6], s: 0.85 },
  { id: 'tankRack', furn: 'tankRack', at: [31.5, 0.32, 3.2], s: 0.9 },
]
export const slotById = (id) => SLOTS.find((s) => s.id === id)

/** Reparte los objetos en lugares al azar (cada partida es distinta). */
export function randomLayout(keys) {
  const pool = [...SLOTS].sort(() => Math.random() - 0.5)
  const layout = {}
  keys.forEach((k, i) => (layout[k] = pool[i].id))
  return layout
}

// Puerta a la base (pared del fondo de la cabina)
export const HATCH = { x: 6.5, z: -4.6, r: 1.9 }
export const START = [0, 0, 2.4]

// Obstáculos [x0, z0, x1, z1] (huella en el piso)
export const OBSTACLES = [
  [-9.3, -6.9, -6.7, -5.8], // despensa
  [-1.2, -0.9, 2.2, 0.5], // consola
  [-4.7, 1.9, -3.3, 3.1], // asiento
  [3.9, 2.2, 5.3, 3.4], // asiento
  [1.6, -6.9, 3.2, -5.8], // casillero cabina
  [-20.3, -6.9, -18.7, -5.8], // casillero médico
  [-30.3, -6.9, -28.7, -5.8], // heladera
  [-26.6, -6.9, -21.9, -4.5], // camilla
  [-20.8, 3, -18.2, 4.3], // mesa médica
  [-31.2, 2.3, -29.8, 3.7], // cajón de suministros
  [14.4, -6.9, 16.6, -6], // vitrina
  [19.6, -6.9, 21.4, -5.3], // cajonera
  [24.2, -6.9, 25.8, -5.8], // casillero ingeniería
  [25.2, 3.2, 27.8, 4.5], // mesa de trabajo
  [15.8, 2.9, 17.2, 4.3], // cajón ingeniería
  [30.5, 2.7, 32.5, 3.8], // estante de tanques
  [27.7, -6.9, 30.3, -3.4], // reactor
  [-11.8, -7, -11.2, -1.4], // pared interna (fondo)
  [-11.8, 2.6, -11.2, 7], // pared interna (frente)
  [11.2, -7, 11.8, -1.4],
  [11.2, 2.6, 11.8, 7],
]
export const BOUNDS = { x0: -33.4, x1: 33.4, z0: -5.8, z1: 5.8 }
