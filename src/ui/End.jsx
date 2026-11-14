import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { BASE, SOLS } from '../game/content'
import { fade } from './common'

const LOSE = {
  oxygen: { t: 'Se acabó el oxígeno', d: 'Sin suficiente energía en Soporte vital, el aire se terminó. En una base real, el oxígeno es la prioridad número uno.' },
  food: { t: 'Se acabó la comida', d: 'El invernadero necesita semillas y energía. Las raciones del cohete solas no alcanzan para una misión larga.' },
  radiation: { t: 'Demasiada radiación', d: 'Las tormentas solares dañaron a la tripulación. Marte casi no tiene atmósfera ni campo magnético que proteja.' },
  health: { t: 'La tripulación necesita volver', d: 'Muchos problemas juntos agotaron al equipo. Probá otra estrategia: ¡así aprenden los ingenieros de la NASA!' },
}

export default function End({ onData }) {
  const s = useGame()
  const win = s.outcome === 'win'
  const stars = win ? 1 + (s.science >= BASE.scienceGoal ? 1 : 0) + (s.dose <= BASE.doseLimit * 0.6 ? 1 : 0) : 0
  const storms = s.log.filter((l) => l.storm?.level > 0).length
  const facts = s.learned.filter((f) => f !== 'storm')
  return (
    <motion.div className="screen center" {...fade}>
      <div className="panel end">
        <div className="kicker">{win ? 'Misión cumplida' : `Misión terminada en el sol ${s.sol}`}</div>
        <h2>{win ? `🏆 ¡${s.player.name}, sobreviviste los 12 soles!` : '🚨 ' + LOSE[s.loseReason]?.t}</h2>
        {win ? (
          <div className="stars">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0, transition: { delay: 0.3 + i * 0.25, type: 'spring' } }} className={i < stars ? 'on' : ''}>★</motion.span>
            ))}
          </div>
        ) : (
          <p>{LOSE[s.loseReason]?.d}</p>
        )}
        <div className="end-stats">
          <div><b>{Math.min(s.sol, SOLS)}</b><span>soles en Marte</span></div>
          <div><b>{storms}</b><span>tormentas solares reales</span></div>
          <div><b>{s.dose.toFixed(1)}</b><span>mSv de radiación</span></div>
          <div><b>{s.science}</b><span>puntos de ciencia</span></div>
        </div>
        {win && <p className="muted small">★ Sobrevivir · ★ Llegar a {BASE.scienceGoal} de ciencia · ★ Recibir menos de {BASE.doseLimit * 0.6} mSv</p>}

        <div className="learned">
          <h3>🧠 Lo que aprendiste</h3>
          <ul>
            <li>Cada decisión tiene un costo: la energía que usás para una cosa no la podés usar para otra.</li>
            {storms > 0 && <li>Las tormentas solares son reales y el Sol las lanza seguido. Los científicos las vigilan con satélites para avisar a tiempo.</li>}
            <li>En la superficie de Marte un astronauta recibe ~0,64 mSv por día de radiación (medido por el rover Curiosity).</li>
            {facts.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>

        <div className="row">
          <button className="btn ghost" onClick={onData}>🔎 Datos usados</button>
          <button className="btn primary" onClick={s.goModes}>🔁 Jugar otra vez</button>
        </div>
      </div>
    </motion.div>
  )
}
