// 🛠️ Tarea física en la base: el comandante sale, camina hasta el problema y lo arregla.
// Se maneja igual que en la nave: tocar/click en el piso para caminar, W A S D o flechas,
// y E (o el botón ✋, o tocar el lugar marcado) para usar lo que está cerca.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { getCharacter } from '../game/characters'
import { TASKS, TASK_START, taskSpots, taskLimit, colliders, timeUpResult } from '../game/tasks'
import { terrainHeight } from './terrain'
import { t } from '../i18n/core'
import CharacterSprite from './CharacterSprite'
import { OutcomeSparks } from './effects'

const SPEED = 5.2
const REACH = 1.6 // a esta distancia del lugar ya se puede usar
const SCRUB_SECONDS = 1.3 // lo que tarda en limpiar un panel
const WORLD_R = 17

/** Posición del comandante (o del rover) durante la tarea (la leen la cámara, la flecha, el rover y las pruebas). */
export const taskPlayer = new THREE.Vector3(...TASK_START)
/** Hacia dónde mira el rover cuando lo maneja el jugador (radianes, 0 = hacia +z). */
export const taskPose = { heading: 0 }
const defOf = (s) => TASKS[s.task?.id] || {}
const go = (detail) => window.dispatchEvent(new CustomEvent('task-go', { detail }))

/** Empuja el punto fuera de los edificios (así se desliza alrededor del domo en vez de atravesarlo). */
function pushOut(p, cols, worldR = WORLD_R) {
  for (const [cx, cz, r] of cols) {
    const dx = p.x - cx, dz = p.z - cz
    const d = Math.hypot(dx, dz)
    if (d < r && d > 0.0001) { p.x = cx + (dx / d) * r; p.z = cz + (dz / d) * r }
  }
  const d = Math.hypot(p.x, p.z)
  if (d > worldR) { p.x *= worldR / d; p.z *= worldR / d }
}

/** El lugar pendiente más cercano (para la flecha y la tecla E). */
function nearestSpot(spots, p) {
  let best = null, bd = Infinity
  spots.forEach((sp) => {
    if (sp.done) return
    const d = Math.hypot(p.x - sp.stand[0], p.z - sp.stand[2])
    if (d < bd) { bd = d; best = sp }
  })
  return best ? { spot: best, dist: bd } : null
}

// ---------- Comandante manejable ----------
function TaskPlayer() {
  const player = useGame((s) => s.player)
  const ch = getCharacter(player.character)
  const busy = useGame((s) => s.task?.busy)
  const mini = useGame((s) => s.task?.mini)
  const { camera } = useThree()
  const group = useRef()
  const body = useRef()
  const ring = useRef()
  const marker = useRef()
  const keys = useRef({})
  const target = useRef(null)
  const pending = useRef(null)
  const moving = useRef(false)
  const clock = useRef(0) // segundos de tarea (se frena con la pausa: la escena deja de dibujarse)
  const pub = useRef(0)
  const scrubT = useRef(0)
  const [flip, setFlip] = useState(false)

  useEffect(() => {
    const s0 = useGame.getState()
    taskPlayer.set(...(defOf(s0).start || TASK_START))
    taskPose.heading = Math.PI
    const s = s0
    s.taskPatch({ started: true })
    const onGo = (ev) => {
      const d = ev.detail
      target.current = [d.x, d.z]
      pending.current = d.spot || null
      if (marker.current && !d.spot) { marker.current.position.set(d.x, 0.06, d.z); marker.current.material.opacity = 1 }
    }
    const down = (e) => {
      if (e.target?.tagName === 'INPUT') return
      const g = useGame.getState()
      if (g.paused || g.phase !== 'task' || g.task?.mini) return
      const k = e.key.toLowerCase()
      keys.current[k] = true
      if (k === 'e' || k === ' ' || k === 'enter') {
        const n = nearestSpot(taskSpots(g), taskPlayer)
        if (n && !n.spot.auto && n.dist < REACH + 0.4) g.taskAct(n.spot.id)
        e.preventDefault()
      }
    }
    const up = (e) => { keys.current[e.key.toLowerCase()] = false }
    window.addEventListener('task-go', onGo)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('task-go', onGo); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  useFrame((st, dt) => {
    const s = useGame.getState()
    const task = s.task
    if (!task) return
    dt = Math.min(dt, 0.1)
    const p = taskPlayer
    const k = keys.current
    const locked = !!task.mini || !!task.busy
    const def = defOf(s)
    const speed = def.speed || SPEED
    let mv = false
    // dirección de la cámara en el piso: así "arriba" siempre es hacia adelante en la pantalla
    const fwd = new THREE.Vector3()
    camera.getWorldDirection(fwd)
    fwd.y = 0
    fwd.normalize()
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x)
    const kx = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0)
    const kz = (k.w || k.arrowup ? 1 : 0) - (k.s || k.arrowdown ? 1 : 0)
    let dir = null
    if (!locked && (kx || kz)) {
      target.current = null
      pending.current = null
      dir = right.clone().multiplyScalar(kx).add(fwd.clone().multiplyScalar(kz)).normalize()
    } else if (!locked && target.current) {
      const dx = target.current[0] - p.x, dz = target.current[1] - p.z
      const dist = Math.hypot(dx, dz)
      const stop = pending.current ? 0.25 : 0.1
      // no pasarse del punto (con pocos cuadros por segundo un paso puede ser más largo que el margen)
      if (dist > stop) dir = new THREE.Vector3(dx / dist, 0, dz / dist).multiplyScalar(Math.min(1, dist / (speed * dt)))
      else {
        target.current = null
        if (pending.current) { const id = pending.current; pending.current = null; s.taskAct(id) }
      }
    }
    if (dir) {
      const prev = [p.x, p.z]
      p.x += dir.x * speed * dt
      p.z += dir.z * speed * dt
      pushOut(p, colliders(s), def.worldR)
      // trabado contra una pared (camino justo del otro lado del domo): rodear
      if (target.current && Math.hypot(p.x - prev[0], p.z - prev[1]) < speed * dt * 0.15) {
        p.x += -dir.z * speed * dt
        p.z += dir.x * speed * dt
        pushOut(p, colliders(s), def.worldR)
      }
      // el rover gira de a poco hacia donde va
      const want = Math.atan2(dir.x, dir.z) // (dir puede ser más corto que 1 al llegar; el ángulo es el mismo)
      let dh = want - taskPose.heading
      dh = Math.atan2(Math.sin(dh), Math.cos(dh))
      taskPose.heading += dh * Math.min(1, dt * 8)
      const side = dir.dot(right)
      if (Math.abs(side) > 0.2) { const f = side < 0; if (f !== flip) setFlip(f) }
      mv = true
    }
    moving.current = mv

    // limpiando un panel: el comandante se queda frotando y el panel queda limpio
    if (task.busy) {
      scrubT.current += dt
      if (scrubT.current >= SCRUB_SECONDS) {
        scrubT.current = 0
        const spot = taskSpots(s).find((sp) => sp.id === task.busy)
        const cleaned = spot ? [...task.cleaned, spot.panel] : task.cleaned
        s.taskPatch({ busy: null, cleaned, lastClean: spot?.panel ?? null })
        const total = s.panels
        if (cleaned.length >= total) setTimeout(() => useGame.getState().finishTask({ cleaned: cleaned.length, total }), 700)
      }
    }

    // reloj de la tarea: se publica 5 veces por segundo (no en cada cuadro, para no redibujar la interfaz de más)
    if (!(task.id === 'drive' && task.mini)) clock.current += dt // la batería no corre mientras se elige compañero
    pub.current += dt
    if (pub.current > 0.2) {
      pub.current = 0
      const n = nearestSpot(taskSpots(s), p)
      const near = n && !n.spot.auto && n.dist < REACH + 0.4 ? n.spot.id : null
      s.taskPatch({ elapsed: clock.current, near })
      // llegar al lugar o pasar por una muestra se activa solo, sin apretar nada
      if (n?.spot.auto && n.dist < (n.spot.small ? 1.5 : 2.2)) { target.current = null; pending.current = null; s.taskAct(n.spot.id) }
      const lim = taskLimit(s)
      if (lim && clock.current >= lim && !task.mini) s.finishTask(timeUpResult(useGame.getState()))
    }

    if (group.current) {
      group.current.position.set(p.x, terrainHeight(p.x, p.z), p.z)
      group.current.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - p.z)
    }
    if (body.current) {
      const scrub = task.busy ? Math.sin(st.clock.elapsedTime * 22) * 0.06 : 0
      body.current.position.y = mv ? Math.abs(Math.sin(st.clock.elapsedTime * 9)) * 0.08 : Math.abs(scrub)
      body.current.rotation.z = scrub
    }
    if (ring.current) ring.current.material.opacity = 0.45 + Math.sin(st.clock.elapsedTime * 3) * 0.15
    if (marker.current) marker.current.material.opacity = Math.max(0, marker.current.material.opacity - dt * 1.5)
  })

  const movingRef = useMemo(() => () => moving.current, [])
  const lang = useGame((s) => s.lang)
  const rover = useGame((s) => defOf(s).avatar === 'rover') // en la expedición se maneja el rover (lo dibuja Rover en baseParts)
  return (
    <>
      <group ref={group} position={TASK_START}>
        <group ref={body}>
          {!rover && <Suspense fallback={null}><CharacterSprite frames={ch.walk} movingRef={movingRef} height={2.6} flip={flip} /></Suspense>}
        </group>
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[0.5, 0.68, 40]} />
          <meshBasicMaterial color="#ffd166" transparent opacity={0.5} depthWrite={false} />
        </mesh>
        <Html pointerEvents="none" position={[0, rover ? 1.8 : 3.1, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          {busy ? <div className="bubble">{t(lang, 'task.scrubbing')}</div> : mini ? null : player.name ? <div className="name-tag">{rover ? '🚙' : '⭐'} {player.name}</div> : null}
        </Html>
      </group>
      <mesh ref={marker} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[0.3, 0.45, 32]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}

// ---------- Lugares marcados: haz de luz, anillo en el piso e ícono que se puede tocar ----------
function Spot({ spot, icon, label, current }) {
  const gy = terrainHeight(spot.stand[0], spot.stand[2])
  const ay = terrainHeight(spot.at[0], spot.at[2])
  const beam = useRef()
  const ring = useRef()
  useFrame((st) => {
    const k = 0.5 + Math.sin(st.clock.elapsedTime * 4) * 0.5
    if (beam.current) beam.current.material.opacity = current ? 0.18 + k * 0.17 : 0.12
    if (ring.current) { ring.current.scale.setScalar(1 + k * 0.25); ring.current.material.opacity = 0.9 - k * 0.5 }
  })
  const onTap = (e) => { e.stopPropagation?.(); go({ x: spot.stand[0], z: spot.stand[2], spot: spot.id }) }
  return (
    <group>
      <mesh ref={beam} position={[spot.at[0], ay + (spot.small ? 2 : 5), spot.at[2]]}>
        <cylinderGeometry args={spot.small ? [0.2, 0.2, 4, 10, 1, true] : [0.35, 0.35, 10, 16, 1, true]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0.25} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[spot.stand[0], gy + 0.05, spot.stand[2]]}>
        <ringGeometry args={[0.55, 0.75, 32]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0.7} depthWrite={false} />
      </mesh>
      {/* zona grande y fácil de tocar */}
      {spot.small && (
        <mesh position={[spot.stand[0], gy + 0.35, spot.stand[2]]} rotation={[0.4, 0.8, 0.2]}>
          <octahedronGeometry args={[0.35, 0]} />
          <meshStandardMaterial color="#ffe08a" emissive="#ffb347" emissiveIntensity={0.9} />
        </mesh>
      )}
      <mesh position={[spot.stand[0], gy + 0.6, spot.stand[2]]} onPointerDown={onTap}>
        <cylinderGeometry args={[1.1, 1.1, 1.2, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[spot.at[0], ay + spot.at[1] + 1.3, spot.at[2]]} center zIndexRange={[12, 0]}>
        <button className={'spot-tag' + (current ? ' on' : '')} onPointerDown={onTap} aria-label={label}>
          <span>{icon}</span>{current && <b>{label}</b>}
        </button>
      </Html>
    </group>
  )
}

function Spots() {
  const s = useGame()
  const spots = taskSpots(s)
  const def = TASKS[s.task.id]
  const n = nearestSpot(spots, taskPlayer)
  const icons = { collect: '🪨', talk: '💬', arrive: '🚩', pick: '🪨', home: '🏠' }
  return spots.filter((sp) => !sp.done).map((sp) => (
    <Spot key={sp.id} spot={sp} icon={icons[sp.act] || def.icon} label={t(s.lang, 'task.act.' + sp.act)} current={n?.spot.id === sp.id} />
  ))
}

// ---------- Flecha en el piso que apunta hacia donde hay que ir ----------
function GuideArrow() {
  const ref = useRef()
  const shape = useMemo(() => {
    const sh = new THREE.Shape()
    sh.moveTo(0, 0.55); sh.lineTo(0.42, 0); sh.lineTo(0.16, 0); sh.lineTo(0.16, -0.45); sh.lineTo(-0.16, -0.45); sh.lineTo(-0.16, 0); sh.lineTo(-0.42, 0); sh.closePath()
    return sh
  }, [])
  useFrame((st) => {
    const g = ref.current
    if (!g) return
    const s = useGame.getState()
    const n = s.task && !s.task.mini && !s.task.busy ? nearestSpot(taskSpots(s), taskPlayer) : null
    g.visible = !!n && n.dist > (n.spot.auto ? 2.4 : REACH + 0.6)
    if (!g.visible) return
    const a = Math.atan2(n.spot.stand[0] - taskPlayer.x, n.spot.stand[2] - taskPlayer.z)
    const bob = 1.25 + Math.sin(st.clock.elapsedTime * 5) * 0.12
    const gx = taskPlayer.x + Math.sin(a) * bob, gz = taskPlayer.z + Math.cos(a) * bob
    g.position.set(gx, terrainHeight(gx, gz) + 0.08, gz)
    g.rotation.set(-Math.PI / 2, 0, a + Math.PI)
  })
  return (
    <mesh ref={ref} renderOrder={5}>
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial color="#ffd166" transparent opacity={0.9} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
    </mesh>
  )
}

// ---------- Piso: tocar para caminar ----------
function Ground() {
  const r = useGame((s) => defOf(s).worldR || WORLD_R)
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} onPointerDown={(e) => { e.stopPropagation(); go({ x: e.point.x, z: e.point.z }) }}>
      <circleGeometry args={[r + 4, 48]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

// ---------- Cámara: sigue al comandante desde arriba y atrás ----------
function TaskCamera() {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3(0, 1.5, 0))
  const pos = useRef(null)
  useFrame((_, dt) => {
    const k = (size.width / size.height < 1.4 ? 1.25 : 1) * (defOf(useGame.getState()).avatar === 'rover' ? 1.35 : 1) // más lejos en pantallas angostas y con el rover
    const gy = terrainHeight(taskPlayer.x, taskPlayer.z)
    const want = new THREE.Vector3(taskPlayer.x, gy + 9.5 * k, taskPlayer.z + 11 * k)
    if (!pos.current) pos.current = camera.position.clone()
    pos.current.lerp(want, Math.min(1, dt * 2.2))
    camera.position.copy(pos.current)
    look.current.lerp(new THREE.Vector3(taskPlayer.x, gy + 1, taskPlayer.z - 1.5), Math.min(1, dt * 3))
    camera.lookAt(look.current)
  })
  return null
}

// ---------- Brillito cuando se limpia un panel ----------
function CleanSparks() {
  const last = useGame((s) => s.task?.lastClean)
  const cleaned = useGame((s) => s.task?.cleaned?.length || 0)
  if (last === null || last === undefined) return null
  const sp = taskSpots(useGame.getState()).find((x) => x.panel === last)
  if (!sp) return null
  return <OutcomeSparks key={cleaned} position={[sp.at[0], 0.6, sp.at[2]]} good count={40} radius={1.4} />
}

/** Todo lo de la tarea física (se monta solo mientras dura). */
export default function BaseTask() {
  const id = useGame((s) => (s.phase === 'task' ? s.task?.id : null))
  if (!id) return null
  return (
    <>
      <TaskCamera />
      <Ground />
      <Spots />
      <GuideArrow />
      <TaskPlayer />
      {id === 'clean' && <CleanSparks />}
    </>
  )
}
