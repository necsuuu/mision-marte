// Terminal CRT "EXPEDICIÓN A MARTE" para elegir opciones (estilo 60 Seconds).
// Pantalla: la situación y las opciones. Papel: el "ticket" con el costo de la opción elegida. Botón ✓: confirmar.
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import terminalImg from '../assets/ui/terminal.webp'
import { useT } from '../i18n/useT'

// Zonas medidas sobre la imagen (en % del ancho/alto)
const SCREEN = { left: '4.25%', top: '11.69%', width: '58.13%', height: '79.61%' }
const PAPER = { left: '68.32%', top: '12.91%', width: '27.17%', height: '63.89%' }
const OK = { left: '79.56%', top: '78.11%', width: '5.09%', height: '7.3%' }

export default function Terminal({ header, title, text, extra, options, onConfirm }) {
  const T = useT()
  const [sel, setSel] = useState(null)
  const [typed, setTyped] = useState(0)
  // efecto de escritura del título
  useEffect(() => {
    if (typed >= title.length) return
    const tm = setTimeout(() => setTyped((n) => n + 1), 28)
    return () => clearTimeout(tm)
  }, [typed, title])
  // teclado: flechas / números / Enter
  useEffect(() => {
    const onKey = (e) => {
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= options.length) setSel(n - 1)
      if (e.key === 'ArrowDown') setSel((s) => (s === null ? 0 : Math.min(options.length - 1, s + 1)))
      if (e.key === 'ArrowUp') setSel((s) => (s === null ? 0 : Math.max(0, s - 1)))
      if (e.key === 'Enter' && sel !== null) onConfirm(options[sel].value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [options, sel, onConfirm])

  const chosen = sel !== null ? options[sel] : null
  return (
    <div className="terminal-wrap">
      <img className="terminal-img" src={terminalImg} alt="" draggable={false} />
      <div className="crt" style={SCREEN}>
        <div className="crt-inner">
          <div className="crt-header"><span className="blink">■</span> {header}</div>
          <div className="crt-title">{title.slice(0, typed)}<span className="cursor">█</span></div>
          <p className="crt-text">{text}</p>
          {extra}
          <div className="crt-options">
            {options.map((o, i) => (
              <button key={i} className={'crt-opt' + (sel === i ? ' on' : '')} onClick={() => setSel(i)} onDoubleClick={() => onConfirm(o.value)}>
                <span className="crt-num">{sel === i ? '▶' : i + 1}</span>
                <span>{o.label}</span>
              </button>
            ))}
          </div>
          <div className="crt-foot">{T('term.keys')}</div>
        </div>
        <div className="scanlines" />
      </div>

      <div className="paper" style={PAPER}>
        <AnimatePresence mode="wait">
          {chosen ? (
            <motion.div key={sel} className="paper-print" initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
              <div className="ticket-head">*** {T('term.option', { n: sel + 1 })} ***</div>
              <div className="ticket-label">{chosen.label}</div>
              <div className="ticket-sep">- - - - - - - - - -</div>
              <div className="ticket-cost">{T('term.cost')}:</div>
              <div className="ticket-hint">{chosen.hint}</div>
            </motion.div>
          ) : (
            <motion.div key="empty" className="paper-wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{T('term.pick')}</motion.div>
          )}
        </AnimatePresence>
      </div>

      <button className={'term-ok' + (chosen ? ' ready' : '')} style={OK} disabled={!chosen} onClick={() => chosen && onConfirm(chosen.value)} aria-label={T('term.confirm')} />
      {chosen && (
        <motion.div className="ok-hint" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          ⬆ {T('term.confirm')}
        </motion.div>
      )}
    </div>
  )
}
