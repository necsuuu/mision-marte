import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { CHARACTERS } from '../game/characters'
import { useT } from '../i18n/useT'
import { fade, LangToggle } from './common'
import charBg from '../assets/title/char_bg.webp'

const AGES = [6, 7, 8, 9, 10, 11, 12, 13]

export default function CharacterSelect() {
  const { player, setPlayer, goModes, goTitle } = useGame()
  const T = useT()
  const ready = player.character && player.name.trim().length > 0 && player.age
  const chosen = CHARACTERS.find((c) => c.id === player.character)

  return (
    // fondo: Marte con robots rotos, ya borroneado (tools/armar_fondo_personajes.py)
    <motion.div className="screen center char-screen" style={{ '--char-bg': `url(${charBg})` }} {...fade}>
      <LangToggle className="corner" />
      <h2 className="char-title">{T('char.who')}</h2>

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
              aria-label={`${T('commander')} ${i + 1}`}
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
            placeholder={T('char.name')}
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
            {ready ? T('char.go', { name: player.name.trim() }) : chosen ? T('char.fill') : T('char.pick')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
