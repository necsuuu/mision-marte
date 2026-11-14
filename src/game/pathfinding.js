// Grilla de caminos de la nave + búsqueda A*: el astronauta rodea los muebles en vez de atravesarlos.
import { OBSTACLES, BOUNDS } from './shipLayout'

const CELL = 0.4
const RADIUS = 0.45 // "ancho" del astronauta
const NX = Math.ceil((BOUNDS.x1 - BOUNDS.x0) / CELL) + 1
const NZ = Math.ceil((BOUNDS.z1 - BOUNDS.z0) / CELL) + 1
const grid = new Uint8Array(NX * NZ) // 1 = bloqueado

for (let iz = 0; iz < NZ; iz++) {
  for (let ix = 0; ix < NX; ix++) {
    const x = BOUNDS.x0 + ix * CELL, z = BOUNDS.z0 + iz * CELL
    const blocked = OBSTACLES.some(([x0, z0, x1, z1]) => x > x0 - RADIUS && x < x1 + RADIUS && z > z0 - RADIUS && z < z1 + RADIUS)
    grid[iz * NX + ix] = blocked ? 1 : 0
  }
}

const toCell = (x, z) => [Math.round((x - BOUNDS.x0) / CELL), Math.round((z - BOUNDS.z0) / CELL)]
const toWorld = (ix, iz) => [BOUNDS.x0 + ix * CELL, BOUNDS.z0 + iz * CELL]
const inside = (ix, iz) => ix >= 0 && iz >= 0 && ix < NX && iz < NZ
const free = (ix, iz) => inside(ix, iz) && grid[iz * NX + ix] === 0

export function walkable(x, z) {
  if (x < BOUNDS.x0 || x > BOUNDS.x1 || z < BOUNDS.z0 || z > BOUNDS.z1) return false
  const [ix, iz] = toCell(x, z)
  return free(ix, iz)
}

/** Celda libre más cercana (por si se hace click sobre un mueble). */
export function nearestWalkable(x, z) {
  const [sx, sz] = toCell(Math.min(Math.max(x, BOUNDS.x0), BOUNDS.x1), Math.min(Math.max(z, BOUNDS.z0), BOUNDS.z1))
  if (free(sx, sz)) return toWorld(sx, sz)
  for (let r = 1; r < 40; r++) {
    let best = null, bd = Infinity
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue
      if (free(sx + dx, sz + dz)) { const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = [sx + dx, sz + dz] } }
    }
    if (best) return toWorld(...best)
  }
  return [x, z]
}

// ¿Se puede ir en línea recta? (para suavizar el camino)
function lineFree(a, b) {
  const steps = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (CELL * 0.5))
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    if (!walkable(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)) return false
  }
  return true
}

/** Camino de [x,z] a [x,z]. Devuelve lista de puntos (sin el inicial). */
export function findPath(from, to) {
  const goal = nearestWalkable(to[0], to[1])
  const start = walkable(from[0], from[1]) ? from : nearestWalkable(from[0], from[1])
  if (lineFree(start, goal)) return [goal]
  const [sx, sz] = toCell(start[0], start[1])
  const [gx, gz] = toCell(goal[0], goal[1])
  const N = NX * NZ
  const g = new Float32Array(N).fill(Infinity)
  const came = new Int32Array(N).fill(-1)
  const closed = new Uint8Array(N)
  const open = [] // heap simple (lista ordenada por f)
  const h = (ix, iz) => { const dx = Math.abs(ix - gx), dz = Math.abs(iz - gz); return Math.max(dx, dz) + 0.414 * Math.min(dx, dz) }
  const si = sz * NX + sx
  g[si] = 0
  open.push([h(sx, sz), si])
  const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]]
  let found = false
  while (open.length) {
    let bi = 0
    for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i
    const [, cur] = open.splice(bi, 1)[0]
    if (closed[cur]) continue
    closed[cur] = 1
    const cx = cur % NX, cz = (cur - cx) / NX
    if (cx === gx && cz === gz) { found = true; break }
    for (const [dx, dz, cost] of DIRS) {
      const nx = cx + dx, nz = cz + dz
      if (!free(nx, nz)) continue
      if (dx && dz && (!free(cx + dx, cz) || !free(cx, cz + dz))) continue // no cortar esquinas
      const ni = nz * NX + nx
      const ng = g[cur] + cost
      if (ng < g[ni]) { g[ni] = ng; came[ni] = cur; open.push([ng + h(nx, nz), ni]) }
    }
  }
  if (!found) return [goal]
  const cells = []
  for (let c = gz * NX + gx; c !== -1 && c !== si; c = came[c]) cells.push(toWorld(c % NX, Math.floor(c / NX)))
  cells.reverse()
  cells[cells.length - 1] = goal
  // suavizar: saltar puntos que se ven en línea recta
  const out = []
  let anchor = start
  for (let i = 0; i < cells.length; i++) {
    const next = cells[i + 1]
    if (!next || !lineFree(anchor, next)) { out.push(cells[i]); anchor = cells[i] }
  }
  return out
}
