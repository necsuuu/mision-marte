import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/store'
import { useT } from '../i18n/useT'
import { LangToggle } from './common'
import { stopSpeaking, speak } from '../game/voice'

/**
 * ⏸️ Menú de pausa: se abre con Esc (o el botón ⏸️). Frena todo el juego:
 * la escena 3D, los relojes, la cuenta regresiva y la voz.
 */
export default function PauseMenu() {
  const paused = useGame((s) => s.paused)
  const { setPaused, restartMission, goTitle } = useGame.getState()
  const T = useT()
  const [confirm, setConfirm] = useState(null) // 'restart' | 'menu'

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      const s = useGame.getState()
      if (s.paused) {
        setConfirm(null)
        setPaused(false)
      } else setPaused(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setPaused])

  useEffect(() => {
    if (paused) { stopSpeaking(); speak(T('pause.title')) }
    else setConfirm(null)
  }, [paused]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = (what) => {
    setConfirm(null)
    if (what === 'restart') restartMission()
    else goTitle()
  }

  return (
    <AnimatePresence>
      {paused && (
        <motion.div className="pause-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="pause-card" initial={{ scale: 0.85, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}>
            <div className="pause-icon">⏸️</div>
            <h2>{T('pause.title')}</h2>
            {!confirm ? (
              <div className="pause-btns">
                <button className="btn primary big" onClick={() => setPaused(false)} autoFocus>▶ {T('pause.resume')}</button>
                <button className="btn ghost" onClick={() => setConfirm('restart')}>🔄 {T('pause.restart')}</button>
                <button className="btn ghost" onClick={() => setConfirm('menu')}>🏠 {T('pause.menu')}</button>
              </div>
            ) : (
              <div className="pause-confirm">
                <p>{T(confirm === 'restart' ? 'pause.sureRestart' : 'pause.sureMenu')}</p>
                <div className="pause-row">
                  <button className="btn primary" onClick={() => run(confirm)}>{T('pause.yes')}</button>
                  <button className="btn ghost" onClick={() => setConfirm(null)}>{T('pause.no')}</button>
                </div>
              </div>
            )}
            <LangToggle className="pause-lang" />
            <small className="pause-hint">{T('pause.hint')}</small>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
