import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { getCharacter } from '../game/characters'
import { fade } from './common'

const MODES = [
  { id: 'recent', emoji: '🛰️', title: 'Misión real', sub: 'Tormentas solares de los últimos 60 días' },
  { id: 'may2024', emoji: '☢️', title: 'Tormenta 2024', sub: 'La más fuerte que llegó a Marte', hard: true },
  { id: 'random', emoji: '🎲', title: 'Sorpresa', sub: 'Cada partida es distinta' },
]

export default function ModeSelect() {
  const { player, startLoading, goCharacter } = useGame()
  const ch = getCharacter(player.character)
  return (
    <motion.div className="screen center" {...fade}>
      <div className="mode-head">
        <img className="avatar-lg" src={ch.select} alt="" />
        <div>
          <div className="kicker">{ch.title}</div>
          <h2>{player.name} · elegí tu misión</h2>
        </div>
      </div>
      <div className="mode-tiles">
        {MODES.map((m, i) => (
          <motion.button
            key={m.id}
            className={'mode-tile' + (m.hard ? ' hard' : '')}
            onClick={() => startLoading(m.id)}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + i * 0.08 } }}
            whileHover={{ y: -8, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
          >
            <span className="tile-emoji">{m.emoji}</span>
            <b>{m.title}</b>
            <small>{m.sub}</small>
            {m.hard && <em className="badge">🔥 Difícil</em>}
          </motion.button>
        ))}
      </div>
      <button className="link-btn" onClick={goCharacter}>← Cambiar personaje</button>
    </motion.div>
  )
}
