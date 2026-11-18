// Qué tipo de aparato es: sirve para hablar de "tocar" en vez de "clic / teclas" y para la pantalla completa.
const mm = (q) => typeof matchMedia !== 'undefined' && matchMedia(q).matches

/** Pantalla táctil sin mouse (celular o tablet). */
export const isTouch = mm('(hover: none) and (pointer: coarse)')

/** Ya está abierto como app (desde el ícono de la pantalla de inicio): no hay barra del navegador. */
export const isStandalone = mm('(display-mode: standalone)') || mm('(display-mode: fullscreen)') || (typeof navigator !== 'undefined' && navigator.standalone === true)

const root = typeof document !== 'undefined' ? document.documentElement : null
if (root && isTouch) root.classList.add('touch')

// Pantalla completa: el iPhone no la permite para páginas (solo el iPad y Android), así que hay que detectarla
const req = root && (root.requestFullscreen || root.webkitRequestFullscreen)
export const canFullscreen = !!(root && req && (document.fullscreenEnabled || document.webkitFullscreenEnabled))
export const fullscreenOn = () => !!(document.fullscreenElement || document.webkitFullscreenElement)

export async function enterFullscreen() {
  if (!canFullscreen || fullscreenOn()) return
  try {
    await req.call(root)
    await screen.orientation?.lock?.('landscape').catch(() => {})
  } catch { /* el navegador no lo permite */ }
}
export async function exitFullscreen() {
  try { await (document.exitFullscreen || document.webkitExitFullscreen).call(document) } catch { /* nada */ }
}

/**
 * Escalón de calidad gráfica con el que se arranca (ver three/Quality.jsx): el que se aprendió la vez anterior,
 * o, la primera vez, uno más abajo en celulares y en compus con pocos núcleos o poca memoria.
 */
export function startGfxTier() {
  try {
    const saved = localStorage.getItem('mm-tier')
    if (saved !== null && !Number.isNaN(+saved)) return Math.max(0, Math.min(2, +saved))
  } catch { /* sin almacenamiento */ }
  const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 8
  const mem = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 8
  return isTouch || cores <= 4 || mem <= 4 ? 1 : 0
}
