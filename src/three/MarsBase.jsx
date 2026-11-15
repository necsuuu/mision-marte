import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { Terrain, Rocks } from './terrain'
import { Builds, ExpeditionSites, activeSite, sitePos } from './builds'
import { Shield, SolarParticles, DustParticles, Meteor, OutcomeSparks, DustBurst, SupplyDrop } from './effects'
import { Habitat, Greenhouse, SolarArray, Antenna, Rover, Discoveries, IceMine, Samples, Lander, Crew, POS, DOME_SPOTS, useActiveEvent } from './baseParts'
import { cine, ease } from './cine'
import Reflections from './Reflections'
import BaseTask from './BaseTask'

const BASE_TARGET = new THREE.Vector3(0, 1.5, 0)
import { CINE_END } from '../game/clocks'

// ---------- Tomas de cámara para cada evento ----------
const SHOTS = {
  dome: () => ({ target: [0, 1.8, 0], cam: [9.5, 4.8, 4.5] }),
  panels: () => ({ target: [7.5, 1.2, -1], cam: [14, 6, 7] }),
  greenhouse: () => ({ target: [-7.5, 1, 1.5], cam: [-2.5, 4.5, 9] }),
  rover: (ev) => {
    if (ev.expedition) {
      // expedición: primero una vista amplia de los alrededores; en el resultado, el lugar elegido
      const site = activeSite()
      if (!site) return { target: [0, 2, 0], cam: [-20, 15, 24] }
      const p = sitePos(site)
      const k = 1 - (site === 'hill' ? 15 : 10) / Math.hypot(p[0], p[2]) // la cámara se para entre la base y el lugar, mirando hacia afuera
      return { target: [p[0], p[1] + 1.2, p[2]], cam: [p[0] * k, p[1] + 4.5, p[2] * k] }
    }
    const p = ev.id === 'ice' ? POS.ice : POS.rock
    return { target: [p[0], 0.8, p[2]], cam: [p[0] + 6, 4.5, p[2] + 7] }
  },
  antenna: () => ({ target: [3.5, 3.2, -6.5], cam: [10, 6, 1] }),
  sky: () => ({ target: [30, 8, 20], cam: [-4, 4, -2] }),
  supply: () => ({ target: [POS.supply[0], 2.2, POS.supply[2]], cam: [POS.supply[0] + 7, 4.2, POS.supply[2] + 8] }),
}
const GOOD_FX = new Set(['watered', 'found', 'supply', 'patched', 'cleaned', 'icemine', 'study', 'uv', 'healed', 'rest', 'reply', 'fixed', 'panelfixed', 'sample', 'sunset', 'fewerplants'])

// En pantallas anchas corre la imagen a la izquierda para que el panel no tape la base
function ViewShift({ enabled }) {
  const { camera, size } = useThree()
  useEffect(() => {
    camera.position.set(16, 9, 20)
    camera.lookAt(0, 1.5, 0)
  }, [camera])
  useEffect(() => {
    if (enabled && size.width > 760) camera.setViewOffset(size.width, size.height, size.width * 0.2, 0, size.width, size.height)
    else camera.clearViewOffset()
    camera.updateProjectionMatrix()
  }, [camera, size, enabled])
  return null
}

// ---------- Cielo, luz y ciclo día/noche ----------
function SkyAndLight({ cinematic }) {
  const { scene } = useThree()
  const dust = useGame((s) => (s.dust.sols > 0 ? s.dust.level : 0))
  const storm = useGame((s) => s.plan[s.sol - 1]?.level || 0)
  const phase = useGame((s) => s.phase)
  const onSol = useGame((s) => s.screen === 'sol')
  const act = useActiveEvent()
  const dustEv = act?.ev.id === 'dust' && act.phase !== 'outcome' ? 0.6 : act?.fx === 'dusty' ? 0.5 : 0
  const dustAll = Math.max(dust, dustEv)
  const sunset = act?.ev.id === 'sunset'
  const stormActive = onSol && storm > 0 && ['event', 'plan', 'report'].includes(phase)
  const day = useRef(phase === 'report' ? 0.15 : 1)
  const sun = useRef(), hemi = useRef(), stars = useRef(), sunMesh = useRef()
  const bg = useMemo(() => new THREE.Color(), [])
  const fog = useMemo(() => new THREE.Fog('#d9925f', 45, 170), [])
  const tmp = useMemo(() => new THREE.Color(), [])
  useEffect(() => {
    scene.background = bg
    scene.fog = fog
    return () => { scene.background = null; scene.fog = null }
  }, [scene, bg, fog])
  useFrame((_, dt) => {
    const target = cinematic ? 1 : phase === 'report' ? 0.12 : sunset ? 0.5 : 1
    const rate = phase === 'dawn' ? 1.3 : 2
    day.current += (target - day.current) * Math.min(1, dt * rate)
    const d = day.current
    bg.set('#0c0f22').lerp(tmp.set(sunset ? '#b86a54' : '#d9925f'), d)
    if (sunset) bg.lerp(tmp.set('#5c7fb0'), 0.18)
    if (dustAll) bg.lerp(tmp.set('#8a5634'), dustAll * d)
    if (stormActive) bg.lerp(tmp.set('#5a1f3a'), 0.25 + storm * 0.12)
    fog.color.copy(bg)
    fog.near = dustAll ? 18 : 45
    fog.far = dustAll ? 80 - dustAll * 35 : d < 0.4 ? 120 : 170
    if (sun.current) {
      sun.current.intensity = 2.4 * d * (1 - dustAll * 0.6)
      sun.current.position.set(30, 8 + 34 * d, 20)
    }
    if (sunMesh.current) { sunMesh.current.position.set(60, 4 + 76 * d, 40); sunMesh.current.visible = d > 0.3 }
    if (hemi.current) hemi.current.intensity = 0.15 + 0.55 * d
    if (stars.current) stars.current.visible = d < 0.55
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={['#ffd9b8', '#5a2a14', 0.65]} />
      <ambientLight intensity={0.08} />
      <Reflections kind="mars" intensity={0.3} />
      <directionalLight
        ref={sun}
        position={[30, 40, 20]}
        intensity={2.2}
        color="#fff0dc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      <mesh ref={sunMesh} position={[60, 80, 40]}>
        <sphereGeometry args={[2.2, 16, 16]} />
        <meshBasicMaterial color={sunset ? '#dff1ff' : '#fff7e0'} fog={false} />
      </mesh>
      <group ref={stars}><Stars radius={150} depth={30} count={2500} factor={3} fade /></group>
      {stormActive && <SolarParticles level={storm} />}
      {dustAll > 0 && <DustParticles level={Math.min(0.8, dustAll + 0.2)} />}
    </>
  )
}

// ---------- Director de cámara: muestra el problema y después pasea por el resultado ----------
function Director({ controls }) {
  const { camera } = useThree()
  const act = useActiveEvent()
  const look = useRef(new THREE.Vector3(0, 1.5, 0))
  const started = useRef({ key: '', t: 0 })
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame((st, dt) => {
    const c = controls.current
    // 🛠️ tarea física: la cámara la maneja BaseTask (sigue al comandante)
    if (act?.phase === 'task') { if (c) c.enabled = false; return }
    const scripted = !!act
    if (!scripted) {
      if (c) {
        c.enabled = true
        c.target.lerp(BASE_TARGET, Math.min(1, dt * 1.5))
      }
      return
    }
    if (c) c.enabled = false
    const shot = SHOTS[act.ev.scene](act.ev)
    const key = act.ev.id + act.phase
    if (started.current.key !== key) started.current = { key, t: st.clock.elapsedTime }
    const el = st.clock.elapsedTime - started.current.t
    const [tx, ty, tz] = shot.target
    const [cx, cy, cz] = shot.cam
    if (act.phase === 'outcome') {
      // Paneo general alrededor del lugar
      const rx = cx - tx, rz = cz - tz
      const radius = Math.hypot(rx, rz) * 1.35
      const a0 = Math.atan2(rz, rx)
      const a = a0 - 0.8 + ease(Math.min(1, el / 6)) * 1.6
      v.set(tx + Math.cos(a) * radius, cy * 1.35, tz + Math.sin(a) * radius)
    } else {
      v.set(cx, cy, cz)
    }
    camera.position.lerp(v, Math.min(1, dt * 2))
    look.current.lerp(v.set(tx, ty, tz), Math.min(1, dt * 3))
    camera.lookAt(look.current)
    if (c) c.target.copy(look.current)
  })
  return null
}

// 📦 Cápsula de carga: cae en el evento de mitad de misión y después queda en la base
function Supply() {
  const act = useActiveEvent()
  const arrived = useGame((s) => s.screen !== 'landing' && s.decisions.some((d) => d.ev.id === 'supply'))
  const dropping = act?.ev.incident === 'supply'
  if (!dropping && !arrived) return null
  return <SupplyDrop position={POS.supply} drop={dropping} />
}

// Efectos puntuales del evento (meteorito, brillitos del resultado)
function EventFx() {
  const act = useActiveEvent()
  if (!act) return null
  const shot = SHOTS[act.ev.scene](act.ev)
  return (
    <>
      {act.ev.incident === 'meteor' && act.phase === 'incident' && <Meteor key={'m' + act.ev.id} target={DOME_SPOTS[0]} />}
      {act.phase === 'outcome' && act.fx && (
        <OutcomeSparks key={act.fx} position={[shot.target[0], 0.2, shot.target[2]]} good={GOOD_FX.has(act.fx)} radius={act.ev.scene === 'dome' ? 4 : 2.5} />
      )}
    </>
  )
}

// ---------- Cinemática de aterrizaje ----------
const KEYS = [
  [0, [-40, 12, 30], [-10, 60, -8.5]],
  [4.5, [-32, 9, 22], [-10, 13, -8.5]],
  [7.6, [-24, 5, 14], [-10, 2.5, -8.5]],
  [9.5, [-6, 10, 22], [-3, 1, -2]],
  [13, [14, 8, 16], [2, 1, 0]],
  [CINE_END, [16, 9, 20], [0, 1.5, 0]],
]
function CineCamera() {
  const { camera } = useThree()
  const p = useMemo(() => new THREE.Vector3(), [])
  const l = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const t = Math.min(cine.t, CINE_END)
    let i = 0
    while (i < KEYS.length - 2 && t > KEYS[i + 1][0]) i++
    const [t0, p0, l0] = KEYS[i]
    const [t1, p1, l1] = KEYS[i + 1]
    const k = ease(Math.max(0, Math.min(1, (t - t0) / (t1 - t0))))
    p.set(...p0).lerp(new THREE.Vector3(...p1), k)
    l.set(...l0).lerp(new THREE.Vector3(...l1), k)
    // temblor al encender los retrocohetes y al aterrizar
    const shake = t > 4.5 && t < 8 ? 0.12 : 0
    camera.position.set(p.x + (Math.random() - 0.5) * shake, p.y + (Math.random() - 0.5) * shake, p.z)
    camera.lookAt(l)
  })
  return null
}

function CineClock({ onDone }) {
  const done = useRef(false)
  useEffect(() => {
    cine.active = true
    cine.t = 0
    return () => { cine.active = false }
  }, [])
  useFrame((_, dt) => {
    cine.t += Math.min(dt, 0.1)
    if (cine.t >= CINE_END + 0.3 && !done.current) { done.current = true; onDone?.() }
  })
  return null
}

const dustAmount = () => {
  if (!cine.active) return 0
  const t = cine.t
  if (t < 6) return 0
  if (t < 7.7) return (t - 6) / 1.7
  return Math.max(0, 1 - (t - 7.7) / 3.5)
}

export default function MarsBase({ cinematic = false, onCineDone }) {
  const controls = useRef()
  const night = useGame((s) => s.screen === 'sol' && s.phase === 'report')
  const onTask = useGame((s) => s.phase === 'task')
  return (
    <>
      <ViewShift enabled={!cinematic && !onTask} />
      <SkyAndLight cinematic={cinematic} />
      <Terrain />
      <Rocks />
      <Habitat night={night} />
      <Greenhouse night={night} />
      <SolarArray />
      <Antenna />
      <Rover />
      <Discoveries />
      <IceMine />
      <Samples />
      <Builds />
      <ExpeditionSites />
      <Lander />
      <Crew />
      {cinematic ? (
        <>
          <CineClock onDone={onCineDone} />
          <CineCamera />
          <DustBurst position={[POS.lander[0], 0.3, POS.lander[2]]} amountRef={dustAmount} />
        </>
      ) : (
        <>
          <Shield />
          <EventFx />
          <Supply />
          <BaseTask />
          <OrbitControls
            ref={controls}
            makeDefault
            target={[0, 1.5, 0]}
            autoRotate
            autoRotateSpeed={0.35}
            enablePan={false}
            minDistance={10}
            maxDistance={45}
            maxPolarAngle={Math.PI / 2.15}
          />
          <Director controls={controls} />
        </>
      )}
    </>
  )
}
