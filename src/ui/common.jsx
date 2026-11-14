import { useState } from 'react'
import { motion } from 'framer-motion'
import { GLOSSARY } from '../game/content'

export const fade = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
}

/** Palabra con explicación: tocás y aparece qué significa. */
export function Term({ k, children }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="term" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={() => setOpen((o) => !o)}>
      {children}
      {open && <span className="term-pop">{GLOSSARY[k]}</span>}
    </span>
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
