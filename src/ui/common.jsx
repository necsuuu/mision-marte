import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { t, locGlossary } from '../i18n/core'
import { useT } from '../i18n/useT'
import { voiceSupported, stopSpeaking } from '../game/voice'
import { soundSupported } from '../game/sfx'
import { isTouch, isStandalone, canFullscreen, fullscreenOn, enterFullscreen, exitFullscreen } from '../game/device'

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

/** En celulares parados: pide girar el teléfono (el juego está pensado acostado). Se muestra solo por CSS. */
export function RotateHint() {
  const T = useT()
  // si el celular está parado, se pausa el juego (así no corre el reloj); al girarlo aparece el menú de pausa
  useEffect(() => {
    const mql = matchMedia('(orientation: portrait) and (max-width: 760px)')
    const check = () => { if (mql.matches) useGame.getState().setPaused(true) }
    check()
    mql.addEventListener('change', check)
    return () => mql.removeEventListener('change', check)
  }, [])
  return (
    <div className="rotate-hint" aria-live="polite">
      <div className="rotate-phone">📱</div>
      <b>{T('rotate')}</b>
      <small>{T('rotateSub')}</small>
    </div>
  )
}

/** Ícono de pantalla completa dibujado (el símbolo ⛶ no existe en todas las tipografías de celular). */
export function FullIcon({ on }) {
  const d = on ? 'M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5' : 'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5'
  return <svg className="full-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={d} /></svg>
}

/** Aviso para aparatos que no dejan poner la página en pantalla completa (iPhone): cómo abrir el juego como app. */
function BigScreenHelp({ onClose }) {
  const T = useT()
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return (
    <div className="pause-overlay full-help" onClick={onClose}>
      <div className="pause-card full-card" onClick={(e) => e.stopPropagation()}>
        <h2><FullIcon /> {T('full.title')}</h2>
        {ios ? (
          <ol className="full-steps">
            <li><Tx k="full.ios1" /></li>
            <li><Tx k="full.ios2" /></li>
            <li><Tx k="full.ios3" /></li>
          </ol>
        ) : <p>{T('full.other')}</p>}
        <button className="btn primary" onClick={onClose}>{T('full.ok')}</button>
      </div>
    </div>
  )
}

/**
 * ⛶ Pantalla grande, para celulares y tablets (gana el espacio que ocupan las barras del navegador).
 * Donde el navegador lo permite, pone la página en pantalla completa; en iPhone explica cómo abrirla como app.
 * Si el juego ya está abierto como app no hace falta y no se muestra.
 */
export function useBigScreen() {
  const [full, setFull] = useState(fullscreenOn)
  const [help, setHelp] = useState(false)
  useEffect(() => {
    const on = () => setFull(fullscreenOn())
    document.addEventListener('fullscreenchange', on)
    document.addEventListener('webkitfullscreenchange', on)
    return () => { document.removeEventListener('fullscreenchange', on); document.removeEventListener('webkitfullscreenchange', on) }
  }, [])
  const available = isTouch && !isStandalone
  const toggle = () => {
    if (!canFullscreen) setHelp(true)
    else if (fullscreenOn()) exitFullscreen()
    else enterFullscreen()
  }
  const dialog = help ? <BigScreenHelp onClose={() => setHelp(false)} /> : null
  return { available, full, toggle, dialog }
}

/** Botones fijos: ⛶ pantalla grande, ⏸️ pausa, 🔊 leer en voz alta y ✨/🐢 gráficos livianos. */
export function Toolbar() {
  const T = useT()
  const voiceOn = useGame((s) => s.voice ?? s.easy)
  const lite = useGame((s) => s.lite)
  const sound = useGame((s) => s.sound)
  const canPause = useGame((s) => ['launch', 'tutorial', 'loading', 'landing', 'sol'].includes(s.screen))
  const { toggleVoice, toggleLite, toggleSound, setPaused } = useGame.getState()
  const big = useBigScreen()
  const count = (canPause ? 1 : 0) + (voiceSupported() ? 1 : 0) + (soundSupported ? 1 : 0) + 1 + (big.available ? 1 : 0)
  useEffect(() => { document.documentElement.style.setProperty('--tools', count) }, [count])
  return (
    <>
      <div className="toolbar">
        {big.available && <button className={big.full ? 'on' : ''} onClick={big.toggle} title={T('tool.full')} aria-label={T('tool.full')}><FullIcon on={big.full} /></button>}
        {canPause && <button onClick={() => setPaused(true)} title={T('pause.title') + ' (Esc)'} aria-label={T('pause.title')}>⏸️</button>}
        {voiceSupported() && (
          <button className={voiceOn ? 'on' : 'off'} onClick={() => { if (voiceOn) stopSpeaking(); toggleVoice() }} title={T('tool.voice')} aria-label={T('tool.voice')} aria-pressed={voiceOn}>
            🗣️
          </button>
        )}
        {soundSupported && (
          <button className={sound ? 'on' : 'off'} onClick={toggleSound} title={T('tool.sound')} aria-label={T('tool.sound')} aria-pressed={sound}>
            {sound ? '🔊' : '🔇'}
          </button>
        )}
        <button className={lite ? 'on' : ''} onClick={toggleLite} title={T('tool.lite')} aria-label={T('tool.lite')}>
          {lite ? '🐢' : '✨'}
        </button>
      </div>
      {big.dialog}
    </>
  )
}

/**
 * Zona con scroll que avisa con una flechita ▼ cuando queda texto más abajo
 * (en pantallas chicas no siempre entra todo y no se nota que se puede deslizar).
 */
export function ScrollArea({ className, children }) {
  const ref = useRef(null)
  const [more, setMore] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setMore(el.scrollHeight - el.scrollTop - el.clientHeight > 8)
    check()
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    const mo = new MutationObserver(check)
    mo.observe(el, { childList: true, subtree: true, characterData: true })
    return () => { el.removeEventListener('scroll', check); ro.disconnect(); mo.disconnect() }
  }, [])
  return (
    <>
      <div ref={ref} className={className}>{children}</div>
      {more && <button className="scroll-cue" aria-hidden tabIndex={-1} onClick={() => ref.current?.scrollBy({ top: ref.current.clientHeight * 0.7, behavior: 'smooth' })}>▼</button>}
    </>
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
