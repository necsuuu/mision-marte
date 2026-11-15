// 📤 Tarjeta para compartir el resultado: una imagen cuadrada con el logo, las estrellas y los números de la misión.
// Se dibuja en el navegador (canvas); no se sube a ningún lado y NO lleva el nombre del jugador.
import bg from '../assets/title/title_bg.webp'
import logoEs from '../assets/title/logo_es.webp'
import logoEn from '../assets/title/logo_en.webp'
import { getCharacter } from './characters'
import { t } from '../i18n/core'

const SIZE = 1080
const load = (src) => new Promise((ok, fail) => { const im = new Image(); im.onload = () => ok(im); im.onerror = fail; im.src = src })

function roundRect(g, x, y, w, h, r) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}

/** Achica la letra hasta que el texto entre en el ancho. */
function fitText(g, text, x, y, maxW, px, font) {
  let size = px
  do { g.font = `700 ${size}px ${font}`; size -= 2 } while (g.measureText(text).width > maxW && size > 20)
  g.fillText(text, x, y)
}

/** Devuelve la imagen (PNG) como Blob. */
export async function makeShareCard({ lang, win, stars, sol, storms, dose, science, character }) {
  const ch = getCharacter(character)
  const [imBg, imLogo, imCh] = await Promise.all([load(bg), load(lang === 'en' ? logoEn : logoEs), load(ch.select)])
  try { await Promise.all([document.fonts.load('700 60px Fredoka'), document.fonts.load('700 30px "Space Mono"')]) } catch { /* se usa la letra del sistema */ }
  const FRED = 'Fredoka, system-ui, sans-serif'
  const MONO = '"Space Mono", ui-monospace, monospace'

  const cv = document.createElement('canvas')
  cv.width = cv.height = SIZE
  const g = cv.getContext('2d')

  // fondo: la tripulación en Marte, recortada al centro
  const s = Math.max(SIZE / imBg.width, SIZE / imBg.height)
  g.drawImage(imBg, (SIZE - imBg.width * s) / 2, SIZE - imBg.height * s, imBg.width * s, imBg.height * s)
  let grad = g.createLinearGradient(0, 0, 0, SIZE)
  grad.addColorStop(0, 'rgba(30,6,2,0.55)')
  grad.addColorStop(0.35, 'rgba(30,6,2,0.15)')
  grad.addColorStop(0.55, 'rgba(8,6,12,0.5)')
  grad.addColorStop(0.82, 'rgba(8,6,12,0.72)')
  grad.addColorStop(1, 'rgba(8,6,12,0.94)')
  g.fillStyle = grad
  g.fillRect(0, 0, SIZE, SIZE)

  // logo
  const lw = 720, lh = (imLogo.height / imLogo.width) * lw
  g.drawImage(imLogo, (SIZE - lw) / 2, 36, lw, lh)

  // comandante elegido, abajo a la derecha
  const chH = 430, chW = (imCh.width / imCh.height) * chH
  g.drawImage(imCh, SIZE - chW - 40, SIZE - chH - 96, chW, chH)

  // panel de resultado
  const px = 48, py = 560, pw = 720, ph = 372
  g.fillStyle = 'rgba(14,16,28,0.86)'
  roundRect(g, px, py, pw, ph, 34); g.fill()
  g.lineWidth = 4; g.strokeStyle = win ? 'rgba(255,209,102,0.85)' : 'rgba(255,107,107,0.8)'
  roundRect(g, px, py, pw, ph, 34); g.stroke()

  g.textBaseline = 'alphabetic'
  g.fillStyle = '#fff1df'
  fitText(g, t(lang, win ? 'share.win' : 'share.lose', { n: sol }), px + 34, py + 78, pw - 68, 54, FRED)

  // estrellas
  g.font = `700 86px ${FRED}`
  for (let i = 0; i < 3; i++) {
    g.fillStyle = i < stars ? '#ffd166' : 'rgba(255,255,255,0.16)'
    if (i < stars) { g.shadowColor = 'rgba(255,209,102,0.7)'; g.shadowBlur = 24 } else g.shadowBlur = 0
    g.fillText('★', px + 34 + i * 96, py + 178)
  }
  g.shadowBlur = 0

  // tres números
  const stats = [[String(storms), t(lang, 'share.storms')], [dose.toFixed(1), t(lang, 'share.dose')], [String(science), t(lang, 'share.science')]]
  const bw = (pw - 68 - 2 * 16) / 3
  stats.forEach(([n, label], i) => {
    const bx = px + 34 + i * (bw + 16), by = py + 212
    g.fillStyle = 'rgba(255,255,255,0.07)'
    roundRect(g, bx, by, bw, 126, 18); g.fill()
    g.textAlign = 'center'
    g.fillStyle = '#ffd166'
    g.font = `700 56px ${FRED}`
    g.fillText(n, bx + bw / 2, by + 62)
    g.fillStyle = '#d8cfc2'
    const words = label.split(' ')
    const mid = Math.ceil(words.length / 2)
    g.font = `700 21px ${MONO}`
    g.fillText(words.slice(0, mid).join(' '), bx + bw / 2, by + 90)
    g.fillText(words.slice(mid).join(' '), bx + bw / 2, by + 114)
    g.textAlign = 'left'
  })

  // pie: desafío + dónde jugar
  g.fillStyle = '#ffd166'
  fitText(g, t(lang, 'share.dare'), px, SIZE - 84, SIZE - 2 * px - chW, 44, FRED)
  g.fillStyle = '#f4ede4'
  g.font = `700 28px ${MONO}`
  g.fillText((location.host + location.pathname).replace(/\/$/, ''), px, SIZE - 38)

  return new Promise((ok) => cv.toBlob(ok, 'image/png'))
}

/** Comparte la imagen con el menú del celular; si el navegador no puede, la descarga. Devuelve 'shared' | 'saved' | 'cancel'. */
export async function shareCard(blob, text) {
  const file = new File([blob], 'sobreviviendo-en-marte.png', { type: 'image/png' })
  const url = location.origin + location.pathname
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: `${text} ${url}` })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancel'
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 4000)
  return 'saved'
}
