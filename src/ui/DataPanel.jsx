import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { fmtDate } from '../data/donki'
import { earthMarsDistance } from '../data/marsDistance'
import { useT } from '../i18n/useT'
import { Tx, LangToggle } from './common'

export default function DataPanel({ onClose }) {
  const w = useGame((s) => s.weather)
  const lang = useGame((s) => s.lang)
  const T = useT()
  const d = earthMarsDistance(new Date())
  return (
    <motion.div className="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="panel modal" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label={T('close')}>✕</button>
        <LangToggle className="modal-lang" />
        <div className="kicker">{T('data.kicker')}</div>
        <h2>{T('data.title')}</h2>

        {w && (
          <div className={'status ' + w.source}>
            {w.source === 'live' && <Tx k="data.live" vars={{ from: fmtDate(w.start, lang), to: fmtDate(w.end, lang) }} />}
            {w.source === 'snapshot' && <Tx k="data.snapshot" vars={{ saved: fmtDate(w.savedAt, lang), from: fmtDate(w.start, lang), to: fmtDate(w.end, lang) }} />}
            {w.source === 'archive' && <Tx k="data.archive" />}
            {' '}<Tx k="data.count" vars={{ n: w.cmes.length, m: w.cmes.filter((c) => c[2]).length + (w.marsSeps?.length || 0) }} />
          </div>
        )}

        <ul className="sources">
          <li>
            <Tx k="data.donki" />
            <br /><a href="https://api.nasa.gov" target="_blank" rel="noreferrer">api.nasa.gov</a> · <a href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noreferrer">DONKI</a>
          </li>
          <li>
            <Tx k="data.rad" />
            <br /><a href="https://science.nasa.gov/mission/msl-curiosity/" target="_blank" rel="noreferrer">Curiosity</a>
          </li>
          <li>
            <Tx k="data.osdr" />
            <br /><a href="https://osdr.nasa.gov/bio/" target="_blank" rel="noreferrer">osdr.nasa.gov</a>
          </li>
          <li><Tx k="data.delay" vars={{ km: Math.round(d.km / 1e6), min: d.minutes.toFixed(1) }} /></li>
          <li>
            <Tx k="data.csa" />
            <br /><a href="https://www.asc-csa.gc.ca/eng/" target="_blank" rel="noreferrer">asc-csa.gc.ca</a>
          </li>
        </ul>

        <p className="muted small">{T('data.simplify')}</p>
      </motion.div>
    </motion.div>
  )
}
