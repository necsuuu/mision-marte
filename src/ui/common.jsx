import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { t, locGlossary } from '../i18n/core'
import { useT } from '../i18n/useT'
import { voiceSupported, stopSpeaking } from '../game/voice'

export const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

/** Texto traducido que puede tener <b>, <i>. Las variables se escapan (el nombre lo escribe el jugador). */
export function Tx({ k, vars, as: Tag = 'span', className }) {
  const lang = useGame((s) => s.lang)
  const safe = vars ? Object.fromEntries(Object.entries(vars).map(([a, b]) => [a, esc(b)])) : undefined
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: t(lang, k, safe) }} />
}

/** Palabra con explicación: tocás y aparece qué significa. */
export function Term({ k, children }) {
  const lang = useGame((s) => s.lang)
  const [open, setOpen] = useState(false)
  return (
    <span className="term" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={() => setOpen((o) => !o)}>
      {children}
      {open && <span className="term-pop">{locGlossary(lang, k)}</span>}
    </span>
  )
}

/** Selector de idioma ES / EN */
export function LangToggle({ className = '' }) {
  const lang = useGame((s) => s.lang)
  const setLang = useGame((s) => s.setLang)
  return (
    <div className={'lang-toggle ' + className} role="group" aria-label="Idioma / Language">
      {[['es', '🇦🇷 ES'], ['en', '🇬🇧 EN']].map(([l, label]) => (
        <button key={l} className={lang === l ? 'on' : ''} onClick={() => setLang(l)}>{label}</button>
      ))}
    </div>
  )
}

/** Botones fijos: 🔊 leer en voz alta y ⚙️ gráficos livianos. */
export function Toolbar() {
  const T = useT()
  const voiceOn = useGame((s) => s.voice ?? s.easy)
  const lite = useGame((s) => s.lite)
  const canPause = useGame((s) => ['quiz', 'launch', 'tutorial', 'loading', 'landing', 'sol'].includes(s.screen))
  const { toggleVoice, toggleLite, setPaused } = useGame.getState()
  return (
    <div className="toolbar">
      {canPause && <button onClick={() => setPaused(true)} title={T('pause.title') + ' (Esc)'} aria-label={T('pause.title')}>⏸️</button>}
      {voiceSupported() && (
        <button className={voiceOn ? 'on' : ''} onClick={() => { if (voiceOn) stopSpeaking(); toggleVoice() }} title={T('tool.voice')} aria-label={T('tool.voice')}>
          {voiceOn ? '🔊' : '🔇'}
        </button>
      )}
      <button className={lite ? 'on' : ''} onClick={toggleLite} title={T('tool.lite')} aria-label={T('tool.lite')}>
        {lite ? '🐢' : '✨'}
      </button>
    </div>
  )
}

export function Bar({ emoji, label, value, max = 100, color, warn = 25, suffix = '' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const low = value <= warn
  return (
    <div className={'bar' + (low ? ' bar-low' : '')} title={label}>
      <div className="bar-head">
        <span className="bar-emoji">{emoji}</span>
        <span className="bar-label">{label}</span>
        <span className="bar-val">{Math.round(value * 10) / 10}{suffix}</span>
      </div>
      <div className="bar-track">
        <motion.div className="bar-fill" style={{ background: color }} animate={{ width: pct + '%' }} transition={{ type: 'spring', stiffness: 120, damping: 20 }} />
      </div>
    </div>
  )
}

export function Delta({ v, unit = '' }) {
  if (!v) return <span className="delta zero">±0{unit}</span>
  const r = Math.round(v * 10) / 10
  return <span className={'delta ' + (v > 0 ? 'pos' : 'neg')}>{v > 0 ? '+' : ''}{r}{unit}</span>
}
