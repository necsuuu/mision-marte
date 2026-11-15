// 🛠️ Interfaz de la tarea física: qué hay que hacer, el botón para usar lo que está cerca
// y los desafíos que se abren al llegar (sellar una grieta, reconectar cables, elegir plantas).
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/store'
import { TASKS, taskSpots, taskLimit, leakLoss, CIRCUIT_WIRES, PLANT_GRID } from '../game/tasks'
import { isTouch } from '../game/device'
import { play } from '../game/sfx'
import { useSpeak } from '../game/voice'
import { useT } from '../i18n/useT'

export default function TaskUI() {
  const task = useGame((s) => s.task)
  if (!task) return null
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
      </AnimatePresence>
    </>
  )
}

// ---------- Cartel de arriba: qué hacer, cuánto falta y "que lo haga la tripulación" ----------
function TaskBanner() {
  const T = useT()
  const s = useGame()
  const task = s.task
  const def = TASKS[task.id]
  const spots = taskSpots(s)
  const near = spots.find((p) => p.id === task.near)
  const lim = taskLimit(s)
  const left = lim ? Math.max(0, Math.ceil(lim - task.elapsed)) : null
  const goal = near ? T('task.at', { act: T('task.act.' + near.act) }) : T('task.goal.' + task.id)
  useSpeak(T('task.goal.' + task.id))
  return (
    <motion.div className="task-banner" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <span className="task-icon">{def.icon}</span>
      <b className="task-goal">{goal}</b>
      <div className="task-meters">
        {task.id === 'seal' && <span className="ko">{T('task.o2lost', { n: leakLoss(s, task.elapsed) })}</span>}
        {task.id === 'clean' && <span>{T('task.panels', { a: task.cleaned.length, b: s.panels })}</span>}
        {left !== null && (
          <span className={'task-time' + (left <= 10 ? ' ko' : '')}>
            ⏱️ {left}s
            <i style={{ width: `${(left / lim) * 100}%` }} />
          </span>
        )}
      </div>
      <button className="task-crew" onClick={() => s.finishTask({ crew: true })} title={T('task.crewDoWhy')}>🤖 {T('task.crewDo')}</button>
    </motion.div>
  )
}

function ActButton() {
  const T = useT()
  const s = useGame()
  const spot = taskSpots(s).find((p) => p.id === s.task.near)
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
    const tm = setTimeout(() => useGame.getState().finishTask(fn.current()), ms)
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
    setTimeout(() => useGame.getState().finishTask({ right, wrong, missed }), 1600)
  }
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
