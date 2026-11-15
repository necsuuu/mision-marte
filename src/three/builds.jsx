// 🏗️ Obras que construye el jugador y 🚙 lugares de expedición alrededor de la base.
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { BUILDS } from '../game/content'
import { SITES } from '../game/tasks'
import { terrainHeight } from './terrain'

// ---------- Dónde va cada obra ----------
export const BUILD_POS = {
  shelter: [-3.6, 0, -6.6],
  farm: [-8.2, 0, 6.8],
  lab: [11.6, 0, 5.4],
}

/** Cartel de "en obra": piso marcado y cuatro postes naranjas. */
function Site({ r = 2 }) {
  return (
    <>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.92, r, 28]} />
        <meshBasicMaterial color="#ff9d5c" transparent opacity={0.8} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + 0.6
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0.35, Math.sin(a) * r]}>
            <coneGeometry args={[0.16, 0.7, 8]} />
            <meshStandardMaterial color="#ff7a2f" roughness={0.6} />
          </mesh>
        )
      })}
    </>
  )
}

/** Refugio: una bóveda tapada con tierra marciana (regolito). */
function Shelter({ k, done }) {
  return (
    <group scale={[1, Math.max(0.12, k), 1]}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[2.4, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#9b4a26" roughness={1} flatShading />
      </mesh>
      {/* entrada */}
      <mesh position={[0, 0.7, 2.15]} castShadow>
        <boxGeometry args={[1.3, 1.4, 0.7]} />
        <meshStandardMaterial color="#d9d2c6" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.62, 2.52]}>
        <planeGeometry args={[0.7, 1.05]} />
        <meshStandardMaterial color="#1b2430" emissive={done ? '#7fd4ff' : '#000'} emissiveIntensity={done ? 0.9 : 0} />
      </mesh>
    </group>
  )
}

/** Invernadero grande: una segunda cúpula con plantas, unida por un túnel. */
function Farm({ k, done }) {
  const s = Math.max(0.15, k)
  return (
    <group>
      <mesh position={[0, 0.07, 0]} receiveShadow>
        <cylinderGeometry args={[1.9, 2, 0.14, 32]} />
        <meshStandardMaterial color="#6f675d" />
      </mesh>
      <group scale={[1, s, 1]}>
        <mesh>
          <sphereGeometry args={[1.9, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#bff5e3" transparent opacity={0.3} roughness={0.05} metalness={0.2} emissive="#7cffc4" emissiveIntensity={done ? 0.35 : 0.05} depthWrite={false} />
        </mesh>
      </group>
      {done && [...Array(14)].map((_, i) => {
        const a = i * 2.4, d = 0.35 + (i % 5) * 0.28
        return (
          <mesh key={i} position={[Math.cos(a) * d, 0.4, Math.sin(a) * d]}>
            <coneGeometry args={[0.16, 0.55, 6]} />
            <meshStandardMaterial color="#58c26a" emissive="#2f8f3f" emissiveIntensity={0.4} />
          </mesh>
        )
      })}
      {done && <pointLight position={[0, 1.1, 0]} color="#d06bff" intensity={6} distance={5} />}
    </group>
  )
}

/** Estación meteorológica: mástil con veleta que gira y cajita de instrumentos. */
function Lab({ k, done }) {
  const cups = useRef()
  useFrame((_, dt) => { if (cups.current && done) cups.current.rotation.y += dt * 3 })
  return (
    <group scale={[1, Math.max(0.15, k), 1]}>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 3.2, 8]} />
        <meshStandardMaterial color="#b9bcc2" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, 1.2, 0.22]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.3]} />
        <meshStandardMaterial color="#f1efe8" roughness={0.5} />
      </mesh>
      <mesh position={[0.5, 2.3, 0]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.7, 0.04, 0.45]} />
        <meshStandardMaterial color="#1d3b8f" metalness={0.5} roughness={0.25} />
      </mesh>
      <group ref={cups} position={[0, 3.25, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} position={[Math.cos((i / 3) * Math.PI * 2) * 0.35, 0, Math.sin((i / 3) * Math.PI * 2) * 0.35]}>
            <sphereGeometry args={[0.1, 10, 8]} />
            <meshStandardMaterial color="#ffd166" metalness={0.4} roughness={0.4} />
          </mesh>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.35, 0.015, 6, 20]} />
          <meshStandardMaterial color="#888" metalness={0.7} />
        </mesh>
      </group>
      {done && <pointLight position={[0, 1.3, 0.5]} color="#7be07b" intensity={3} distance={3} />}
    </group>
  )
}

const MODELS = { shelter: Shelter, farm: Farm, lab: Lab }
const RADIUS = { shelter: 2.9, farm: 2.3, lab: 1.2 }

/** Dibuja las obras terminadas y la que está en marcha (va creciendo con el avance). El panel lo dibuja SolarArray. */
export function Builds() {
  const build = useGame((s) => s.build)
  return BUILDS.filter((b) => MODELS[b.id]).map((b) => {
    const done = build.done.includes(b.id)
    const prog = build.progress[b.id] || 0
    if (!done && !(build.active === b.id || prog > 0)) return null
    const M = MODELS[b.id]
    const [x, , z] = BUILD_POS[b.id]
    return (
      <group key={b.id} position={[x, terrainHeight(x, z), z]}>
        {!done && <Site r={RADIUS[b.id]} />}
        {(done || prog > 0) && <M k={done ? 1 : prog / b.cost} done={done} />}
      </group>
    )
  })
}

// ---------- Lugares de expedición ----------
export const sitePos = (id) => { const [x, , z] = SITES[id]; return [x, terrainHeight(x, z), z] }

function Flag({ color = '#ffd166' }) {
  return (
    <group position={[1.2, 0, 0.8]}>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.8, 6]} />
        <meshStandardMaterial color="#ddd" metalness={0.5} />
      </mesh>
      <mesh position={[0.3, 1.55, 0]}>
        <planeGeometry args={[0.6, 0.4]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} emissive={color} emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}

function Crater() {
  return (
    <>
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 1, 0.5]}>
        <torusGeometry args={[2.4, 0.6, 8, 18]} />
        <meshStandardMaterial color="#8a4424" roughness={1} flatShading />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[Math.cos(i * 1.7) * 0.8, 0.25, Math.sin(i * 1.7) * 0.8]} rotation={[0.3 * i, i, 0.2]}>
          <octahedronGeometry args={[0.32 + (i % 2) * 0.12, 0]} />
          <meshStandardMaterial color="#bdf3ff" emissive="#4fd8ff" emissiveIntensity={0.9} transparent opacity={0.85} />
        </mesh>
      ))}
    </>
  )
}
function Cave() {
  return (
    <>
      <mesh position={[0, 1.2, 0]} scale={[3.2, 2.2, 2.6]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#7a3a1e" roughness={1} flatShading />
      </mesh>
      {/* boca de la cueva, mirando hacia la base */}
      <mesh position={[2.15, 0.25, -1.45]} scale={[1, 1.15, 1]}>
        <sphereGeometry args={[1.25, 16, 12]} />
        <meshBasicMaterial color="#090504" />
      </mesh>
    </>
  )
}
function OldRover() {
  return (
    <group rotation={[0.12, 0.9, -0.2]} position={[0, 0.25, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.5, 0.3, 1]} />
        <meshStandardMaterial color="#b98a62" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[1.7, 0.04, 1.2]} />
        <meshStandardMaterial color="#5a4a52" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0.5, 0.7, 0.2]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 6]} />
        <meshStandardMaterial color="#c9c9c9" metalness={0.5} />
      </mesh>
      <mesh position={[0.64, 1.25, 0.2]}>
        <boxGeometry args={[0.3, 0.16, 0.16]} />
        <meshStandardMaterial color="#d8d8d8" />
      </mesh>
      {[[-0.6, -0.55], [0.6, -0.55], [-0.6, 0.55], [0.6, 0.55]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.2, z]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.14, 10]} />
          <meshStandardMaterial color="#3a332f" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}
function Hill() {
  return (
    <mesh position={[0, 2.2, 0]} castShadow>
      <coneGeometry args={[4.6, 5.2, 7]} />
      <meshStandardMaterial color="#8f4a28" roughness={1} flatShading />
    </mesh>
  )
}
const LANDMARKS = { crater: Crater, cave: Cave, oldrover: OldRover, hill: Hill }

/** Los cuatro lugares se ven desde la base; los ya visitados quedan con una banderita. */
export function ExpeditionSites() {
  const visited = useGame((s) => s.visited)
  return Object.keys(SITES).map((id) => {
    const L = LANDMARKS[id]
    return (
      <group key={id} position={sitePos(id)}>
        <L />
        {visited.includes(id) && <group position={id === 'hill' ? [-1.2, 4.8, -0.8] : [0, 0, 0]}><Flag /></group>}
      </group>
    )
  })
}

/** Lugar al que fue el rover en la expedición que se está mostrando (o null). */
export function activeSite(s = useGame.getState()) {
  const card = s.cards[0]
  if (s.screen !== 'sol' || !card?.event?.expedition || s.phase !== 'outcome') return null // durante la tarea lo maneja el jugador
  return card.event.choices[s.cardResult?.choiceIdx]?.site || null
}
