import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { fmtDate } from '../data/donki'
import { earthMarsDistance } from '../data/marsDistance'

export default function DataPanel({ onClose }) {
  const w = useGame((s) => s.weather)
  const d = earthMarsDistance(new Date())
  return (
    <motion.div className="modal-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="panel modal" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Cerrar">✕</button>
        <div className="kicker">Ciencia de verdad</div>
        <h2>🔎 Datos reales que usa este juego</h2>

        {w && (
          <div className={'status ' + w.source}>
            {w.source === 'live' && <>🟢 <b>En vivo:</b> tormentas solares consultadas hoy a la API de la NASA ({fmtDate(w.start)} → {fmtDate(w.end)}).</>}
            {w.source === 'snapshot' && <>🟡 <b>Datos guardados:</b> no hubo conexión con la API, así que usamos datos reales descargados el {fmtDate(w.savedAt)} ({fmtDate(w.start)} → {fmtDate(w.end)}).</>}
            {w.source === 'archive' && <>🟣 <b>Archivo histórico:</b> tormentas reales de mayo de 2024, descargadas de DONKI.</>}
            {' '}{w.cmes.length} eyecciones de masa coronal rápidas (≥700 km/s).
          </div>
        )}

        <ul className="sources">
          <li>
            <b>NASA DONKI: Space Weather Database</b>: eyecciones de masa coronal (CME) con su fecha y velocidad, y eventos de partículas energéticas (SEP). Cada tormenta del juego es una tormenta que pasó de verdad.
            <br /><a href="https://api.nasa.gov" target="_blank" rel="noreferrer">api.nasa.gov</a> · <a href="https://kauai.ccmc.gsfc.nasa.gov/DONKI/" target="_blank" rel="noreferrer">DONKI</a>
          </li>
          <li>
            <b>Curiosity / RAD (Radiation Assessment Detector)</b>: dosis base en la superficie de Marte ≈ 0,64 mSv por día (Hassler et al., <i>Science</i>, 2014), y el pico del 20 de mayo de 2024 (≈ 30 radiografías de tórax).
            <br /><a href="https://science.nasa.gov/mission/msl-curiosity/" target="_blank" rel="noreferrer">Misión Curiosity</a>
          </li>
          <li>
            <b>NASA OSDR: Open Science Data Repository</b>: estudios sobre cómo el espacio afecta huesos, músculos y sistema inmune, la base de los eventos de salud.
            <br /><a href="https://osdr.nasa.gov/bio/" target="_blank" rel="noreferrer">osdr.nasa.gov</a>
          </li>
          <li>
            <b>Retraso de comunicación</b>: calculado con las órbitas de la Tierra y Marte para la fecha de hoy: {Math.round(d.km / 1e6)} millones de km ≈ {d.minutes.toFixed(1)} min de ida.
          </li>
          <li>
            <b>Agencia Espacial Canadiense (CSA)</b>: <i>Food production on the Moon and in remote areas</i>, la inspiración para el invernadero.
            <br /><a href="https://www.asc-csa.gc.ca/eng/" target="_blank" rel="noreferrer">asc-csa.gc.ca</a>
          </li>
        </ul>

        <p className="muted small">
          Simplificaciones del juego: imaginamos que cada tormenta solar grande viaja hacia Marte (en la realidad muchas van en otra dirección). Las dosis extra de las tormentas, la energía y los recursos son números del juego, pensados para que las decisiones se sientan como las reales. Este proyecto no es un producto oficial de la NASA.
        </p>
      </motion.div>
    </motion.div>
  )
}
