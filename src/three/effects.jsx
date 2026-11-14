import { useMemo, useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGame, shieldFraction } from '../game/store'

let _dotTex
export function dotTexture() {
  if (_dotTex) return _dotTex
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.4, 'rgba(255,255,255,0.6)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  _dotTex = new THREE.CanvasTexture(c)
  return _dotTex
}

export function Shield() {
  const s = useGame()
  const showing = s.screen === 'sol' && (s.phase === 'plan' || s.phase === 'report' || (s.cards[0]?.type === 'briefing' && !!s.cards[0].storm))
  const frac = shieldFraction(s, s.alloc.shield)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uTime: { value: 0 }, uStrength: { value: 0 }, uColor: { value: new THREE.Color('#b48cff') } },
        vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vW;
          void main(){ vN = normalize(normalMatrix*normal); vec4 p = modelViewMatrix*vec4(position,1.); vP=p.xyz; vW=position; gl_Position=projectionMatrix*p; }`,
        fragmentShader: `uniform float uTime; uniform float uStrength; uniform vec3 uColor; varying vec3 vN; varying vec3 vP; varying vec3 vW;
          void main(){
            float f = pow(1.0 - abs(dot(vN, normalize(-vP))), 2.5);
            float hex = 0.5 + 0.5*sin(vW.y*3.0 - uTime*2.0) * sin(atan(vW.z, vW.x)*18.0);
            float a = (f*0.9 + hex*0.12) * uStrength;
            gl_FragColor = vec4(uColor, a);
          }`,
      }),
    []
  )
  useFrame((st, dt) => {
    mat.uniforms.uTime.value = st.clock.elapsedTime
    const target = showing ? frac : 0
    mat.uniforms.uStrength.value += (target - mat.uniforms.uStrength.value) * Math.min(1, dt * 3)
  })
  return (
    <mesh material={mat}>
      <sphereGeometry args={[12.5, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
  )
}

// Partículas de tormenta solar cayendo del cielo
export function SolarParticles({ level }) {
  const ref = useRef()
  const N = 900
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      p[i * 3] = (Math.random() - 0.5) * 70
      p[i * 3 + 1] = Math.random() * 50
      p[i * 3 + 2] = (Math.random() - 0.5) * 70
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return g
  }, [])
  useFrame((_, dt) => {
    const a = geo.attributes.position
    const speed = 18 + level * 14
    for (let i = 0; i < N; i++) {
      let y = a.getY(i) - dt * speed
      let x = a.getX(i) + dt * speed * 0.35
      if (y < 0) { y = 50; x = (Math.random() - 0.5) * 70 - 10 }
      a.setY(i, y); a.setX(i, x)
    }
    a.needsUpdate = true
    if (ref.current) ref.current.material.opacity = Math.min(1, 0.3 + level * 0.25)
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial map={dotTexture()} color={level >= 3 ? '#ff5bd6' : '#ffd36b'} size={0.45} transparent opacity={0.7} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

export function DustParticles({ level }) {
  const ref = useRef()
  const N = 2500
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const p = new Float32Array(N * 3)
    for (let i = 0; i < N; i++) {
      p[i * 3] = (Math.random() - 0.5) * 90
      p[i * 3 + 1] = Math.random() * 14
      p[i * 3 + 2] = (Math.random() - 0.5) * 90
    }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return g
  }, [])
  useFrame((_, dt) => {
    const a = geo.attributes.position
    for (let i = 0; i < N; i++) {
      let x = a.getX(i) + dt * (6 + (i % 7))
      if (x > 45) x = -45
      a.setX(i, x)
    }
    a.needsUpdate = true
    if (ref.current) ref.current.material.opacity = level
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial map={dotTexture()} color="#d79a64" size={0.6} transparent opacity={0.6} depthWrite={false} />
    </points>
  )
}


// ---------- Efectos nuevos: eventos y consecuencias ----------

/** Chorro de aire que se escapa por un agujero (partículas blancas que salen y se desvanecen). */
export function LeakJet({ position, normal, strength = 1 }) {
  const N = 220
  const ref = useRef()
  const data = useMemo(() => {
    const pos = new Float32Array(N * 3)
    const life = new Float32Array(N).map(() => Math.random())
    const vel = Array.from({ length: N }, () => new THREE.Vector3())
    return { pos, life, vel }
  }, [])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(data.pos, 3))
    return g
  }, [data])
  const n = useMemo(() => new THREE.Vector3(...normal).normalize(), [normal])
  useFrame((_, dt) => {
    const { pos, life, vel } = data
    for (let i = 0; i < N; i++) {
      life[i] += dt * (1.2 + (i % 5) * 0.15)
      if (life[i] >= 1) {
        life[i] = 0
        pos[i * 3] = position[0]; pos[i * 3 + 1] = position[1]; pos[i * 3 + 2] = position[2]
        vel[i].copy(n).multiplyScalar(4 + Math.random() * 3).add(new THREE.Vector3((Math.random() - 0.5) * 1.6, Math.random() * 0.8, (Math.random() - 0.5) * 1.6))
      }
      pos[i * 3] += vel[i].x * dt; pos[i * 3 + 1] += vel[i].y * dt; pos[i * 3 + 2] += vel[i].z * dt
    }
    geo.attributes.position.needsUpdate = true
    if (ref.current) ref.current.material.opacity = 0.75 * strength
  })
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial map={dotTexture()} color="#f4fbff" size={0.5} transparent opacity={0.75} depthWrite={false} />
    </points>
  )
}

/** Meteorito que cae y golpea un punto. Se reinicia cada vez que se monta. */
export function Meteor({ target, onImpact }) {
  const ball = useRef()
  const trail = useRef()
  const flash = useRef()
  const t = useRef(0)
  const hit = useRef(false)
  const from = useMemo(() => new THREE.Vector3(target[0] + 26, target[1] + 34, target[2] - 18), [target])
  const to = useMemo(() => new THREE.Vector3(...target), [target])
  useFrame((_, dt) => {
    t.current += dt
    const p = Math.min(1, t.current / 0.9)
    const pos = from.clone().lerp(to, p * p)
    if (ball.current) { ball.current.position.copy(pos); ball.current.visible = p < 1 }
    if (trail.current) {
      trail.current.position.copy(pos.clone().lerp(from, 0.08))
      trail.current.lookAt(from)
      trail.current.visible = p < 1
    }
    if (p >= 1 && !hit.current) { hit.current = true; onImpact?.() }
    if (flash.current) flash.current.intensity = p >= 1 ? Math.max(0, 80 * (1 - (t.current - 0.9) * 2.5)) : 0
  })
  return (
    <>
      <mesh ref={ball}>
        <sphereGeometry args={[0.35, 12, 12]} />
        <meshBasicMaterial color="#ffd38a" toneMapped={false} />
      </mesh>
      <mesh ref={trail}>
        <coneGeometry args={[0.3, 6, 12, 1, true]} />
        <meshBasicMaterial color="#ff8a3d" transparent opacity={0.55} toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight ref={flash} position={target} color="#ffb36b" intensity={0} distance={14} />
    </>
  )
}

/** Brillitos de resultado: verdes si salió bien, rojos si salió mal. */
export function OutcomeSparks({ position, good = true, count = 60, radius = 2.5 }) {
  const ref = useRef()
  const N = count
  const seeds = useMemo(() => Array.from({ length: N }, () => [Math.random() * Math.PI * 2, Math.random() * radius, Math.random()]), [N, radius])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    return g
  }, [N])
  useFrame((st) => {
    const a = geo.attributes.position
    const time = st.clock.elapsedTime
    for (let i = 0; i < N; i++) {
      const [ang, r, ph] = seeds[i]
      const y = ((time * 0.8 + ph) % 1) * 3.5
      a.setXYZ(i, position[0] + Math.cos(ang + time * 0.6) * r, position[1] + y, position[2] + Math.sin(ang + time * 0.6) * r)
    }
    a.needsUpdate = true
  })
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial map={dotTexture()} color={good ? '#7dffb0' : '#ff5a5a'} size={0.45} transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

/** Baliza roja giratoria de alarma. */
export function AlarmBeacon({ position }) {
  const light = useRef()
  const head = useRef()
  useFrame((st) => {
    const a = st.clock.elapsedTime * 6
    if (light.current) light.current.position.set(position[0] + Math.cos(a) * 1.2, position[1] + 0.3, position[2] + Math.sin(a) * 1.2)
    if (head.current) head.current.material.emissiveIntensity = 1.5 + Math.sin(st.clock.elapsedTime * 12) * 1.2
  })
  return (
    <>
      <mesh ref={head} position={position}>
        <sphereGeometry args={[0.32, 16, 12]} />
        <meshStandardMaterial color="#ff2a2a" emissive="#ff0000" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <pointLight ref={light} color="#ff2020" intensity={40} distance={14} />
    </>
  )
}

/** Fuego de retrocohete (cono que titila). */
export function RetroFlame({ position, scale = 1, visibleRef }) {
  const ref = useRef()
  useFrame((st) => {
    if (!ref.current) return
    const on = visibleRef ? visibleRef() : true
    ref.current.visible = on
    const f = 0.85 + Math.sin(st.clock.elapsedTime * 40) * 0.15
    ref.current.scale.set(scale * f, scale * (1 + Math.sin(st.clock.elapsedTime * 33) * 0.2), scale * f)
  })
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, -1.1, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.45, 2.2, 14, 1, true]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.85} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh position={[0, -0.7, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.22, 1.3, 12, 1, true]} />
        <meshBasicMaterial color="#e9f6ff" transparent opacity={0.95} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Nube de polvo que se levanta (aterrizaje). amountRef() devuelve 0..1 */
export function DustBurst({ position, amountRef }) {
  const N = 900
  const ref = useRef()
  const seeds = useMemo(() => Array.from({ length: N }, () => [Math.random() * Math.PI * 2, Math.random(), Math.random()]), [])
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    return g
  }, [])
  useFrame(() => {
    const amt = amountRef()
    const a = geo.attributes.position
    for (let i = 0; i < N; i++) {
      const [ang, r, h] = seeds[i]
      const rad = 1 + amt * 14 * r
      a.setXYZ(i, position[0] + Math.cos(ang) * rad, position[1] + h * (1 + amt * 3), position[2] + Math.sin(ang) * rad)
    }
    a.needsUpdate = true
    if (ref.current) { ref.current.material.opacity = Math.min(0.85, amt * 1.2); ref.current.visible = amt > 0.01 }
  })
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial map={dotTexture()} color="#c98a58" size={1.1} transparent opacity={0} depthWrite={false} />
    </points>
  )
}
