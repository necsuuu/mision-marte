// Distancia aproximada Tierra–Marte para una fecha, con órbitas keplerianas simples
// (elementos orbitales medios J2000, sin inclinación). Error típico: unos pocos %.
const DEG = Math.PI / 180
const J2000 = Date.UTC(2000, 0, 1, 12)

const PLANETS = {
  earth: { a: 1.00000261, e: 0.01671123, L0: 100.46457, n: 0.98560912, w: 102.93768 },
  mars: { a: 1.52371034, e: 0.0933941, L0: -4.55343, n: 0.52402068, w: -23.94363 },
}

function position(p, days) {
  const L = p.L0 + p.n * days
  const M = (L - p.w) * DEG
  let E = M
  for (let i = 0; i < 8; i++) E = M + p.e * Math.sin(E)
  const x = p.a * (Math.cos(E) - p.e)
  const y = p.a * Math.sqrt(1 - p.e * p.e) * Math.sin(E)
  const v = Math.atan2(y, x)
  const r = Math.hypot(x, y)
  const lon = v + p.w * DEG
  return [r * Math.cos(lon), r * Math.sin(lon)]
}

/** Devuelve { au, km, minutes } — minutos que tarda la luz (o un mensaje de radio) en un sentido. */
export function earthMarsDistance(date = new Date()) {
  const days = (date.getTime() - J2000) / 864e5
  const [ex, ey] = position(PLANETS.earth, days)
  const [mx, my] = position(PLANETS.mars, days)
  const au = Math.hypot(mx - ex, my - ey)
  const km = au * 149597870.7
  const minutes = (km / 299792.458) / 60
  return { au, km, minutes }
}
