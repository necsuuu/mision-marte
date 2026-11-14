import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { useT } from '../i18n/useT'
import { fade, LangToggle } from './common'

export default function Title({ onData }) {
  const goCharacter = useGame((s) => s.goCharacter)
  const T = useT()
  return (
    <motion.div className="screen title-screen" {...fade}>
      <LangToggle className="corner" />
      <div className="title-col">
        <div className="kicker">{T('title.kicker')}</div>
        <h1 className="logo">
          {T('title.mission')} <span>{T('title.mars')}</span>
        </h1>
        <p className="lead big-icons">🚀 → 🔴 → 🏠 → ☀️🛡️ → 🏆</p>
        <p className="lead">{T('title.question')}</p>
        <motion.button
          className="btn primary play-btn"
          onClick={goCharacter}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ boxShadow: ['0 8px 24px rgba(226,104,58,.4)', '0 8px 44px rgba(226,104,58,.8)', '0 8px 24px rgba(226,104,58,.4)'] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {T('play')}
        </motion.button>
        <button className="link-btn" onClick={onData}>{T('nasaData')}</button>
      </div>
    </motion.div>
  )
}
