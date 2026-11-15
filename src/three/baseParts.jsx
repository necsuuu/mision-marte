// Piezas de la base marciana. Muchas cambian según las decisiones del jugador (estado "base" del store).
import { Suspense, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { rng } from './noise'
import { terrainHeight } from './terrain'
import { useGame } from '../game/store'
import { getCharacter, CREW } from '../game/characters'
import CharacterSprite from './CharacterSprite'
import { Deploy, cine } from './cine'
import { LeakJet, AlarmBeacon, RetroFlame } from './effects'

// ---------- Posiciones importantes ----------
export const POS = {
  dome: [0, 0, 0],
  greenhouse: [-7.5, 0, 1.5],
  panels: [7.5, 0, -2],
  antenna: [3.5, 0, -6.5],
  lander: [-10, 0, -8.5],
  ice: [9.5, 0, 8.5],
  rock: [-4, 0, 11],
  home: [5.2, 0, 4.6], // donde se para el comandante
  supply: [1.5, 0, 9.5], // donde cae la cápsula de carga de mitad de misión
}
// Puntos del domo donde pegan meteoritos / van los parches
const R = 3.2
const onDome = (x, y, z) => { const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(R); return [v.x, v.y, v.z] }
export const DOME_SPOTS = [onDome(0.55, 0.6, 0.58), onDome(-0.5, 0.65, 0.6), onDome(0.75, 0.4, -0.5), onDome(0.1, 0.9, 0.4)]

/** Evento activo (si estamos mostrando el problema, decidiendo o viendo el resultado). */
export function useActiveEvent() {
  const card = useGame((s) => s.cards[0])
  const phase = useGame((s) => s.phase)
  const screen = useGame((s) => s.screen)
  const fx = useGame((s) => s.cardResult?.fx || null)
  const live = screen === 'sol' && card?.type === 'event' && ['incident', 'decision', 'outcome'].includes(phase)
  return useMemo(() => (live ? { ev: card.event, phase, fx } : null), [live, card, phase, fx])
}

// ---------- Hábitat ----------
function Patch({ at }) {
  const ref = useRef()
  useFrame(() => { if (ref.current) ref.current.lookAt(0, 0, 0) })
  return (
    <mesh ref={ref} position={at}>
      <boxGeometry args={[0.8, 0.8, 0.1]} />
      <meshStandardMaterial color="#9a9488" metalness={0.6} roughness={0.4} />
    </mesh>
  )
}

export function Habitat({ night }) {
  const health = useGame((s) => s.health)
  const o2 = useGame((s) => s.o2)
  const patches = useGame((s) => s.base.patches)
  const leak = useGame((s) => s.base.leak)
  const act = useActiveEvent()
  const leakShown = leak || (act?.ev.id === 'leak' && (act.phase !== 'outcome' || act.fx === 'leaking'))
  const alarm = o2 < 25 || health < 40 || (act && act.ev.incident === 'alarm' && act.phase !== 'outcome')
  const windowColor = health > 40 ? '#7fe9ff' : '#ff6b6b'
  const hole = DOME_SPOTS[0]
  return (
    <group>
      <Deploy start={8} dur={1.6} mode="inflate">
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[R, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ece6dc" roughness={0.8} metalness={0} userData={{ surf: 'tela' }} />
        </mesh>
        {[0.6, 1.4, 2.2].map((y, i) => (
          <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[Math.sqrt(R * R - y * y) + 0.02, 0.05, 8, 64]} />
            <meshStandardMaterial color="#b9b2a6" />
          </mesh>
        ))}
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[3.09, 3.0, 0.32, 48, 1, true]} />
          <meshStandardMaterial color={windowColor} emissive={windowColor} emissiveIntensity={night ? 3 : 1.4} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        {/* agujero del meteorito */}
        {leakShown && (
          <mesh position={hole}>
            <sphereGeometry args={[0.28, 10, 10]} />
            <meshBasicMaterial color="#1a1a1a" />
          </mesh>
        )}
        {Array.from({ length: Math.min(patches, DOME_SPOTS.length) }).map((_, i) => <Patch key={i} at={DOME_SPOTS[i]} />)}
      </Deploy>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[3.5, 3.7, 0.25, 48]} />
        <meshStandardMaterial color="#8d857a" roughness={0.9} />
      </mesh>
      <Deploy start={8.6} dur={0.8} mode="grow">
        <mesh position={[0, 0.8, 3.4]} castShadow>
          <boxGeometry args={[1.4, 1.6, 1.4]} />
          <meshStandardMaterial color="#d9d2c6" />
        </mesh>
        <mesh position={[0, 0.8, 4.11]}>
          <circleGeometry args={[0.45, 24]} />
          <meshStandardMaterial color="#ffb347" emissive="#ff8c1a" emissiveIntensity={night ? 2 : 0.8} />
        </mesh>
      </Deploy>
      {leakShown && <LeakJet position={hole} normal={hole} strength={leak ? 0.7 : 1} />}
      {alarm && <AlarmBeacon position={[0, R + 0.25, 0]} />}
      {night && <pointLight position={[0, 1.5, 5]} color="#ffcf8a" intensity={18} distance={12} />}
    </group>
  )
}

// ---------- Invernadero ----------
export function Greenhouse({ night }) {
  const food = useGame((s) => s.food)
  const seeds = useGame((s) => !!s.inventory.seeds)
  const gh = useGame((s) => s.alloc.greenhouse)
  const lost = useGame((s) => s.base.plantsLost)
  const uv = useGame((s) => s.base.uvGlow)
  const act = useActiveEvent()
  const sick = act?.ev.id === 'blight' && act.phase !== 'outcome'
  const uvNow = uv || (act?.ev.id === 'blight' && act.fx === 'uv')
  const plantsRef = useRef()
  const N = 40
  const visible = seeds ? Math.max(4, Math.round(((food - lost) / 100) * N)) : 0
  const pts = useMemo(() => {
    const r = rng(7)
    return Array.from({ length: N }, () => {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 1.7
      return [Math.cos(a) * d, Math.sin(a) * d, 0.5 + r() * 0.6]
    })
  }, [])
  const o = useMemo(() => new THREE.Object3D(), [])
  useFrame((st) => {
    const m = plantsRef.current
    if (!m) return
    for (let i = 0; i < N; i++) {
      const [x, z, s] = pts[i]
      o.position.set(x, 0.35, z)
      o.rotation.z = sick ? Math.sin(st.clock.elapsedTime * 2 + i) * 0.25 + 0.3 : 0
      o.scale.setScalar(i < visible ? s * (sick ? 0.8 : 1) : 0.0001)
      o.updateMatrix()
      m.setMatrixAt(i, o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })
  const glow = 0.25 + gh * 0.35 + (night ? 0.5 : 0)
  const plantColor = sick ? '#c9b23a' : '#58c26a'
  return (
    <group position={POS.greenhouse}>
      <Deploy start={9.4} dur={0.8} mode="grow">
        <mesh position={[3.1, 0.6, -0.5]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.55, 0.55, 2.6, 16]} />
          <meshStandardMaterial color="#d9d2c6" />
        </mesh>
      </Deploy>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[2.3, 2.4, 0.18, 40]} />
        <meshStandardMaterial color="#6f675d" />
      </mesh>
      <Deploy start={9.9} dur={1.2} mode="inflate">
        <instancedMesh ref={plantsRef} args={[null, null, N]}>
          <coneGeometry args={[0.18, 0.6, 6]} />
          <meshStandardMaterial color={plantColor} emissive={sick ? '#5a4a00' : '#2f8f3f'} emissiveIntensity={0.4} />
        </instancedMesh>
        <pointLight position={[0, 1.2, 0]} color={uvNow ? '#b04bff' : '#d06bff'} intensity={uvNow ? 40 : glow * 8} distance={uvNow ? 9 : 6} />
        <mesh>
          <sphereGeometry args={[2.3, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={uvNow ? '#d7b5ff' : '#bff5e3'} transparent opacity={0.28} roughness={0.05} metalness={0.2} emissive={uvNow ? '#9b4dff' : '#7cffc4'} emissiveIntensity={uvNow ? 0.8 : glow * 0.25} depthWrite={false} />
        </mesh>
      </Deploy>
    </group>
  )
}

// ---------- Paneles solares ----------
function OnePanel({ i, broken, shaking, color, dust }) {
  const ref = useRef()
  const spark = useRef()
  useFrame((st) => {
    const t = st.clock.elapsedTime
    if (ref.current) {
      ref.current.rotation.x = broken ? -1.2 : -0.55 + (shaking ? Math.sin(t * 30) * 0.15 : 0)
      ref.current.rotation.z = broken ? 0.4 : shaking ? Math.sin(t * 23) * 0.08 : 0
    }
    if (spark.current) spark.current.intensity = broken && Math.sin(t * 9 + i) > 0.85 ? 25 : 0
  })
  const row = Math.floor(i / 3), col = i % 3
  return (
    <Deploy start={10.4 + i * 0.35} dur={0.6} mode="pop" position={[col * 2.2 - 2.2, 0, row * 2.6]}>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 1.2, 8]} />
        <meshStandardMaterial color="#8a8a8a" metalness={0.6} />
      </mesh>
      <mesh ref={ref} position={[0, 1.25, 0]} castShadow>
        <boxGeometry args={[1.9, 0.06, 1.3]} />
        <meshStandardMaterial color={broken ? '#2a2a2a' : color} metalness={0.5} roughness={0.25} emissive="#0b1f66" emissiveIntensity={broken ? 0 : 0.25 * (1 - dust)} />
      </mesh>
      <pointLight ref={spark} position={[0.5, 1.5, 0.3]} color="#ffe27a" intensity={0} distance={4} />
    </Deploy>
  )
}

export function SolarArray() {
  const panels = useGame((s) => s.panels)
  const broken = useGame((s) => s.base.brokenPanels)
  const dustState = useGame((s) => (s.dust.sols > 0 ? s.dust.level : 0))
  const act = useActiveEvent()
  const dustEvent = act?.ev.id === 'dust' && act.phase !== 'outcome' ? 0.55 : 0
  const dust = Math.max(dustState, dustEvent)
  const shaking = act?.ev.id === 'panelbreak' && act.phase !== 'outcome'
  const color = new THREE.Color('#1d3b8f').lerp(new THREE.Color('#9a5a34'), dust * 1.3)
  const total = panels + broken
  return (
    <group position={POS.panels}>
      {Array.from({ length: total }).map((_, i) => (
        <OnePanel key={i} i={i} broken={i >= panels} shaking={shaking && i === panels - 1} color={color} dust={dust} />
      ))}
    </group>
  )
}

// ---------- Antena ----------
export function Antenna() {
  const dish = useRef()
  const pulse = useRef()
  const act = useActiveEvent()
  const talking = act?.ev.id === 'message'
  useFrame((st, dt) => {
    if (dish.current) dish.current.rotation.y += dt * (talking ? 2 : 0.4)
    if (pulse.current) {
      const t = (st.clock.elapsedTime * 0.7) % 1
      pulse.current.scale.setScalar(0.5 + t * 8)
      pulse.current.material.opacity = talking ? (1 - t) * 0.9 : 0
    }
  })
  return (
    <Deploy start={11.8} dur={1} mode="rise" position={POS.antenna}>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.1, 0.16, 2.8, 8]} />
        <meshStandardMaterial color="#9a9a9a" metalness={0.6} />
      </mesh>
      <group ref={dish} position={[0, 2.9, 0]}>
        <mesh rotation={[-0.9, 0, 0]}>
          <sphereGeometry args={[1, 24, 12, 0, Math.PI * 2, 0, 0.9]} />
          <meshStandardMaterial color="#f0f0f0" side={THREE.DoubleSide} metalness={0.3} roughness={0.4} />
        </mesh>
      </group>
      <mesh ref={pulse} position={[0, 3.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.04, 8, 48]} />
        <meshBasicMaterial color="#7fe9ff" transparent opacity={0} toneMapped={false} />
      </mesh>
    </Deploy>
  )
}

// ---------- Rover ----------
export function Rover() {
  const ref = useRef()
  const drill = useRef()
  const act = useActiveEvent()
  const goal = act && (act.ev.id === 'ice' || act.ev.id === 'rock') ? (act.ev.id === 'ice' ? POS.ice : POS.rock) : null
  const ang = useRef(0)
  useFrame((st, dt) => {
    const g = ref.current
    if (!g) return
    if (goal) {
      const tx = goal[0] - 1.6, tz = goal[2]
      g.position.x += (tx - g.position.x) * Math.min(1, dt * 1.5)
      g.position.z += (tz - g.position.z) * Math.min(1, dt * 1.5)
      g.position.y = terrainHeight(g.position.x, g.position.z) + 0.35
      g.rotation.y = 0
      if (drill.current) { drill.current.visible = true; drill.current.rotation.y += dt * 20 }
    } else {
      ang.current += dt * 0.08
      const r = 17
      const x = Math.cos(ang.current) * r, z = Math.sin(ang.current) * r
      g.position.x += (x - g.position.x) * Math.min(1, dt * 1.2)
      g.position.z += (z - g.position.z) * Math.min(1, dt * 1.2)
      g.position.y = terrainHeight(g.position.x, g.position.z) + 0.35
      g.rotation.y = -ang.current
      if (drill.current) drill.current.visible = false
    }
    // durante la cinemática sale de la nave
    if (cine.active) {
      const p = Math.max(0, Math.min(1, (cine.t - 13) / 1.8))
      g.visible = cine.t > 13
      g.position.set(POS.lander[0] + 2 + p * 8, 0.35, POS.lander[2] + 3 + p * 5)
    } else g.visible = true
  })
  return (
    <group ref={ref} position={[17, 0.35, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.2, 0.35, 0.8]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
      <mesh position={[0.35, 0.45, 0]}>
        <boxGeometry args={[0.2, 0.5, 0.2]} />
        <meshStandardMaterial color="#cfcfcf" />
      </mesh>
      <mesh ref={drill} position={[0.85, -0.1, 0]} visible={false}>
        <coneGeometry args={[0.12, 0.6, 6]} />
        <meshStandardMaterial color="#ffd166" metalness={0.8} />
      </mesh>
      {[[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45], [0, -0.45], [0, 0.45]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.2, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.12, 12]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      ))}
    </group>
  )
}

// ---------- Objetivo del rover: hielo / roca (con brillo durante el evento) ----------
export function Discoveries() {
  const act = useActiveEvent()
  const ice = act?.ev.id === 'ice'
  const rock = act?.ev.id === 'rock'
  const crystals = useRef()
  useFrame((st) => { if (crystals.current) crystals.current.rotation.y = st.clock.elapsedTime * 0.5 })
  return (
    <>
      {ice && (
        <group ref={crystals} position={[POS.ice[0], 0, POS.ice[2]]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[Math.cos(i * 1.3) * 0.6, 0.3, Math.sin(i * 1.3) * 0.6]} rotation={[0.3 * i, i, 0.2]}>
              <octahedronGeometry args={[0.35 + (i % 2) * 0.15, 0]} />
              <meshStandardMaterial color="#bdf3ff" emissive="#4fd8ff" emissiveIntensity={1.2} transparent opacity={0.85} />
            </mesh>
          ))}
          <pointLight position={[0, 1, 0]} color="#7fe9ff" intensity={20} distance={6} />
        </group>
      )}
      {rock && (
        <group position={[POS.rock[0], terrainHeight(POS.rock[0], POS.rock[2]), POS.rock[2]]}>
          {[0, 0.35, 0.7].map((y, i) => (
            <mesh key={i} position={[0, y + 0.2, 0]}>
              <cylinderGeometry args={[0.9 - i * 0.18, 1 - i * 0.18, 0.35, 9]} />
              <meshStandardMaterial color={['#7a3a1e', '#a0582e', '#c2763d'][i]} flatShading />
            </mesh>
          ))}
          <pointLight position={[0, 2, 0]} color="#ffd166" intensity={15} distance={6} />
        </group>
      )}
    </>
  )
}

// ---------- Mina de hielo (premio que queda) ----------
export function IceMine() {
  const has = useGame((s) => s.base.iceMine)
  const bit = useRef()
  const born = useRef(null)
  const grp = useRef()
  useFrame((st, dt) => {
    if (!has) return
    if (born.current === null) born.current = st.clock.elapsedTime
    const p = Math.min(1, (st.clock.elapsedTime - born.current) / 1.2)
    if (grp.current) grp.current.scale.setScalar(Math.max(0.001, p < 1 ? p * (1 + Math.sin(p * Math.PI) * 0.3) : 1))
    if (bit.current) bit.current.rotation.y += dt * 8
  })
  if (!has) return null
  const [x, , z] = POS.ice
  return (
    <group ref={grp} position={[x, 0, z]}>
      {[0, 2.1, 4.2].map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.8, 1.3, Math.sin(a) * 0.8]} rotation={[Math.sin(a) * 0.35, 0, -Math.cos(a) * 0.35]}>
          <cylinderGeometry args={[0.07, 0.07, 2.8, 6]} />
          <meshStandardMaterial color="#c9c9c9" metalness={0.6} />
        </mesh>
      ))}
      <mesh ref={bit} position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.15, 0.05, 2.4, 8]} />
        <meshStandardMaterial color="#ffd166" metalness={0.8} />
      </mesh>
      <mesh position={[1.6, 0.7, 0.6]}>
        <cylinderGeometry args={[0.6, 0.6, 1.4, 16]} />
        <meshStandardMaterial color="#5fb8ff" emissive="#1d6fd1" emissiveIntensity={0.6} transparent opacity={0.85} />
      </mesh>
      {/* caño hasta la base */}
      <mesh position={[-x / 2 + 1, 0.12, -z / 2 + 0.6]} rotation={[0, Math.atan2(x, z), Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, Math.hypot(x, z) - 4, 6]} />
        <meshStandardMaterial color="#8fa3b3" metalness={0.5} />
      </mesh>
    </group>
  )
}

// ---------- Muestras guardadas (premio) ----------
export function Samples() {
  const n = useGame((s) => s.base.samples)
  return (
    <group position={[-1.8, 0, 5]}>
      {Array.from({ length: n }).map((_, i) => (
        <group key={i} position={[-i * 0.75, 0, 0]}>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.6, 0.6, 0.6]} />
            <meshStandardMaterial color="#d9d2c6" />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[0.4, 0.06, 0.4]} />
            <meshStandardMaterial color="#ffd166" emissive="#b68200" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ---------- Módulo de aterrizaje (la nave) ----------
export function Lander() {
  const grp = useRef()
  const chute = useRef()
  const flameOn = () => cine.active && cine.t > 4.4 && cine.t < 7.7
  useFrame(() => {
    const g = grp.current
    if (!g) return
    if (cine.active) {
      const t = cine.t
      let y = 0
      if (t < 4.5) y = 70 - (t / 4.5) * 58 // paracaídas: de 70 a 12
      else if (t < 7.6) { const p = (t - 4.5) / 3.1; y = 12 * (1 - p) * (1 - p * 0.3) } // retrocohetes
      g.position.y = Math.max(0, y)
      g.rotation.z = t < 4.5 ? Math.sin(t * 2) * 0.06 : 0
      if (chute.current) {
        chute.current.visible = t < 5.5
        if (t > 4.5) { const p = t - 4.5; chute.current.position.set(p * 6, 6 + p * 10, -p * 3) } else chute.current.position.set(0, 6, 0)
      }
    } else {
      g.position.y = 0
      g.rotation.z = 0
      if (chute.current) chute.current.visible = false
    }
  })
  return (
    <group position={POS.lander}>
      <group ref={grp}>
        {/* cuerpo */}
        <mesh position={[0, 2.6, 0]} castShadow>
          <cylinderGeometry args={[1.6, 2.4, 3.2, 24]} />
          <meshStandardMaterial color="#e9e4da" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[0, 4.6, 0]} castShadow>
          <coneGeometry args={[1.6, 1.4, 24]} />
          <meshStandardMaterial color="#e2683a" metalness={0.2} />
        </mesh>
        <mesh position={[0, 3, 2.05]}>
          <circleGeometry args={[0.45, 20]} />
          <meshStandardMaterial color="#7fd3ff" emissive="#2a8cff" emissiveIntensity={0.8} />
        </mesh>
        {/* patas */}
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2 + Math.PI / 4
          return (
            <group key={i}>
              <mesh position={[Math.cos(a) * 2.5, 0.6, Math.sin(a) * 2.5]} rotation={[Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5]}>
                <cylinderGeometry args={[0.09, 0.09, 2.2, 6]} />
                <meshStandardMaterial color="#9a9a9a" metalness={0.7} />
              </mesh>
              <mesh position={[Math.cos(a) * 3, 0.06, Math.sin(a) * 3]}>
                <cylinderGeometry args={[0.35, 0.35, 0.1, 12]} />
                <meshStandardMaterial color="#777" />
              </mesh>
            </group>
          )
        })}
        {/* retrocohetes */}
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2
          return <RetroFlame key={i} position={[Math.cos(a) * 1.4, 1, Math.sin(a) * 1.4]} scale={1.3} visibleRef={flameOn} />
        })}
        {/* paracaídas */}
        <group ref={chute} visible={false}>
          <mesh position={[0, 10, 0]}>
            <sphereGeometry args={[5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2.6]} />
            <meshStandardMaterial color="#f4f0e8" side={THREE.DoubleSide} userData={{ surf: 'tela' }} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * 1.9, 5.6, Math.sin(a) * 1.9]} rotation={[Math.sin(a) * 0.52, 0, -Math.cos(a) * 0.52]}>
                <cylinderGeometry args={[0.02, 0.02, 7.4, 4]} />
                <meshBasicMaterial color="#ddd" />
              </mesh>
            )
          })}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <mesh key={'s' + i} position={[0, 10.05, 0]} rotation={[0, (i / 8) * Math.PI, 0]}>
              <boxGeometry args={[0.15, 0.02, 10]} />
              <meshBasicMaterial color={i % 2 ? '#e2683a' : '#f4f0e8'} />
            </mesh>
          ))}
        </group>
      </group>
      {/* rampa */}
      <Deploy start={12.6} dur={0.8} mode="grow" position={[2.3, 0.4, 1.8]} rotation={[0, -0.9, 0.35]}>
        <mesh>
          <boxGeometry args={[2.4, 0.08, 1.2]} />
          <meshStandardMaterial color="#b9b2a6" />
        </mesh>
      </Deploy>
    </group>
  )
}

// ---------- Tripulación en la base (sprites que siempre miran a la cámara) ----------
function FacingSprite({ src, frames, position, height = 2.6, start = 14, walkTo }) {
  const ref = useRef()
  const holder = useRef()
  const moving = useRef(false)
  const movingRef = useMemo(() => () => moving.current, [])
  const { camera } = useThree()
  useFrame((st, dt) => {
    if (!ref.current || !holder.current) return
    const target = walkTo || position
    const h = holder.current.position
    const dx = target[0] - h.x, dz = target[2] - h.z
    const mv = Math.hypot(dx, dz) > 0.1
    moving.current = mv
    h.x += dx * Math.min(1, dt * 1.6)
    h.z += dz * Math.min(1, dt * 1.6)
    ref.current.position.y = mv ? Math.abs(Math.sin(st.clock.elapsedTime * 9)) * 0.08 : Math.abs(Math.sin(st.clock.elapsedTime * 2)) * 0.04
    ref.current.rotation.y = Math.atan2(camera.position.x - h.x, camera.position.z - h.z)
    const p = cine.active ? Math.max(0, Math.min(1, (cine.t - start) / 0.6)) : 1
    holder.current.visible = p > 0
    holder.current.scale.setScalar(Math.max(0.001, p))
  })
  return (
    <group ref={holder} position={position}>
      <group ref={ref}>
        <Suspense fallback={null}><CharacterSprite src={src} frames={frames} movingRef={movingRef} height={height} /></Suspense>
      </group>
    </group>
  )
}

const EVA_FX = { cleaned: [6.5, 0, 1.5], panelfixed: [6.5, 0, 1.5], sample: [-3, 0, 9] }

export function Crew() {
  const ch = useGame((s) => getCharacter(s.player.character))
  const fx = useGame((s) => (s.phase === 'outcome' ? s.cardResult?.fx : null))
  const commanderTo = EVA_FX[fx] || null
  return (
    <>
      <FacingSprite src={ch.sprite} frames={ch.walk} position={POS.home} start={14.2} walkTo={commanderTo} />
      <FacingSprite src={CREW[0].sprite} position={[10.8, 0, 2.2]} start={14.6} height={2.4} />
      <FacingSprite src={CREW[1].sprite} position={[-10.6, 0, 3.6]} start={15} height={2.4} />
    </>
  )
}
