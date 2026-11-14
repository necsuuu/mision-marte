import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { fade } from './common'

export default function Title({ onData }) {
  const goCharacter = useGame((s) => s.goCharacter)
  return (
    <motion.div className="screen title-screen" {...fade}>
      <div className="title-col">
        <div className="kicker">Entrenador de Astronautas Junior</div>
        <h1 className="logo">
          Misión <span>Marte</span>
        </h1>
        <p className="lead big-icons">🚀 → 🔴 → 🏠 → ☀️🛡️ → 🏆</p>
        <p className="lead">¿Podés mantener viva tu base en Marte por 12 días?</p>
        <motion.button
          className="btn primary play-btn"
          onClick={goCharacter}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ boxShadow: ['0 8px 24px rgba(226,104,58,.4)', '0 8px 44px rgba(226,104,58,.8)', '0 8px 24px rgba(226,104,58,.4)'] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ▶ JUGAR
        </motion.button>
        <button className="link-btn" onClick={onData}>🔎 Datos reales de la NASA</button>
      </div>
    </motion.div>
  )
}
