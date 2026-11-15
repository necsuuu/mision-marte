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
