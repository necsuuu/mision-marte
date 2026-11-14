// Terminal CRT "EXPEDICIÓN A MARTE": la computadora de la nave.
// screen = lo que se ve en la pantalla verde · paper = el ticket de la impresora · onOk = botón ✓
import { motion, AnimatePresence } from 'framer-motion'
import terminalImg from '../assets/ui/terminal.webp'

// Zonas medidas sobre la imagen (en % del ancho/alto)
const SCREEN = { left: '4.25%', top: '11.69%', width: '58.13%', height: '79.61%' }
const PAPER = { left: '68.32%', top: '12.91%', width: '27.17%', height: '63.89%' }
const OK = { left: '79.56%', top: '78.11%', width: '5.09%', height: '7.3%' }

export default function TerminalFrame({ screen, paper, paperKey, onOk, okReady = true, okLabel }) {
  return (
    <div className="terminal-wrap">
      <img className="terminal-img" src={terminalImg} alt="" draggable={false} />
      <div className="crt" style={SCREEN}>
        <div className="crt-inner">{screen}</div>
        <div className="scanlines" />
      </div>
      <div className="paper" style={PAPER}>
        <AnimatePresence mode="wait">
          <motion.div key={paperKey} className="paper-print" initial={{ y: '-100%' }} animate={{ y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45, ease: 'easeOut' }}>
            {paper}
          </motion.div>
        </AnimatePresence>
      </div>
      <button className={'term-ok' + (okReady ? ' ready' : '')} style={OK} disabled={!okReady} onClick={() => okReady && onOk()} aria-label={okLabel} />
      {okReady && okLabel && (
        <motion.button className="ok-hint" onClick={onOk} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          ⬆ {okLabel}
        </motion.button>
      )}
    </div>
  )
}
