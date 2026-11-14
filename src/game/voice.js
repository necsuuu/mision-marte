// Lectura en voz alta con la voz del navegador (Web Speech API): no necesita internet ni claves.
// Se activa sola en modo cadete y se puede prender/apagar con el botón 🔊.
import { useEffect } from 'react'
import { useGame } from './store'

const clean = (txt) =>
  String(txt || '')
    .replace(/<[^>]+>/g, ' ') // sin HTML
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}⚡■▶◀→←↑↓·]/gu, ' ') // sin emojis ni símbolos
    .replace(/\s+/g, ' ')
    .trim()

let voices = []
const loadVoices = () => { try { voices = window.speechSynthesis?.getVoices() || [] } catch { voices = [] } }
if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices()
  window.speechSynthesis.onvoiceschanged = loadVoices
}

const pickVoice = (lang) => {
  const pref = lang === 'en' ? ['en-US', 'en-GB', 'en'] : ['es-AR', 'es-419', 'es-MX', 'es-US', 'es-ES', 'es']
  for (const p of pref) {
    const v = voices.find((x) => x.lang?.toLowerCase().startsWith(p.toLowerCase()))
    if (v) return v
  }
  return null
}

export const voiceSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

/** Lee un texto si la voz está prendida. force=true lo lee igual (por ejemplo, al tocar un texto). */
export function speak(text, force = false) {
  const { voice, easy, lang } = useGame.getState()
  if ((!(voice ?? easy) && !force) || !voiceSupported()) return
  const t = clean(text)
  if (!t) return
  try {
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(t)
    u.lang = lang === 'en' ? 'en-US' : 'es-AR'
    const v = pickVoice(lang)
    if (v) u.voice = v
    u.rate = 0.95
    window.speechSynthesis.speak(u)
  } catch {
    /* sin voz disponible: no pasa nada */
  }
}

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel() } catch { /* nada */ }
}

/** Lee el texto cada vez que cambia (si la voz está prendida). */
export const useVoiceOn = () => useGame((s) => s.voice ?? s.easy)

export function useSpeak(text) {
  const voice = useVoiceOn()
  useEffect(() => {
    if (voice && text) speak(text)
  }, [text, voice])
}
