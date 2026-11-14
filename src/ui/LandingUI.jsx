import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/store'
import { cine } from '../three/cine'
import { CINE_END } from '../three/MarsBase'

const STEPS = [
  [0, '🪂', 'Entrando a la atmósfera de Marte…'],
  [4.5, '🔥', '¡Retrocohetes encendidos!'],
  [7.6, '✅', '¡Aterrizamos!'],
  [9, '🏗️', 'Desplegando la base…'],
  [14, '👩‍🚀', null],
]

export default function LandingUI() {
  const name = useGame((s) => s.player.name)
  const [t, setT] = useState(0)
  useEffect(() => {
    const iv = setInterval(() => setT(cine.t), 150)
    return () => clearInterval(iv)
  }, [])
  const step = [...STEPS].reverse().find((s) => t >= s[0]) || STEPS[0]
  const text = step[2] || `¡Base lista, Comandante ${name}!`
  return (
    <motion.div className="screen cine-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="letterbox top" />
      <div className="letterbox bottom" />
      <AnimatePresence mode="wait">
        <motion.div key={step[0]} className="cine-caption" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
          <span>{step[1]}</span> {text}
        </motion.div>
      </AnimatePresence>
      {t > 1 && t < 7 && (
        <motion.div className="cine-fact" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          💡 La atmósfera de Marte es muy finita: para frenar hacen falta paracaídas <b>y</b> cohetes.
        </motion.div>
      )}
      <button className="btn ghost skip" onClick={() => (cine.t = CINE_END)}>⏭️ Saltar</button>
    </motion.div>
  )
}
