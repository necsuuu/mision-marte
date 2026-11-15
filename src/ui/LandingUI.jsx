import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/store'
import { cine, CINE_END } from '../game/clocks'
import { useT } from '../i18n/useT'
import { Tx } from './common'

const STEPS = [
  [0, '🪂', 'cine.1'],
  [4.5, '🔥', 'cine.2'],
  [7.6, '✅', 'cine.3'],
  [9, '🏗️', 'cine.4'],
  [14, '👩‍🚀', 'cine.ready'],
]

export default function LandingUI() {
  const name = useGame((s) => s.player.name)
  const T = useT()
  const [t, setT] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setT(cine.t), 150)
    return () => clearInterval(iv)
  }, [])
  const step = [...STEPS].reverse().find((s) => t >= s[0]) || STEPS[0]
  return (
    <motion.div className="screen cine-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="letterbox top" />
      <div className="letterbox bottom" />
      <AnimatePresence mode="wait">
        <motion.div key={step[0]} className="cine-caption" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <span>{step[1]}</span> {T(step[2], { name })}
        </motion.div>
      </AnimatePresence>
      {t > 1 && t < 7 && (
        <motion.div className="cine-fact" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Tx k="cine.fact" />
        </motion.div>
      )}
      <button className="btn ghost skip" onClick={() => (cine.t = CINE_END)}>{T('skip')}</button>
    </motion.div>
  )
}
