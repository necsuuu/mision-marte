// 🛠️ Interfaz de la tarea física: qué hay que hacer, el botón para usar lo que está cerca
// y los desafíos que se abren al llegar (sellar una grieta, reconectar cables, elegir plantas).
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/store'
import { TASKS, taskSpots, taskLimit, leakLoss, CIRCUIT_WIRES, PLANT_GRID, WATER_BAND, MATES, SYMPTOMS, KIT, LAYERS, PIECES } from '../game/tasks'
import { CREW } from '../game/characters'
import { locEvent } from '../i18n/core'
import { isTouch } from '../game/device'
import { play } from '../game/sfx'
import { useSpeak } from '../game/voice'
import { useT } from '../i18n/useT'
import { PartBoundary } from './ErrorBoundary'

export default function TaskUI() {
  const task = useGame((s) => s.task)
  if (!task) return null
  // 🛟 si un desafío falla al dibujarse, la tarea la termina la tripulación y la partida sigue
  return (
    <PartBoundary key={task.key} name={'tarea:' + task.id + '/' + (task.mini || '')} onError={() => useGame.getState().recover(false)}>
      <TaskParts task={task} />
    </PartBoundary>
  )
}

function TaskParts({ task }) {
  return (
    <>
      <TaskBanner />
      <AnimatePresence>
        {!task.mini && task.near && !task.busy && <ActButton key="act" />}
      </AnimatePresence>
      <AnimatePresence>
        {task.mini === 'seal' && <SealGame key="seal" />}
        {task.mini === 'wire' && <CircuitGame key="wire" />}
        {task.mini === 'check' && <PlantsGame key="check" />}
        {task.mini === 'talk' && <TalkCard key="talk" />}
        {task.mini === 'water' && <WaterGame key="water" />}
        {task.mini === 'aim' && <AimGame key="aim" />}
        {task.mini === 'mate' && <MateCard key="mate" />}
        {task.mini === 'medic' && <MedicGame key="medic" />}
        {task.mini === 'bike' && <BikeGame key="bike" />}
        {task.mini === 'drill' && <DrillGame key="drill" />}
        {task.mini === 'assemble' && <AssembleGame key="assemble" />}
      </AnimatePresence>
    </>
  )
}

// ---------- Cartel de arriba: qué hacer, cuánto falta y "que lo haga la tripulación" ----------
function TaskBanner() {
  const T = useT()
  const s = useGame()
  const task = s.task || {}
  const def = TASKS[task.id] || {}
  const spots = taskSpots(s)
  const near = spots.find((p) => p.id === task.near)
  const lim = taskLimit(s)
  const left = lim ? Math.max(0, Math.ceil(lim - task.elapsed)) : null
  const ev = s.cards[0]?.event
  const stage = task.id === 'drive' ? (task.arrived ? '.found' : '') : task.id === 'rock' ? (task.arrived ? '.back' : '') : def.talk ? (task.talked ? '.work' : '') : ''
  const goal = near ? T('task.at', { act: T('task.act.' + near.act) }) : T('task.goal.' + task.id + stage)
  useSpeak(task.id ? T('task.goal.' + task.id + stage) : '')
  if (!task.id || !def.icon) return null
  const crewLabel = ev?.direct ? '🙅 ' + T('task.notNow') : task.id === 'drive' ? '🤖 ' + T('task.autopilot') : '🤖 ' + T('task.crewDo')
  return (
    <motion.div className="task-banner" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <span className="task-icon">{def.icon}</span>
      <b className="task-goal">{goal}</b>
      <div className="task-meters">
        {task.id === 'seal' && <span className="ko">{T('task.o2lost', { n: leakLoss(s, task.elapsed) })}</span>}
        {task.id === 'clean' && <span>{T('task.panels', { a: task.cleaned.length, b: s.panels })}</span>}
        {task.id === 'drive' && task.arrived && <span>🪨 {task.found.length}/3</span>}
        {left !== null && (
          <span className={'task-time' + (left <= 10 ? ' ko' : '')}>
            {task.id === 'drive' ? '🔋' : '⏱️'} {left}s
            <i style={{ width: `${(left / lim) * 100}%` }} />
          </span>
        )}
      </div>
      {task.id === 'drive' && task.arrived && (
        <button className="btn primary task-done" onClick={() => s.finishTask({ arrived: true, found: task.found.length })}>🏠 {T('task.goHome')}</button>
      )}
      <button className="task-crew" onClick={() => s.finishTask({ crew: true })} title={T('task.crewDoWhy')}>{crewLabel}</button>
    </motion.div>
  )
}

function ActButton() {
  const T = useT()
  const s = useGame()
  const spot = s.task ? taskSpots(s).find((p) => p.id === s.task.near) : null
  if (!spot) return null
  return (
    <motion.button className="btn primary act-btn task-act" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
      onPointerDown={(e) => { e.preventDefault(); s.taskAct(spot.id) }}>
      {TASKS[s.task.id].icon} {T('task.act.' + spot.act)} <kbd className="key-e">E</kbd>
    </motion.button>
  )
}

/** Cuando el desafío termina, espera un momento (para ver el festejo) y cierra la tarea. */
function useFinishAfter(done, ms, result) {
  const fn = useRef(result)
  fn.current = result
  useEffect(() => {
    if (!done) return
    const key = useGame.getState().task?.key
    const tm = setTimeout(() => useGame.getState().finishTask(fn.current(), key), ms)
    return () => clearTimeout(tm)
  }, [done, ms])
}

/** Marco común de los desafíos. */
function Mini({ title, help, children, done }) {
  useSpeak(title + '. ' + help)
  return (
    <motion.div className="mini-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="mini-card" initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 18 }}>
        <div className="mini-head"><b>{title}</b><small>{help}</small></div>
        {children}
        <AnimatePresence>{done && <motion.div className="mini-done" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>{done}</motion.div>}</AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ---------- 🧰 Sellar la grieta: pasar el dedo por toda la grieta ----------
function makeCrack() {
  const pts = []
  let y = 110
  for (let i = 0; i <= 9; i++) {
    y = Math.max(40, Math.min(180, y + (Math.random() - 0.5) * 70))
    pts.push([40 + i * 35.5, y])
  }
  // puntos chiquitos a lo largo de la grieta: cada uno se sella por separado
  const samples = []
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1]
    for (let k = 0; k < 7; k++) samples.push([ax + ((bx - ax) * k) / 7, ay + ((by - ay) * k) / 7])
  }
  samples.push(pts[pts.length - 1])
  return { pts, samples }
}

function SealGame() {
  const T = useT()
  const [crack] = useState(makeCrack)
  const [sealed, setSealed] = useState(() => crack.samples.map(() => false))
  const [nozzle, setNozzle] = useState(null)
  const [done, setDone] = useState(false)
  const svg = useRef(null)
  const drawing = useRef(false)
  const count = sealed.filter(Boolean).length
  const pct = count / sealed.length

  const sealAt = (x, y) => {
    setSealed((prev) => {
      let changed = false
      const next = prev.map((v, i) => {
        if (v) return v
        const [sx, sy] = crack.samples[i]
        if (Math.hypot(sx - x, sy - y) < 22) { changed = true; return true }
        return v
      })
      if (changed) play('tick')
      return changed ? next : prev
    })
  }
  const toSvg = (e) => {
    const r = svg.current.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * 400, ((e.clientY - r.top) / r.height) * 220]
  }
  // con teclado: mantener E (o espacio) va sellando la grieta en orden
  useEffect(() => {
    let raf, last = 0, held = false
    const loop = (ts) => {
      if (held && !useGame.getState().paused && ts - last > 45) {
        last = ts
        setSealed((prev) => { const i = prev.indexOf(false); if (i < 0) return prev; const n = [...prev]; n[i] = true; return n })
      }
      raf = requestAnimationFrame(loop)
    }
    const down = (e) => { if (['e', ' '].includes(e.key.toLowerCase())) { held = true; e.preventDefault() } }
    const up = (e) => { if (['e', ' '].includes(e.key.toLowerCase())) held = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])
  // casi toda la grieta sellada: se completa sola (para que no haya que buscar un puntito suelto)
  useEffect(() => {
    if (done || pct < 0.9) return
    setSealed((p) => p.map(() => true))
    setDone(true)
    play('good')
  }, [pct, done])
  useFinishAfter(done, 1100, () => { const g = useGame.getState(); return { time: g.task?.elapsed || 0 } })

  // tramos sellados (para dibujar la masilla)
  const runs = []
  let cur = null
  crack.samples.forEach((p, i) => {
    if (sealed[i]) { cur = cur || []; cur.push(p) } else if (cur) { runs.push(cur); cur = null }
  })
  if (cur) runs.push(cur)
  const firstOpen = sealed.indexOf(false)
  const leakAt = firstOpen >= 0 ? crack.samples[firstOpen] : null

  return (
    <Mini title={T('seal.title')} help={T(isTouch ? 'seal.help@touch' : 'seal.help')} done={done && T('seal.done')}>
      <svg
        ref={svg}
        className="seal-board"
        viewBox="0 0 400 220"
        onPointerDown={(e) => { drawing.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); const [x, y] = toSvg(e); setNozzle([x, y]); sealAt(x, y) }}
        onPointerMove={(e) => { const [x, y] = toSvg(e); setNozzle([x, y]); if (drawing.current) sealAt(x, y) }}
        onPointerUp={() => { drawing.current = false }}
        onPointerLeave={() => { drawing.current = false; setNozzle(null) }}
      >
        <defs>
          <pattern id="hull" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#cfc8bb" />
            <path d="M0 40 L40 0" stroke="#bdb5a6" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="400" height="220" rx="16" fill="url(#hull)" />
        <circle cx="16" cy="16" r="5" fill="#9a9488" /><circle cx="384" cy="16" r="5" fill="#9a9488" /><circle cx="16" cy="204" r="5" fill="#9a9488" /><circle cx="384" cy="204" r="5" fill="#9a9488" />
        <polyline points={crack.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#1b1612" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
        <polyline points={crack.pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#000" strokeWidth="2.5" strokeLinejoin="round" opacity="0.6" />
        {runs.map((r, i) => r.length > 1
          ? <polyline key={i} points={r.map((p) => p.join(',')).join(' ')} fill="none" stroke="#e9e4d8" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
          : <circle key={i} cx={r[0][0]} cy={r[0][1]} r="9" fill="#e9e4d8" />)}
        {leakAt && !done && (
          <g className="seal-air" transform={`translate(${leakAt[0]} ${leakAt[1]})`}>
            <circle r="6" fill="#bff3ff" opacity="0.7" /><circle r="12" fill="none" stroke="#bff3ff" strokeWidth="2" opacity="0.5" />
          </g>
        )}
        {nozzle && !done && <g transform={`translate(${nozzle[0]} ${nozzle[1]})`} pointerEvents="none"><circle r="20" fill="none" stroke="#ffd166" strokeWidth="3" strokeDasharray="5 4" /><circle r="4" fill="#ffd166" /></g>}
      </svg>
      <div className="mini-bar"><i style={{ width: `${pct * 100}%` }} /><span>{Math.round(pct * 100)}%</span></div>
    </Mini>
  )
}

// ---------- 🔌 Reconectar cables: cada uno con el enchufe de su color ----------
const WIRES = [
  { c: '#ff6b6b', s: '●' },
  { c: '#ffd166', s: '▲' },
  { c: '#5ad1ff', s: '■' },
  { c: '#7be07b', s: '◆' },
]

function CircuitGame() {
  const T = useT()
  const easy = useGame((s) => s.easy)
  const n = CIRCUIT_WIRES(easy)
  const [order] = useState(() => {
    let o
    do o = [...Array(n).keys()].sort(() => Math.random() - 0.5)
    while (o.some((v, i) => v === i)) // que ninguno quede justo enfrente: así hay que mirar
    return o
  })
  const [sel, setSel] = useState(null)
  const [links, setLinks] = useState([]) // índices de cables ya conectados
  const [shorts, setShorts] = useState(0)
  const [spark, setSpark] = useState(null)
  const [done, setDone] = useState(false)
  const H = 60 + n * 52
  const y = (i) => 50 + i * 52

  const tryLink = (socketPos) => {
    if (sel === null || done) return
    const wire = order[socketPos]
    if (wire === sel) {
      play('pick')
      setLinks((l) => [...l, sel])
      setSel(null)
    } else {
      play('deny')
      setShorts((k) => k + 1)
      setSpark({ at: socketPos, t: Date.now() })
      setSel(null)
    }
  }
  useEffect(() => {
    if (done || links.length < n) return
    setDone(true)
    play('good')
  }, [links, n, done])
  const shortsRef = useRef(0)
  shortsRef.current = shorts
  useFinishAfter(done, 1200, () => ({ shorts: shortsRef.current }))

  return (
    <Mini title={T('circuit.title')} help={T(isTouch ? 'circuit.help@touch' : 'circuit.help')} done={done && T('circuit.done')}>
      <svg className="circuit-board" viewBox={`0 0 400 ${H}`}>
        <rect width="400" height={H} rx="14" fill="#2a2f3a" />
        <rect x="10" y="10" width="380" height={H - 20} rx="10" fill="none" stroke="#4a5160" strokeDasharray="6 6" />
        {links.map((w) => {
          const to = order.indexOf(w)
          return <path key={w} d={`M 92 ${y(w)} C 200 ${y(w)}, 200 ${y(to)}, 308 ${y(to)}`} stroke={WIRES[w].c} strokeWidth="9" fill="none" strokeLinecap="round" />
        })}
        {[...Array(n).keys()].map((i) => {
          const on = sel === i, linked = links.includes(i)
          return (
            <g key={'w' + i} className={'wire-end' + (on ? ' on' : '') + (linked ? ' done' : '')} onClick={() => !linked && !done && (play('click'), setSel(i))} style={{ cursor: linked ? 'default' : 'pointer' }}>
              <rect x="22" y={y(i) - 20} width="70" height="40" rx="10" fill={on ? '#fff' : '#3b4252'} stroke={WIRES[i].c} strokeWidth="4" />
              <text x="57" y={y(i) + 8} textAnchor="middle" fontSize="22" fill={WIRES[i].c}>{WIRES[i].s}</text>
            </g>
          )
        })}
        {order.map((w, pos) => {
          const linked = links.includes(w)
          return (
            <g key={'s' + pos} className="socket" onClick={() => !linked && tryLink(pos)} style={{ cursor: linked ? 'default' : 'pointer' }}>
              <rect x="308" y={y(pos) - 20} width="70" height="40" rx="10" fill={linked ? WIRES[w].c : '#1b1f27'} stroke={WIRES[w].c} strokeWidth="4" opacity={linked ? 1 : 0.95} />
              <text x="343" y={y(pos) + 8} textAnchor="middle" fontSize="22" fill={linked ? '#1b1f27' : WIRES[w].c}>{WIRES[w].s}</text>
              {spark?.at === pos && <text key={spark.t} className="spark" x="300" y={y(pos) - 18} fontSize="28">⚡</text>}
            </g>
          )
        })}
      </svg>
      <div className="mini-foot">
        {sel !== null && !done && <span>{T('circuit.now')}</span>}
        {shorts > 0 && <span className="ko">{T('circuit.shorts', { n: shorts })}</span>}
      </div>
    </Mini>
  )
}

// ---------- 🌱 Plantas: sacar solo las enfermas ----------
/**
 * Cómo se ve cada planta. Las sanas varían un poco (tono, tamaño, alguna flor) y las enfermas
 * tienen algunas hojas amarillas con manchas: hay que mirar bien. Para los cadetes, las enfermas son bien amarillas.
 */
function makePlantLook(sick, easy) {
  const r = Math.random
  const greens = ['#58c26a', '#6fd36a', '#4fae5e', '#63c873']
  const g = greens[Math.floor(r() * greens.length)]
  const leaves = [g, g, g, g]
  if (sick) {
    if (easy) leaves.fill('#d6b93a')
    else {
      const bad = [0, 1, 2, 3].sort(() => r() - 0.5).slice(0, 2)
      bad.forEach((k) => (leaves[k] = '#d2b23c'))
      leaves.forEach((c, k) => { if (!bad.includes(k)) leaves[k] = '#8fbf4a' })
    }
  }
  return { leaves, scale: 0.88 + r() * 0.2, flower: !sick && r() < 0.25, tilt: sick ? 6 + r() * 6 : (r() - 0.5) * 6 }
}

const LEAVES = [
  { cx: 20, cy: 30, rx: 11, ry: 6, rot: -30, spot: [18, 30, 2.4] },
  { cx: 40, cy: 27, rx: 11, ry: 6, rot: 30, spot: [41, 26, 2] },
  { cx: 30, cy: 16, rx: 7, ry: 11, rot: 0, spot: [31, 13, 1.8] },
  { cx: 22, cy: 42, rx: 9, ry: 5, rot: -15, spot: [24, 42, 2] },
]

function Plant({ look, removed, reveal }) {
  return (
    <svg viewBox="0 0 60 70" className="plant-svg">
      <path d="M12 52 h36 l-4 16 h-28 z" fill="#b8673a" /><rect x="10" y="48" width="40" height="7" rx="2" fill="#cf7c47" />
      {!removed ? (
        <g transform={`rotate(${look.tilt} 30 50) translate(30 50) scale(${look.scale}) translate(-30 -50)`}>
          <path d="M30 50 V24" stroke="#2f8f3f" strokeWidth="3" />
          {LEAVES.map((l, k) => (
            <g key={k}>
              <ellipse cx={l.cx} cy={l.cy} rx={l.rx} ry={l.ry} transform={`rotate(${l.rot} ${l.cx} ${l.cy})`} fill={look.leaves[k]} />
              {look.leaves[k] === '#d2b23c' || look.leaves[k] === '#d6b93a' ? <circle cx={l.spot[0]} cy={l.spot[1]} r={l.spot[2]} fill="#6b4a1e" /> : null}
            </g>
          ))}
          {look.flower && <g><circle cx="30" cy="9" r="3.5" fill="#fff" /><circle cx="30" cy="9" r="1.5" fill="#ffd166" /></g>}
        </g>
      ) : (
        <g><ellipse cx="30" cy="51" rx="16" ry="3" fill="#5a3a22" /><path d="M24 36 l12 10 M36 36 l-12 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" /></g>
      )}
      {reveal && <text x="50" y="14" fontSize="14" textAnchor="middle">{reveal}</text>}
    </svg>
  )
}

function PlantsGame() {
  const T = useT()
  const easy = useGame((s) => s.easy)
  const { total, sick } = PLANT_GRID(easy)
  // se arman una sola vez al abrir el desafío
  const [plants] = useState(() => {
    const idx = [...Array(total).keys()].sort(() => Math.random() - 0.5).slice(0, sick)
    return [...Array(total).keys()].map((i) => idx.includes(i))
  })
  const [looks] = useState(() => plants.map((sk) => makePlantLook(sk, easy)))
  const [removed, setRemoved] = useState(() => plants.map(() => false))
  const [checked, setChecked] = useState(false)
  const [result, setResult] = useState(null)
  const toggle = (i) => {
    if (checked) return
    play(removed[i] ? 'unload' : 'pick')
    setRemoved((r) => r.map((v, k) => (k === i ? !v : v)))
  }
  const finish = () => {
    if (checked) return
    setChecked(true)
    const right = plants.filter((sk, i) => sk && removed[i]).length
    const wrong = plants.filter((sk, i) => !sk && removed[i]).length
    const missed = plants.filter((sk, i) => sk && !removed[i]).length
    play(wrong || missed ? 'deny' : 'good')
    setResult({ right, wrong, missed })
  }
  useFinishAfter(!!result, 1600, () => result)
  const mark = (i) => {
    if (!checked) return null
    if (plants[i] && removed[i]) return '✅'
    if (!plants[i] && removed[i]) return '❌'
    if (plants[i] && !removed[i]) return '⚠️'
    return null
  }
  return (
    <Mini title={T('plants.title')} help={T(isTouch ? 'plants.help@touch' : 'plants.help')}>
      <div className={'plant-grid n' + total}>
        {plants.map((_, i) => (
          <button key={i} className={'plant' + (removed[i] ? ' out' : '')} onClick={() => toggle(i)} aria-label={T('plants.one', { n: i + 1 })}>
            <Plant look={looks[i]} removed={removed[i]} reveal={mark(i)} />
          </button>
        ))}
      </div>
      <div className="mini-foot">
        {easy && <span>{T('plants.count', { n: sick })}</span>}
        <button className="btn primary" onClick={finish} disabled={checked}>✔ {T('plants.ok')}</button>
      </div>
    </Mini>
  )
}

// ---------- 💬 Conversación con el compañero que pide ayuda ----------
function TalkCard() {
  const T = useT()
  const s = useGame()
  const ev = locEvent(s.lang, s.cards[0]?.event)
  const crew = CREW.find((c) => c.id === ev?.crew) || CREW[0]
  useSpeak(ev?.talk)
  if (!ev?.talk || !ev.choices?.[1]) return null
  return (
    <motion.div className="mini-overlay talk-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="talk-card" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', damping: 18 }}>
        <img src={crew.sprite} alt="" className="talk-face" />
        <div className="talk-body">
          <b>{T('crew.name.' + crew.id)}</b>
          <p>{ev.talk}</p>
          <div className="talk-btns">
            <button className="btn primary" onClick={() => { play('pick'); s.taskPatch({ talked: true, mini: null }) }}>👍 {ev.choices[0].label}</button>
            <button className="btn ghost" onClick={() => s.finishTask({ crew: true })}>{ev.choices[1].label}</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------- 💧 Riego: llenar cada bandeja hasta la franja verde, sin rebalsar ----------
function WaterGame() {
  const T = useT()
  const easy = useGame((s) => s.easy)
  const [lo, hi] = WATER_BAND(easy)
  // cada bandeja tiene una manguera distinta: unas dan mucha agua por toque y otras poca
  const [trays, setTrays] = useState(() => [16, 10, 6].sort(() => Math.random() - 0.5).map((flow) => ({ flow, level: 12 + Math.round(Math.random() * 22), spilled: false })))
  const [checked, setChecked] = useState(false)
  const pour = (i) => {
    if (checked) return
    setTrays((ts) => ts.map((t, k) => {
      if (k !== i || t.spilled) return t
      const level = t.level + t.flow
      if (level > 100) { play('deny'); return { ...t, level: 100, spilled: true } }
      play('tick')
      return { ...t, level }
    }))
  }
  // con teclado: 1, 2 y 3 riegan cada bandeja; Enter termina
  useEffect(() => {
    const down = (e) => {
      if (useGame.getState().paused) return
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= 3) pour(n - 1)
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  })
  const inBand = trays.filter((t) => !t.spilled && t.level >= lo && t.level <= hi).length
  const spills = trays.filter((t) => t.spilled).length
  const finish = () => {
    if (checked) return
    setChecked(true)
    play(inBand === 3 ? 'good' : 'deny')
  }
  useFinishAfter(checked, 1300, () => ({ inBand, spills }))
  return (
    <Mini title={T('water.title')} help={T(isTouch ? 'water.help@touch' : 'water.help')} done={checked && (inBand === 3 ? T('water.done') : T('water.some', { n: inBand }))}>
      <div className="wtrays">
        {trays.map((t, i) => {
          const ok = !t.spilled && t.level >= lo && t.level <= hi
          return (
            <div key={i} className={'wtray' + (t.spilled ? ' spilled' : ok ? ' ok' : '')}>
              <div className="wtray-tank">
                <div className="wtray-band" style={{ bottom: `${lo}%`, height: `${hi - lo}%` }} />
                <motion.div className="wtray-water" animate={{ height: `${t.level}%` }} transition={{ type: 'spring', damping: 14 }} />
                {t.spilled && <span className="wtray-spill">💦</span>}
              </div>
              <button className="btn wtray-btn" onClick={() => pour(i)} disabled={checked || t.spilled}>
                <span className="hose" style={{ height: 4 + t.flow * 0.9 }} />💧 {isTouch ? '' : <kbd>{i + 1}</kbd>}
              </button>
            </div>
          )
        })}
      </div>
      <div className="mini-foot">
        <span>{T('water.inBand', { n: inBand })}</span>
        <button className="btn primary" onClick={finish} disabled={checked}>✔ {T('plants.ok')}</button>
      </div>
    </Mini>
  )
}

// ---------- 📡 Antena: girarla hasta encontrar la señal más fuerte ----------
function AimGame() {
  const T = useT()
  const easy = useGame((s) => s.easy)
  const [target] = useState(() => 60 + Math.random() * 240) // dónde está la Tierra (en grados)
  const [angle, setAngle] = useState(0)
  const [lockT, setLockT] = useState(0)
  const [done, setDone] = useState(false)
  const t0 = useRef(useGame.getState().task?.elapsed || 0)
  const dial = useRef(null)
  const diff = Math.abs(((angle - target + 540) % 360) - 180)
  const signal = Math.pow(Math.max(0, Math.cos((diff * Math.PI) / 180)), easy ? 3 : 6)
  const locked = signal > 0.93
  const turn = (d) => !done && setAngle((a) => (a + d + 360) % 360)
  const fromPointer = (e) => {
    const r = dial.current.getBoundingClientRect()
    const a = (Math.atan2(e.clientX - (r.left + r.width / 2), -(e.clientY - (r.top + r.height / 2))) * 180) / Math.PI
    if (!done) setAngle((a + 360) % 360)
  }
  // quedarse en la señal fuerte un ratito para fijarla
  useEffect(() => {
    if (done) return
    if (!locked) { setLockT(0); return }
    const iv = setInterval(() => setLockT((v) => v + 0.1), 100)
    return () => clearInterval(iv)
  }, [locked, done])
  useEffect(() => {
    if (done || lockT < 1.2) return
    setDone(true)
    play('good')
  }, [lockT, done])
  useEffect(() => {
    const down = (e) => {
      if (useGame.getState().paused) return
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') turn(-4)
      if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') turn(4)
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  })
  useEffect(() => { if (!done && signal > 0.6) play('tick') }, [Math.round(signal * 10)]) // eslint-disable-line react-hooks/exhaustive-deps
  useFinishAfter(done, 1200, () => ({ time: (useGame.getState().task?.elapsed || 0) - t0.current }))
  const bars = Math.round(signal * 5)
  return (
    <Mini title={T('aim.title')} help={T(isTouch ? 'aim.help@touch' : 'aim.help')} done={done && T('aim.done')}>
      <div className="aim-wrap">
        <button className="btn aim-turn" onPointerDown={() => turn(-6)} aria-label="◀">◀</button>
        <svg ref={dial} className="aim-dial" viewBox="0 0 200 200"
          onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); fromPointer(e) }}
          onPointerMove={(e) => e.buttons && fromPointer(e)}>
          <circle cx="100" cy="100" r="92" fill="#11151f" stroke="#3b4252" strokeWidth="4" />
          {[...Array(24).keys()].map((i) => <line key={i} x1="100" y1="12" x2="100" y2={i % 6 ? 20 : 26} stroke="#4a5160" strokeWidth="2" transform={`rotate(${i * 15} 100 100)`} />)}
          {easy && <text x="100" y="100" transform={`rotate(${target} 100 100) translate(0 -70)`} textAnchor="middle" fontSize="16" opacity="0.5">🌍</text>}
          <g transform={`rotate(${angle} 100 100)`}>
            <path d="M100 100 L100 30" stroke={locked ? '#7be07b' : '#ffd166'} strokeWidth="6" strokeLinecap="round" />
            <path d="M78 46 Q100 18 122 46" fill="none" stroke={locked ? '#7be07b' : '#ffd166'} strokeWidth="7" strokeLinecap="round" />
          </g>
          <circle cx="100" cy="100" r="12" fill="#d9d2c6" />
        </svg>
        <button className="btn aim-turn" onPointerDown={() => turn(6)} aria-label="▶">▶</button>
        <div className={'aim-signal' + (locked ? ' on' : '')}>
          <div className="aim-bars">{[1, 2, 3, 4, 5].map((b) => <i key={b} className={b <= bars ? 'on' : ''} style={{ height: 8 + b * 8 }} />)}</div>
          <small>{locked ? T('aim.hold') : T('aim.signal')}</small>
        </div>
      </div>
    </Mini>
  )
}

/** Un reloj que avanza con requestAnimationFrame y se frena con la pausa. Llama a tick(dt, total). */
function useLoop(tick, running = true) {
  const fn = useRef(tick)
  fn.current = tick
  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    let total = 0
    const step = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      if (!useGame.getState().paused) { total += dt; fn.current(dt, total) }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [running])
}

/** Teclas para el botón principal de un desafío (espacio, E o Enter). */
function useActionKey(fn) {
  const ref = useRef(fn)
  ref.current = fn
  useEffect(() => {
    const down = (e) => {
      if (useGame.getState().paused || e.repeat) return
      const k = e.key.toLowerCase()
      if (k === ' ' || k === 'e' || k === 'enter' || k === 'arrowleft' || k === 'arrowright' || k === 'a' || k === 'd') { e.preventDefault(); ref.current(k) }
    }
    window.addEventListener('keydown', down)
    return () => window.removeEventListener('keydown', down)
  }, [])
}

// ---------- 🚙 ¿Quién va en el rover? ----------
function MateCard() {
  const T = useT()
  const s = useGame()
  useSpeak(T('mate.title') + '. ' + T('mate.help'))
  const pick = (id) => { play('pick'); s.taskPatch({ mate: id, mini: null }) }
  return (
    <motion.div className="mini-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="mini-card mate-card" initial={{ scale: 0.85, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: 'spring', damping: 18 }}>
        <div className="mini-head"><b>{T('mate.title')}</b><small>{T('mate.help')}</small></div>
        <div className="mates">
          {CREW.map((c) => (
            <button key={c.id} className="mate" onClick={() => pick(c.id)}>
              <img src={c.sprite} alt="" />
              <b>{c.emoji} {T('crew.name.' + c.id)}</b>
              <small>{T('mate.' + c.id, { s: MATES[c.id].battery, pct: Math.round(MATES[c.id].perSample * 100) })}</small>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------- ⛑️ Enfermería: elegir del kit lo que sirve para cada síntoma ----------
function MedicGame() {
  const T = useT()
  const [sym] = useState(() => [...SYMPTOMS].sort(() => Math.random() - 0.5).slice(0, 2))
  const [kit] = useState(() => [...KIT].sort(() => Math.random() - 0.5))
  const [sel, setSel] = useState([])
  const [checked, setChecked] = useState(false)
  const needs = sym.map((x) => x.fix)
  const right = sel.filter((id) => needs.includes(id)).length
  const wrong = sel.length - right
  const toggle = (id) => { if (checked) return; play('tick'); setSel((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id])) }
  const finish = () => { if (checked) return; setChecked(true); play(right === 2 && !wrong ? 'good' : 'deny') }
  useFinishAfter(checked, 1700, () => ({ right, wrong }))
  const mark = (id) => (!checked ? null : needs.includes(id) ? (sel.includes(id) ? '✅' : '⚠️') : sel.includes(id) ? '❌' : null)
  return (
    <Mini title={T('medic.title')} help={T(isTouch ? 'medic.help@touch' : 'medic.help')} done={checked && (right === 2 && !wrong ? T('medic.done') : T('medic.some', { ok: right }))}>
      <div className="symptoms">
        {sym.map((x) => <div key={x.id} className="symptom"><span>{x.icon}</span><b>{T('sym.' + x.id)}</b></div>)}
      </div>
      <div className="kit">
        {kit.map((k) => (
          <button key={k.id} className={'kit-item' + (sel.includes(k.id) ? ' on' : '')} onClick={() => toggle(k.id)} disabled={checked}>
            <span>{k.icon}</span><small>{T('kit.' + k.id)}</small>{mark(k.id) && <i>{mark(k.id)}</i>}
          </button>
        ))}
      </div>
      <div className="mini-foot">
        <span>{T('medic.chosen', { n: sel.length })}</span>
        <button className="btn primary" onClick={finish} disabled={checked || !sel.length}>✔ {T('plants.ok')}</button>
      </div>
    </Mini>
  )
}

// ---------- 🚴 Bici: pedalear parejo para mantener la velocidad en la zona verde ----------
const BIKE_SECONDS = 10
function BikeGame() {
  const T = useT()
  const easy = useGame((s) => s.easy)
  const [lo, hi] = easy ? [35, 75] : [45, 72]
  const [v, setV] = useState(10)
  const [time, setTime] = useState(0)
  const [inZone, setInZone] = useState(0)
  const [done, setDone] = useState(false)
  const vRef = useRef(10)
  const zoneRef = useRef(0)
  const endRef = useRef(false)
  useLoop((dt, total) => {
    vRef.current = Math.max(0, vRef.current - dt * 26)
    if (vRef.current >= lo && vRef.current <= hi) zoneRef.current += dt
    setV(vRef.current)
    setInZone(zoneRef.current)
    setTime(total)
    if (total >= BIKE_SECONDS && !endRef.current) { endRef.current = true; setDone(true); play(zoneRef.current >= 6 ? 'good' : 'deny') }
  }, !done)
  const pedal = () => { if (done) return; vRef.current = Math.min(100, vRef.current + 11); play('tick') }
  useActionKey(pedal)
  const ok = v >= lo && v <= hi
  useFinishAfter(done, 1300, () => ({ ratio: zoneRef.current / 7 }))
  return (
    <Mini title={T('bike.title')} help={T(isTouch ? 'bike.help@touch' : 'bike.help')} done={done && T('bike.done', { pct: Math.round(100 * Math.min(1, inZone / 7)) })}>
      <div className="bike">
        <div className="bike-meter">
          <div className="bike-zone" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />
          <div className={'bike-needle' + (ok ? ' ok' : '')} style={{ left: `${v}%` }} />
          <span className="bike-l">🐢</span><span className="bike-r">🚀</span>
        </div>
        <motion.button className="btn primary bike-btn" whileTap={{ scale: 0.9 }} onPointerDown={(e) => { e.preventDefault(); pedal() }} disabled={done}>
          <motion.span animate={{ rotate: v * 7.2 }}>🚴</motion.span> {T('bike.pedal')} {!isTouch && <kbd>␣</kbd>}
        </motion.button>
        <div className="mini-bar"><div style={{ width: `${(100 * time) / BIKE_SECONDS}%` }} /></div>
        <small>{T('bike.inZone', { s: inZone.toFixed(1) })}</small>
      </div>
    </Mini>
  )
}

// ---------- 🧊 Mina de hielo: frenar la mecha justo en la zona verde (3 intentos) ----------
function DrillGame() {
  const T = useT()
  const easy = useGame((s) => s.easy)
  const [tries, setTries] = useState([]) // true = acertó
  const [zone, setZone] = useState(() => ({ at: 30 + Math.random() * 45, w: easy ? 24 : 18 }))
  const [x, setX] = useState(0)
  const xRef = useRef(0)
  const hold = useRef(0) // un ratito quieta después de cada intento
  const done = tries.length >= 3
  useLoop((dt, total) => {
    if (hold.current > 0) { hold.current -= dt; return }
    const speed = easy ? 1.2 : 1.6 + tries.length * 0.25
    xRef.current = 50 + 48 * Math.sin(total * speed)
    setX(xRef.current)
  }, !done)
  const hit = () => {
    if (done || hold.current > 0) return
    const ok = x >= zone.at && x <= zone.at + zone.w // se compara con lo que se ve en pantalla (justo para el jugador)
    play(ok ? 'good' : 'deny')
    setTries((v) => [...v, ok])
    hold.current = 0.7
    setZone((z) => ({ at: 15 + Math.random() * 60, w: Math.max(12, z.w - 2) }))
  }
  useActionKey(hit)
  const hits = tries.filter(Boolean).length
  useFinishAfter(done, 1300, () => ({ hits }))
  return (
    <Mini title={T('drill.title')} help={T(isTouch ? 'drill.help@touch' : 'drill.help')} done={done && T('drill.done', { n: hits })}>
      <div className="drill">
        <div className="drill-bar">
          {!done && <div className="drill-zone" style={{ left: `${zone.at}%`, width: `${zone.w}%` }} />}
          <div className="drill-needle" style={{ left: `${x}%` }}>⛏️</div>
        </div>
        <div className="drill-tries">{[0, 1, 2].map((i) => <span key={i}>{tries[i] === undefined ? '⚪' : tries[i] ? '🧊' : '💥'}</span>)}</div>
        <motion.button className="btn primary" whileTap={{ scale: 0.92 }} onPointerDown={(e) => { e.preventDefault(); hit() }} disabled={done}>
          ⛏️ {T('drill.go')} {!isTouch && <kbd>␣</kbd>}
        </motion.button>
      </div>
    </Mini>
  )
}

// ---------- 🏗️ Obra: poner las piezas en orden, de abajo hacia arriba ----------
function AssembleGame() {
  const T = useT()
  const easy = useGame((s) => s.easy)
  const active = useGame((s) => s.build.active)
  const id = LAYERS[active] ? active : 'shelter'
  const layers = LAYERS[id]
  const [pieces] = useState(() => [...layers].sort(() => Math.random() - 0.5))
  const [placed, setPlaced] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [shake, setShake] = useState(null)
  const done = placed >= layers.length
  const pick = (p) => {
    if (done || layers.slice(0, placed).includes(p)) return
    if (p === layers[placed]) { play('good'); setPlaced((n) => n + 1) }
    else { play('deny'); setWrong((n) => n + 1); setShake(p); setTimeout(() => setShake(null), 400) }
  }
  useFinishAfter(done, 1300, () => ({ wrong }))
  return (
    <Mini title={T('asm.title', { b: T('asm.' + id) })} help={T(isTouch ? 'asm.help@touch' : 'asm.help')} done={done && (wrong === 0 ? T('asm.done') : T('asm.some', { n: wrong }))}>
      <div className="assemble">
        <div className="blueprint">
          {[...layers].reverse().map((l) => {
            const i = layers.indexOf(l)
            return (
              <div key={l} className={'bp-row' + (i < placed ? ' done' : i === placed ? ' now' : '')}>
                <span className="bp-icon">{i < placed || easy ? PIECES[l] : '❔'}</span>
                <small>{i + 1}. {T('piece.' + l)}</small>
              </div>
            )
          })}
        </div>
        <div className="pieces">
          {pieces.map((p) => (
            <motion.button key={p} className={'piece' + (layers.slice(0, placed).includes(p) ? ' used' : '')} animate={shake === p ? { x: [0, -8, 8, -6, 0] } : { x: 0 }} onClick={() => pick(p)} disabled={done}>
              <span>{PIECES[p]}</span><small>{T('piece.' + p)}</small>
            </motion.button>
          ))}
        </div>
      </div>
      <div className="mini-foot"><span>{T('asm.mistakes', { n: wrong })}</span></div>
    </Mini>
  )
}
