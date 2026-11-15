import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/store'
import { launchClock, LAUNCH_END, LIFTOFF, SPACE_CUT } from '../game/clocks'
import { useT } from '../i18n/useT'
import { Tx } from './common'
import { useSpeak } from '../game/voice'
import { play } from '../game/sfx'

const STEPS = [
  [0, '🌍', 'launch.1'],
  [LIFTOFF, '🔥', 'launch.2'],
  [5.6, '☁️', 'launch.3'],
  [SPACE_CUT, '🔴', 'launch.4'],
  [10.6, '📦', 'launch.5'],
]

export default function LaunchUI() {
  const name = useGame((s) => s.player.name)
  const T = useT()
  const [t, setT] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setT(launchClock.t), 100)
    return () => clearInterval(iv)
  }, [])
  const step = [...STEPS].reverse().find((s) => t >= s[0]) || STEPS[0]
  // cuenta regresiva 3, 2, 1 antes del despegue
  const count = t > 0.6 && t < LIFTOFF ? Math.max(1, Math.ceil(LIFTOFF - t)) : null
  useSpeak(T(step[2], { name }))
  // 🔊 pitido en cada número y trueno del cohete al despegar
  useEffect(() => { if (count) play('beep') }, [count])
  const lifted = t >= LIFTOFF && t < LIFTOFF + 1
  useEffect(() => { if (lifted) play('liftoff') }, [lifted])
  const flash = Math.max(0, 1 - Math.abs(t - SPACE_CUT) / 0.45)
  const fadeOut = Math.max(0, Math.min(1, (t - (LAUNCH_END - 0.8)) / 0.8))

  return (
    <motion.div className="screen cine-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="letterbox top" />
      <div className="letterbox bottom" />
      <AnimatePresence mode="wait">
        {count && (
          <motion.div key={count} className="launch-count" initial={{ scale: 2.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>
            {count}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
        <motion.div key={step[0]} className="cine-caption" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <span>{step[1]}</span> {T(step[2], { name })}
        </motion.div>
      </AnimatePresence>
      {t > SPACE_CUT + 0.5 && t < LAUNCH_END - 0.6 && (
        <motion.div className="cine-fact" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Tx k="launch.fact" />
        </motion.div>
      )}
      <div className="cine-flash" style={{ opacity: flash }} />
      <div className="cine-fade" style={{ opacity: fadeOut }} />
      <button className="btn ghost skip" onClick={() => (launchClock.t = LAUNCH_END)}>{T('skip')}</button>
    </motion.div>
  )
}
