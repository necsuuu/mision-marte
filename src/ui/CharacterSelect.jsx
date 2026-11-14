import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { CHARACTERS } from '../game/characters'
import { fade } from './common'

const AGES = [6, 7, 8, 9, 10, 11, 12, 13]

export default function CharacterSelect() {
  const { player, setPlayer, goModes, goTitle } = useGame()
  const ready = player.character && player.name.trim().length > 0 && player.age
  const chosen = CHARACTERS.find((c) => c.id === player.character)

  return (
    <motion.div className="screen center char-screen" {...fade}>
      <h2 className="char-title">👩‍🚀 ¿Quién sos?</h2>

      <div className="char-row">
        {CHARACTERS.map((c, i) => {
          const on = player.character === c.id
          return (
            <motion.button
              key={c.id}
              className={'char-card' + (on ? ' on' : '')}
              style={on ? { '--glow': c.color } : null}
              onClick={() => setPlayer({ character: c.id })}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }}
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.97 }}
              aria-label={`Personaje ${i + 1}`}
            >
              <img src={c.select} alt="" draggable={false} />
              {on && <motion.span className="check" initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.span>}
            </motion.button>
          )
        })}
      </div>

      <div className="panel char-form">
        <label className="field">
          <span>✏️</span>
          <input
            value={player.name}
            onChange={(e) => setPlayer({ name: e.target.value.slice(0, 16) })}
            placeholder="Tu nombre"
            maxLength={16}
            autoComplete="off"
          />
        </label>
        <div className="ages">
          <span className="ages-label">🎂</span>
          {AGES.map((a) => (
            <button key={a} className={'age' + (player.age === a ? ' on' : '')} onClick={() => setPlayer({ age: a })}>
              {a === 13 ? '13+' : a}
            </button>
          ))}
        </div>
        <div className="row">
          <button className="btn ghost" onClick={goTitle}>←</button>
          <motion.button className="btn primary" disabled={!ready} onClick={goModes} whileTap={{ scale: 0.95 }}>
            {ready ? `¡Vamos, ${player.name.trim()}! 🚀` : chosen ? '✏️ + 🎂' : '👆 Elegí'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
