import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { useT } from '../i18n/useT'
import { fade, LangToggle } from './common'
import bg from '../assets/title/title_bg.webp'
import logoEs from '../assets/title/logo_es.webp'
import logoEn from '../assets/title/logo_en.webp'

// Pantalla de inicio: la tripulación en Marte de fondo y el logo del juego ("Sobreviviendo en Marte" / "Surviving on Mars").
export default function Title({ onData }) {
  const goCharacter = useGame((s) => s.goCharacter)
  const lang = useGame((s) => s.lang)
  const T = useT()
  return (
    <motion.div className="screen title-screen" {...fade}>
      <div className="title-bg" style={{ backgroundImage: `url(${bg})` }} aria-hidden />
      <div className="title-shade" aria-hidden />
      <LangToggle className="corner" />
      <div className="title-top">
        <motion.div className="kicker title-kicker" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          NASA Space Apps 2026 · {T('title.kicker')}
        </motion.div>
        <motion.img
          key={lang}
          className="title-logo"
          src={lang === 'en' ? logoEn : logoEs}
          alt={T('title.name')}
          draggable={false}
          initial={{ opacity: 0, y: -40, scale: 0.9, rotate: -2 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 14, delay: 0.1 }}
        />
      </div>
      <motion.div className="title-menu" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
        <p className="title-question">{T('title.question')}</p>
        <p className="big-icons title-icons">🚀 → 🔴 → 🏠 → ☀️🛡️ → 🏆</p>
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
      </motion.div>
    </motion.div>
  )
}
