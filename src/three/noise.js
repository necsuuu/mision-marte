// Ruido simple (value noise + fbm) para generar terreno y texturas sin imágenes externas.
function hash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}
const smooth = (t) => t * t * (3 - 2 * t)

export function noise2(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y)
  const xf = x - xi, yf = y - yi
  const a = hash(xi, yi), b = hash(xi + 1, yi)
  const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1)
  const u = smooth(xf), v = smooth(yf)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}

export function fbm(x, y, oct = 5) {
  let v = 0, amp = 0.5, f = 1
  for (let i = 0; i < oct; i++) {
    v += amp * noise2(x * f, y * f)
    f *= 2.03
    amp *= 0.5
  }
  return v
}

// Generador pseudoaleatorio con semilla, para que las rocas queden siempre en el mismo lugar
export function rng(seed = 1) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}
