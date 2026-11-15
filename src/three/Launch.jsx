import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RetroFlame, dotTexture } from './effects'

// Cinemática de despegue desde la Tierra (va ANTES de la recolección de suministros).
// Tiene su propio reloj, así no se mezcla con la de aterrizaje.
import { launchClock, LAUNCH_END, LIFTOFF, SPACE_CUT } from '../game/clocks'

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const smooth = (v) => v * v * (3 - 2 * v)
const rocketY = (t) => (t < LIFTOFF ? 0 : 3 * (t - LIFTOFF) ** 2)

function Rocket({ scale = 1, flameOn }) {
  return (
    <group scale={scale}>
      <mesh position={[0, 3, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.6, 6, 24]} />
        <meshStandardMaterial color="#f3f5f8" roughness={0.45} metalness={0.2} />
      </mesh>
      <mesh position={[0, 6.8, 0]} castShadow>
        <coneGeometry args={[0.55, 1.6, 24]} />
        <meshStandardMaterial color="#e2574c" roughness={0.5} />
      </mesh>
      <mesh position={[0, 4.6, 0.52]}>
        <circleGeometry args={[0.22, 20]} />
        <meshStandardMaterial color="#5fb7ff" emissive="#2a6fb0" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.3, 24]} />
        <meshStandardMaterial color="#2b2f3a" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]} position={[0, 0.7, 0]}>
          <boxGeometry args={[0.08, 1.4, 1.5]} />
          <meshStandardMaterial color="#e2574c" />
        </mesh>
      ))}
      <RetroFlame position={[0, 0, 0]} scale={1.7} visibleRef={flameOn} />
    </group>
  )
}

function Pad() {
  return (
    <group>
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <cylinderGeometry args={[3.2, 3.6, 0.5, 32]} />
        <meshStandardMaterial color="#8b8f99" roughness={0.9} />
      </mesh>
      {/* torre de servicio */}
      <group position={[-2.2, 0, 0]}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} position={[0, 0.6 + i * 1.2, 0]} castShadow>
            <boxGeometry args={[1, 0.12, 1]} />
            <meshStandardMaterial color="#c0392b" />
          </mesh>
        ))}
        {[[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].map(([x, z], i) => (
          <mesh key={i} position={[x, 4.2, z]} castShadow>
            <boxGeometry args={[0.1, 8.4, 0.1]} />
            <meshStandardMaterial color="#c0392b" />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Smoke({ amount }) {
  const N = 700
  const ref = useRef()
  const seeds = useMemo(() => Array.from({ length: N }, () => [Math.random() * Math.PI * 2, Math.random(), Math.random()]), [])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    return g
  }, [])
  useFrame(() => {
    const amt = amount()
    const a = geo.attributes.position
    for (let i = 0; i < N; i++) {
      const [ang, r, h] = seeds[i]
      const rad = 1.5 + amt * 13 * r
      a.setXYZ(i, Math.cos(ang) * rad, 0.2 + h * (0.5 + amt * 4) * (1 - r * 0.5), Math.sin(ang) * rad)
    }
    a.needsUpdate = true
    if (ref.current) { ref.current.material.opacity = Math.min(0.9, amt * 1.3); ref.current.visible = amt > 0.01 }
  })
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial map={dotTexture()} color="#f1f1f1" size={2.4} transparent opacity={0} depthWrite={false} />
    </points>
  )
}

function Clouds() {
  const geo = useMemo(() => {
    const N = 420
    const arr = new Float32Array(N * 3)
    let seed = 3
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < N; i++) {
      const puff = Math.floor(i / 14)
      const a = puff * 2.4
      const r = 8 + (puff % 5) * 7
      arr.set([Math.cos(a) * r + (rnd() - 0.5) * 6, 30 + (puff % 3) * 4 + (rnd() - 0.5) * 2.5, Math.sin(a) * r + (rnd() - 0.5) * 6], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [])
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial map={dotTexture()} color="#ffffff" size={7} transparent opacity={0.85} depthWrite={false} />
    </points>
  )
}

function StarField({ opacity }) {
  const ref = useRef()
  const geo = useMemo(() => {
    const N = 1500
    const arr = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(300 + Math.random() * 100)
      arr.set([v.x, v.y, v.z], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    return g
  }, [])
  useFrame(({ camera }) => {
    if (!ref.current) return
    ref.current.position.copy(camera.position)
    ref.current.material.opacity = opacity()
  })
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial map={dotTexture()} color="#ffffff" size={2.2} sizeAttenuation transparent opacity={0} depthWrite={false} />
    </points>
  )
}

/** Textura procedural de la Tierra: océano, continentes y nubes. */
function useEarthTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 512
    const g = c.getContext('2d')
    g.fillStyle = '#1d5fa8'
    g.fillRect(0, 0, 1024, 512)
    let seed = 7
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    const blob = (x, y, r, color) => {
      g.fillStyle = color
      for (let k = 0; k < 14; k++) {
        g.beginPath()
        g.ellipse(x + (rnd() - 0.5) * r * 1.6, y + (rnd() - 0.5) * r, r * (0.3 + rnd() * 0.5), r * (0.2 + rnd() * 0.4), rnd() * 3, 0, Math.PI * 2)
        g.fill()
      }
    }
    ;[[180, 170, 90], [260, 330, 80], [520, 180, 110], [560, 320, 70], [760, 170, 120], [840, 360, 60]].forEach(([x, y, r]) => blob(x, y, r, '#3f8f4a'))
    ;[[520, 200, 50], [760, 190, 50]].forEach(([x, y, r]) => blob(x, y, r, '#b49a5a'))
    g.fillStyle = '#eef6ff'
    g.fillRect(0, 0, 1024, 26)
    g.fillRect(0, 486, 1024, 26)
    g.globalAlpha = 0.4
    for (let k = 0; k < 34; k++) blob(rnd() * 1024, 60 + rnd() * 390, 20, '#ffffff')
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [])
}

function Space() {
  const earth = useRef()
  const rocket = useRef()
  const tex = useEarthTexture()
  useFrame((_, dt) => {
    if (earth.current) earth.current.rotation.y += dt * 0.05
    const p = clamp01((launchClock.t - SPACE_CUT) / (LAUNCH_END - SPACE_CUT))
    if (rocket.current) {
      rocket.current.position.set(2 + p * -14, 3 + p * 4, 4 + p * -40)
    }
  })
  return (
    <group>
      <mesh ref={earth} position={[0, -2, 0]}>
        <sphereGeometry args={[6, 64, 48]} />
        <meshStandardMaterial map={tex} roughness={0.8} />
      </mesh>
      <mesh position={[0, -2, 0]} scale={1.04}>
        <sphereGeometry args={[6, 48, 32]} />
        <meshBasicMaterial color="#7fc8ff" transparent opacity={0.18} side={THREE.BackSide} />
      </mesh>
      <mesh position={[-60, 18, -180]}>
        <sphereGeometry args={[3, 32, 24]} />
        <meshStandardMaterial color="#c1440e" emissive="#5a1a05" emissiveIntensity={0.6} />
      </mesh>
      <group ref={rocket} rotation={[-Math.PI / 2.3, 0.3, 0]}>
        <Rocket scale={0.18} flameOn={() => true} />
      </group>
    </group>
  )
}

const SKY_DAY = new THREE.Color('#8fd0f5')
const SKY_NIGHT = new THREE.Color('#02030a')

export default function Launch({ onDone }) {
  const { scene, camera } = useThree()
  const ground = useRef()
  const space = useRef()
  const rocket = useRef()
  const done = useRef(false)
  const bg = useMemo(() => new THREE.Color(), [])

  useEffect(() => {
    launchClock.t = 0
    scene.background = bg
    return () => { scene.background = null }
  }, [scene, bg])

  const altitude = () => clamp01((rocketY(launchClock.t) - 8) / 55)
  const smoke = () => {
    const t = launchClock.t
    if (t < LIFTOFF - 1.2) return 0
    return Math.min(1, (t - (LIFTOFF - 1.2)) / 2.5)
  }

  useFrame((_, dt) => {
    launchClock.t += Math.min(dt, 0.1)
    const t = launchClock.t
    if (t >= LAUNCH_END + 0.3 && !done.current) { done.current = true; onDone?.() }
    const inSpace = t >= SPACE_CUT
    if (ground.current) ground.current.visible = !inSpace
    if (space.current) space.current.visible = inSpace
    if (!inSpace) {
      const y = rocketY(t)
      if (rocket.current) rocket.current.position.y = y
      const shake = t > LIFTOFF - 0.4 && t < LIFTOFF + 2 ? 0.12 : 0
      const lift = Math.max(0, y)
      camera.position.set(10 + (Math.random() - 0.5) * shake, 3.5 + lift * 0.82, 15 + (Math.random() - 0.5) * shake)
      camera.lookAt(0, 4 + lift, 0)
      bg.copy(SKY_DAY).lerp(SKY_NIGHT, smooth(altitude()))
    } else {
      const p = smooth(clamp01((t - SPACE_CUT) / (LAUNCH_END - SPACE_CUT)))
      camera.position.set(9 - p * 6, 4 + p * 5, 14 + p * 6)
      camera.lookAt(-2 - p * 6, 1 + p * 2, -4 - p * 10)
      bg.copy(SKY_NIGHT)
    }
  })

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[12, 20, 8]} intensity={2} castShadow />
      <hemisphereLight args={['#bfe3ff', '#4b6b3a', 0.5]} />
      <StarField opacity={() => (launchClock.t >= SPACE_CUT ? 1 : smooth(altitude()))} />
      <group ref={ground}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <circleGeometry args={[400, 48]} />
          <meshStandardMaterial color="#6f9a54" roughness={1} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-60, -0.45, -90]}>
          <circleGeometry args={[70, 40]} />
          <meshStandardMaterial color="#2f7fc4" roughness={0.3} />
        </mesh>
        <Pad />
        <group ref={rocket}>
          <Rocket flameOn={() => launchClock.t > LIFTOFF - 0.5} />
        </group>
        <Smoke amount={smoke} />
        <Clouds />
      </group>
      <group ref={space} visible={false}>
        <Space />
      </group>
    </>
  )
}
