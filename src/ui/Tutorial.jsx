// Tutorial animado (tipo video) de cómo moverse y juntar objetos en la nave. Se puede saltar.
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame, capacityFor, loadSecondsFor } from '../game/store'
import { getCharacter, WALK_SEQUENCE } from '../game/characters'
import { useT } from '../i18n/useT'
import { fade } from './common'
import { useSpeak } from '../game/voice'

const STEP_MS = 4200
const D = STEP_MS / 1000
const loop = { duration: D, repeat: Infinity, ease: 'easeInOut' }

function Key({ k, glow }) {
  return (
    <motion.div className="tut-key" animate={{ backgroundColor: glow.map((g) => (g ? '#ffd166' : '#2a2f3c')), color: glow.map((g) => (g ? '#1b0d06' : '#f4ede4')), y: glow.map((g) => (g ? 3 : 0)) }} transition={{ ...loop, ease: 'linear' }}>
      {k}
    </motion.div>
  )
}

function Walker({ frames, walking, x, y, flip }) {
  const [f, setF] = useState(0)
  useEffect(() => {
    if (!walking) return
    const iv = setInterval(() => setF((n) => n + 1), 110)
    return () => clearInterval(iv)
  }, [walking])
  const src = frames[WALK_SEQUENCE[f % WALK_SEQUENCE.length]]
  return (
    <motion.img className="tut-walker" src={src} alt="" style={{ scaleX: flip || 1 }} animate={{ left: x, top: y }} transition={{ ...loop, times: x.length === 4 ? [0, 0.3, 0.65, 1] : undefined }} />
  )
}

function Cursor({ x, y, clickAt }) {
  return (
    <>
      <motion.div className="tut-cursor" animate={{ left: x, top: y }} transition={loop}>🖱️</motion.div>
      <motion.div className="tut-ripple" style={{ left: x[x.length - 2], top: y[y.length - 2] }} animate={{ scale: [0, 0, 1.6, 1.6], opacity: [0, 0, 0.9, 0] }} transition={{ ...loop, times: [0, clickAt, clickAt + 0.08, clickAt + 0.25] }} />
    </>
  )
}

// Cada paso es una escena en loop
function Scene({ step, frames }) {
  if (step === 0) {
    // WASD: D (derecha), W (arriba), A (izquierda)
    return (
      <>
        <Walker frames={frames} walking x={['15%', '45%', '45%', '15%']} y={['42%', '42%', '12%', '12%']} />
        <div className="tut-keys">
          <div className="tut-keyrow"><Key k="W" glow={[0, 0, 0, 1, 1, 0, 0, 0]} /></div>
          <div className="tut-keyrow">
            <Key k="A" glow={[0, 0, 0, 0, 0, 1, 1, 0]} />
            <Key k="S" glow={[0, 0, 0, 0, 0, 0, 0, 0]} />
            <Key k="D" glow={[1, 1, 1, 0, 0, 0, 0, 0]} />
          </div>
        </div>
      </>
    )
  }
  if (step === 1) {
    return (
      <>
        <Walker frames={frames} walking x={['12%', '12%', '62%', '62%']} y={['30%', '30%', '40%', '40%']} />
        <Cursor x={['80%', '68%', '68%', '68%']} y={['80%', '62%', '62%', '62%']} clickAt={0.25} />
        <motion.div className="tut-target" style={{ left: '66%', top: '74%' }} animate={{ opacity: [0, 0, 1, 1, 0] }} transition={{ ...loop, times: [0, 0.25, 0.3, 0.8, 1] }} />
      </>
    )
  }
  if (step === 2) {
    return (
      <>
        <div className="tut-locker">
          <motion.div className="tut-door" animate={{ rotateY: [0, 0, -100, -100, 0] }} transition={{ ...loop, times: [0, 0.2, 0.32, 0.92, 1] }}>❓</motion.div>
          <motion.div className="tut-item" animate={{ opacity: [0, 0, 1, 1, 0], x: ['0%', '0%', '0%', '-160%', '-160%'], y: ['0%', '0%', '-10%', '60%', '60%'] }} transition={{ ...loop, times: [0, 0.3, 0.4, 0.7, 1] }}>🧪</motion.div>
        </div>
        <Walker frames={frames} walking={false} x={['30%', '30%']} y={['30%', '30%']} />
        <Cursor x={['70%', '58%', '58%', '58%']} y={['85%', '40%', '40%', '40%']} clickAt={0.2} />
        <div className="tut-keys right"><div className="tut-keyrow"><Key k="E" glow={[0, 0, 0, 0, 1, 1, 0, 0]} /></div></div>
      </>
    )
  }
  if (step === 3) {
    return (
      <>
        <div className="tut-hatch">🏠</div>
        <Walker frames={frames} walking x={['8%', '8%', '66%', '66%']} y={['34%', '34%', '30%', '30%']} />
        <motion.div className="tut-carry" animate={{ left: ['13%', '13%', '71%', '71%'], opacity: [1, 1, 1, 0] }} transition={{ ...loop, times: [0, 0.1, 0.6, 0.7] }}>🧪🥔</motion.div>
        <motion.div className="tut-check" animate={{ scale: [0, 0, 1.3, 1, 1], opacity: [0, 0, 1, 1, 0] }} transition={{ ...loop, times: [0, 0.62, 0.7, 0.8, 1] }}>✅</motion.div>
        <div className="tut-hands">✋✋</div>
      </>
    )
  }
  return (
    <div className="tut-rules">
      <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 1.2, repeat: Infinity }}>⏱️ 60s</motion.span>
      <span>⚖️ 18</span>
      <motion.span animate={{ x: [0, 6, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>🌪️</motion.span>
    </div>
  )
}

const STEPS = ['tut.s1', 'tut.s2', 'tut.s3', 'tut.s4', 'tut.s5']

function Say({ text }) { useSpeak(text); return null }

export default function Tutorial() {
  const T = useT()
  const player = useGame((s) => s.player)
  const finish = useGame((s) => s.finishTutorial)
  const frames = getCharacter(player.character).walk
  const [step, setStep] = useState(0)
  const [auto, setAuto] = useState(true)
  const paused = useGame((s) => s.paused)
  useEffect(() => {
    if (!auto || paused) return
    const tm = setTimeout(() => setStep((s) => (s < STEPS.length - 1 ? s + 1 : s)), STEP_MS * 1.6)
    return () => clearTimeout(tm)
  }, [step, auto, paused])
  const last = step === STEPS.length - 1
  return (
    <motion.div className="screen center tutorial" {...fade}>
      <div className="panel tut-card">
        <div className="tut-head">
          <div className="kicker">{T('tut.kicker')}</div>
          <button className="btn ghost tut-skip" onClick={finish}>{T('tut.skip')}</button>
        </div>
        <div className="tut-stage">
          <div className="tut-rec"><span className="pulse-dot" /> REC</div>
          <AnimatePresence mode="wait">
            <motion.div key={step} className="tut-scene" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Scene step={step} frames={frames} />
            </motion.div>
          </AnimatePresence>
        </div>
        <Say text={T(STEPS[step], { s: loadSecondsFor(useGame.getState()), kg: capacityFor(useGame.getState()) })} />
        <AnimatePresence mode="wait">
          <motion.h2 key={step} className="tut-caption" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{T(STEPS[step], { s: loadSecondsFor(useGame.getState()), kg: capacityFor(useGame.getState()) })}</motion.h2>
        </AnimatePresence>
        <div className="tut-foot">
          <div className="tut-dots">
            {STEPS.map((_, i) => <button key={i} className={i === step ? 'on' : ''} onClick={() => { setAuto(false); setStep(i) }} aria-label={`${i + 1}`} />)}
          </div>
          <button className="btn primary" onClick={() => (last ? finish() : (setAuto(false), setStep(step + 1)))}>{last ? T('tut.go') : T('tut.next')}</button>
        </div>
      </div>
    </motion.div>
  )
}
