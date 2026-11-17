import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { getCharacter } from '../game/characters'
import { useT } from '../i18n/useT'
import { fade } from './common'
import charBg from '../assets/title/char_bg.webp' // mismo fondo borroso que la selección de personaje

const MODES = [
  { id: 'recent', emoji: '🛰️' },
  { id: 'may2024', emoji: '☢️', hard: true },
  { id: 'random', emoji: '🎲' },
]

export default function ModeSelect() {
  const { player, startLoading, goCharacter, quickStart } = useGame()
  const T = useT()
  const ch = getCharacter(player.character)
  return (
    <motion.div className="screen center mode-screen" style={{ '--char-bg': `url(${charBg})` }} {...fade}>
      <div className="mode-head">
        <img className="avatar-lg" src={ch.select} alt="" />
        <div>
          <div className="kicker">{T('commander')}</div>
          <h2>{T('mode.choose', { name: player.name })}</h2>
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
            <b>{T('mode.' + m.id)}</b>
            <small>{T('mode.' + m.id + '.sub')}</small>
            {m.hard && <em className="badge">{T('hard')}</em>}
          </motion.button>
        ))}
      </div>
      <div className="mode-foot">
        <button className="link-btn" onClick={goCharacter}>{T('mode.change')}</button>
        <button className="link-btn demo" onClick={() => quickStart('may2024')} title={T('mode.demoHint')}>🎬 {T('mode.demo')}</button>
      </div>
    </motion.div>
  )
}
