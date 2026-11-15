// Precarga en segundo plano: después de que aparece el título, se van bajando las imágenes del resto del juego
// (computadora, consola, personajes). Así cuando hacen falta ya están y nada "aparece tarde".
const urls = Object.values(import.meta.glob(['./assets/ui/*.webp', './assets/scenes/*.webp', './assets/characters/select_*.webp', './assets/characters/portrait_*.webp', './assets/characters/walk/*.webp', './assets/title/char_bg.webp'], { eager: true, import: 'default' }))

export function preloadAssets() {
  const run = () => {
    if (urls.every((u) => u.startsWith('data:'))) return // versión de un solo archivo: ya vienen incluidas
    let i = 0
    const next = () => {
      if (i >= urls.length) return
      const img = new Image()
      img.onload = img.onerror = next
      img.src = urls[i++]
    }
    next(); next(); next() // de a tres por vez, sin tapar la red
  }
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2500 })
  else setTimeout(run, 1200)
}
