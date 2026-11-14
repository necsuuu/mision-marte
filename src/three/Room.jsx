// Interior de la nave: el comandante recorre la cabina, abre muebles y lleva los suministros a la base.
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { ITEMS } from '../game/content'
import { getCharacter, CREW } from '../game/characters'
import { ITEM_MODELS } from './items3d'
import CharacterSprite from './CharacterSprite'

// ---------- Muebles ----------
// kind: shelf/console/rack/bench/leaning = abiertos · wallcab/locker/glasscase/drawers/crate = hay que abrirlos
export const FURN = {
  pantry: { pos: [-8.2, 0, -6.3], front: [-8.2, 0, -4.4], kind: 'shelf' },
  medcab: { pos: [-4.6, 0, -6.75], front: [-4.6, 0, -4.6], kind: 'wallcab' },
  locker: { pos: [-1.6, 0, -6.35], front: [-1.6, 0, -4.4], kind: 'locker' },
  decoy: { pos: [0.4, 0, -6.35], front: [0.4, 0, -4.4], kind: 'locker', empty: true },
  moxiebay: { pos: [7.2, 0, -6.45], front: [7.2, 0, -4.4], kind: 'glasscase' },
  drawers: { pos: [-10.7, 0, -1.4], front: [-8.8, 0, -1.4], kind: 'drawers' },
  crate: { pos: [-9.4, 0, 3.2], front: [-7.7, 0, 3.2], kind: 'crate' },
  console: { pos: [0.6, 0, -0.2], front: [0.6, 0, 1.7], kind: 'console' },
  tankrack: { pos: [-5, 0, 4.9], front: [-5, 0, 3.3], kind: 'rack' },
  bench: { pos: [4.6, 0, 4.8], front: [4.6, 0, 3.2], kind: 'bench' },
  panelwall: { pos: [9.6, 0, 4.4], front: [8.2, 0, 3.6], kind: 'leaning' },
}
const CLOSED_KINDS = new Set(['wallcab', 'locker', 'glasscase', 'drawers', 'crate'])

// Dónde está cada objeto
export const SPOTS = {
  'rations-0': { furn: 'pantry', at: [-8.8, 1.22, -6.2], s: 0.8 },
  'rations-1': { furn: 'pantry', at: [-7.6, 2.12, -6.2], s: 0.8 },
  'medkit-0': { furn: 'medcab', at: [-4.6, 1.75, -6.45], s: 0.8 },
  'o2tank-0': { furn: 'locker', at: [-1.6, 0.25, -6.25] },
  'moxie-0': { furn: 'moxiebay', at: [7.2, 0.75, -6.3] },
  'repair-0': { furn: 'drawers', at: [-9.6, 1.12, -1.4], s: 0.75 },
  'seeds-0': { furn: 'crate', at: [-9.4, 0.55, 3.2] },
  'battery-0': { furn: 'console', at: [1.8, 1.02, -0.2], s: 0.8 },
  'water-0': { furn: 'tankrack', at: [-5, 0.32, 4.9] },
  'science-0': { furn: 'bench', at: [4.6, 1.02, 4.8] },
  'panel-0': { furn: 'panelwall', at: [9.6, 0, 4.4] },
}

const HATCH = new THREE.Vector3(9.6, 0, -1)
const DROP_RADIUS = 2.3
const BOUNDS = { x: [-10.2, 9.8], z: [-5.4, 5.6] }
const SPEED = 6.5
const itemById = (id) => ITEMS.find((i) => i.id === id)
const setCursor = (c) => (document.body.style.cursor = c)
const go = (detail) => window.dispatchEvent(new CustomEvent('room-go', { detail }))

// ---------- Texturas ----------
function useTileTexture(base, line, repeat) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')
    g.fillStyle = line; g.fillRect(0, 0, 256, 256)
    g.fillStyle = base; g.fillRect(8, 8, 240, 240)
    g.fillStyle = line
    ;[[24, 24], [232, 24], [24, 232], [232, 232]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill() })
    const t = new THREE.CanvasTexture(c)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(...repeat)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [base, line, repeat])
}

// Vista de Marte por la escotilla (con la tormenta de polvo acercándose)
function usePortholeTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const g = c.getContext('2d')
    const sky = g.createLinearGradient(0, 0, 0, 512)
    sky.addColorStop(0, '#e2a374'); sky.addColorStop(0.6, '#d48a5c'); sky.addColorStop(1, '#a8532c')
    g.fillStyle = sky; g.fillRect(0, 0, 512, 512)
    g.fillStyle = '#8f3f1d'
    g.beginPath(); g.moveTo(0, 330)
    for (let x = 0; x <= 512; x += 32) g.lineTo(x, 300 + Math.sin(x * 0.03) * 25 + Math.sin(x * 0.11) * 10)
    g.lineTo(512, 512); g.lineTo(0, 512); g.fill()
    g.fillStyle = '#b5612f'; g.fillRect(0, 400, 512, 112)
    g.fillStyle = '#ece6dc'; g.beginPath(); g.arc(300, 400, 46, Math.PI, 0); g.fill() // el domo de la base
    g.fillStyle = '#1d3b8f'; g.fillRect(380, 390, 50, 8); g.fillRect(440, 385, 50, 8)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
}

// ---------- Escenografía de la cabina ----------
function Cabin({ dustRef }) {
  const left = useGame((s) => s.roomLeft)
  const wallTex = useTileTexture('#5f6652', '#4a5040', [8, 2])
  const port = usePortholeTexture()
  const dustDisc = useRef()
  const alarm = useRef()
  useFrame((st) => {
    const d = dustRef()
    if (dustDisc.current) dustDisc.current.material.opacity = Math.min(0.92, d)
    if (alarm.current) alarm.current.intensity = d > 0.8 ? 18 + Math.sin(st.clock.elapsedTime * 10) * 16 : 0
  })
  return (
    <group>
      {/* pared del fondo */}
      <mesh position={[0, 3, -7]} receiveShadow><boxGeometry args={[23, 6, 0.3]} /><meshStandardMaterial map={wallTex} roughness={0.9} /></mesh>
      {/* escotilla redonda */}
      <group position={[3.4, 3.4, -6.8]}>
        <mesh><torusGeometry args={[1.25, 0.22, 16, 48]} /><meshStandardMaterial color="#2f3428" metalness={0.5} /></mesh>
        <mesh><circleGeometry args={[1.2, 48]} /><meshBasicMaterial map={port} toneMapped={false} /></mesh>
        <mesh ref={dustDisc} position={[0, 0, 0.01]}><circleGeometry args={[1.2, 48]} /><meshBasicMaterial color="#7a4a2a" transparent opacity={0} /></mesh>
      </group>
      {/* paredes laterales */}
      <mesh position={[-11.5, 3, -0.5]} receiveShadow><boxGeometry args={[0.3, 6, 13.5]} /><meshStandardMaterial map={wallTex} roughness={0.9} /></mesh>
      <mesh position={[11.5, 3, -5]}><boxGeometry args={[0.3, 6, 4.4]} /><meshStandardMaterial map={wallTex} /></mesh>
      <mesh position={[11.5, 3, 3.6]}><boxGeometry args={[0.3, 6, 4.8]} /><meshStandardMaterial map={wallTex} /></mesh>
      <mesh position={[11.5, 5.2, -1]}><boxGeometry args={[0.3, 1.6, 4.4]} /><meshStandardMaterial map={wallTex} /></mesh>
      {/* caños y cables */}
      <mesh position={[0, 5.6, -6.7]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.12, 0.12, 22, 8]} /><meshStandardMaterial color="#7d7f70" metalness={0.5} /></mesh>
      <mesh position={[0, 5.25, -6.7]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 22, 8]} /><meshStandardMaterial color="#b0573a" /></mesh>
      {/* lamparitas cálidas como en la ilustración */}
      {[[-6, 5.3, -6.5], [6, 5.3, -6.5], [-10.9, 5, 2]].map((p, i) => (
        <group key={i} position={p}>
          <mesh><sphereGeometry args={[0.18, 12, 12]} /><meshBasicMaterial color="#ffe9a8" toneMapped={false} /></mesh>
          <pointLight color="#ffd27a" intensity={14} distance={9} />
        </group>
      ))}
      {/* luz de alarma (tormenta cerca) */}
      <mesh position={[9.5, 5.4, -6.6]}><sphereGeometry args={[0.25, 12, 12]} /><meshStandardMaterial color="#ff2a2a" emissive="#ff0000" emissiveIntensity={1.5} /></mesh>
      <pointLight ref={alarm} position={[9.5, 5, -6]} color="#ff2a2a" intensity={0} distance={16} />
      {/* contador de días en la pared (como el 004 del dibujo) */}
      <Html position={[10.2, 4.6, -6.8]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className="flip-counter">{String(left ?? 60).padStart(3, '0')}</div>
      </Html>
    </group>
  )
}

// ---------- Mueble genérico ----------
function Furniture({ id, f, open, hasItems }) {
  const door = useRef()
  const [hover, setHover] = useState(false)
  const closedKind = CLOSED_KINDS.has(f.kind)
  useFrame((_, dt) => {
    const d = door.current
    if (!d) return
    const k = Math.min(1, dt * 7)
    if (f.kind === 'drawers') d.position.x += ((open ? 1 : 0) - d.position.x) * k
    else if (f.kind === 'crate') d.rotation.x += ((open ? -1.9 : 0) - d.rotation.x) * k
    else d.rotation.y += ((open ? -1.9 : 0) - d.rotation.y) * k
  })
  const onDown = (e) => {
    e.stopPropagation()
    if (closedKind && !open) go({ type: 'open', id })
  }
  const hl = hover && closedKind && !open ? 0.35 : 0
  const body = (c) => <meshStandardMaterial color={c} emissive="#ffd166" emissiveIntensity={hl} roughness={0.7} />
  const handlers = {
    onPointerDown: onDown,
    onPointerOver: (e) => { e.stopPropagation(); if (closedKind && !open) { setHover(true); setCursor('pointer') } },
    onPointerOut: () => { setHover(false); setCursor('default') },
  }
  const [x, , z] = f.pos
  let content = null
  switch (f.kind) {
    case 'shelf':
      content = (
        <group position={[x, 0, z]}>
          {[0.15, 1.05, 1.95, 2.85].map((y) => <mesh key={y} position={[0, y, 0]}><boxGeometry args={[2.6, 0.08, 0.7]} /><meshStandardMaterial color="#8a7d6a" /></mesh>)}
          {[-1.3, 1.3].map((sx) => <mesh key={sx} position={[sx, 1.5, 0]}><boxGeometry args={[0.08, 3, 0.7]} /><meshStandardMaterial color="#6d6252" /></mesh>)}
          {/* latas de decoración en el estante de arriba */}
          {[-0.8, -0.3, 0.2].map((cx) => (
            <mesh key={cx} position={[cx, 3.1, 0]}><cylinderGeometry args={[0.17, 0.17, 0.4, 12]} /><meshStandardMaterial color="#d94a3d" /></mesh>
          ))}
        </group>
      )
      break
    case 'wallcab':
      content = (
        <group position={[x, 1.9, z + 0.35]} {...handlers}>
          <mesh>{<boxGeometry args={[1.7, 1.5, 0.7]} />}{body('#d9d4c6')}</mesh>
          <mesh position={[0, 0, 0.36]}><boxGeometry args={[1.5, 1.3, 0.02]} /><meshStandardMaterial color="#2a2a2a" /></mesh>
          <group ref={door} position={[-0.85, 0, 0.37]}>
            <mesh position={[0.85, 0, 0]}><boxGeometry args={[1.7, 1.5, 0.06]} />{body('#ecebe4')}</mesh>
            <mesh position={[0.85, 0, 0.04]}><boxGeometry args={[0.7, 0.2, 0.02]} /><meshStandardMaterial color="#2fbf5a" emissive="#1d8f3d" emissiveIntensity={0.6} /></mesh>
            <mesh position={[0.85, 0, 0.04]}><boxGeometry args={[0.2, 0.7, 0.02]} /><meshStandardMaterial color="#2fbf5a" emissive="#1d8f3d" emissiveIntensity={0.6} /></mesh>
          </group>
        </group>
      )
      break
    case 'locker':
      content = (
        <group position={[x, 0, z]} {...handlers}>
          <mesh position={[0, 1.6, 0]}><boxGeometry args={[1.5, 3.2, 1]} />{body('#6f7a63')}</mesh>
          <mesh position={[0, 1.6, 0.51]}><boxGeometry args={[1.3, 3, 0.02]} /><meshStandardMaterial color="#1f221b" /></mesh>
          <group ref={door} position={[-0.75, 1.6, 0.53]}>
            <mesh position={[0.75, 0, 0]}><boxGeometry args={[1.5, 3.2, 0.06]} />{body('#7f8b71')}</mesh>
            {[0.9, 1.1, 1.3].map((y) => <mesh key={y} position={[0.75, y, 0.04]}><boxGeometry args={[0.9, 0.06, 0.02]} /><meshStandardMaterial color="#3b4234" /></mesh>)}
            <mesh position={[1.3, 0, 0.06]}><boxGeometry args={[0.08, 0.4, 0.06]} /><meshStandardMaterial color="#c9c9c9" metalness={0.8} /></mesh>
          </group>
        </group>
      )
      break
    case 'glasscase':
      content = (
        <group position={[x, 0, z]} {...handlers}>
          <mesh position={[0, 1.5, 0]}><boxGeometry args={[2, 3, 0.8]} />{body('#3d4236')}</mesh>
          <mesh position={[0, 1.5, 0.41]}><boxGeometry args={[1.8, 2.8, 0.02]} /><meshStandardMaterial color="#14160f" /></mesh>
          {/* franjas de peligro */}
          <mesh position={[0, 3.05, 0.42]}><boxGeometry args={[2, 0.12, 0.02]} /><meshStandardMaterial color="#ffd166" /></mesh>
          <group ref={door} position={[-1, 1.5, 0.44]}>
            <mesh position={[1, 0, 0]}><boxGeometry args={[2, 3, 0.04]} /><meshStandardMaterial color="#bfe7ff" transparent opacity={0.25} emissive="#ffd166" emissiveIntensity={hl} /></mesh>
          </group>
          <pointLight position={[0, 2.6, 0.2]} color="#9fe3ff" intensity={4} distance={3} />
        </group>
      )
      break
    case 'drawers':
      content = (
        <group position={[x, 0, z]} {...handlers}>
          <mesh position={[0, 0.8, 0]}><boxGeometry args={[1.2, 1.6, 1.8]} />{body('#b0573a')}</mesh>
          {[0.35, 0.8].map((y) => <mesh key={y} position={[0.61, y, 0]}><boxGeometry args={[0.02, 0.38, 1.6]} /><meshStandardMaterial color="#8a3f28" /></mesh>)}
          <group ref={door}>
            <mesh position={[0.25, 1.27, 0]}><boxGeometry args={[0.9, 0.36, 1.6]} />{body('#c9653f')}</mesh>
            <mesh position={[0.72, 1.27, 0]}><boxGeometry args={[0.06, 0.08, 0.5]} /><meshStandardMaterial color="#ddd" metalness={0.8} /></mesh>
          </group>
        </group>
      )
      break
    case 'crate':
      content = (
        <group position={[x, 0, z]} {...handlers}>
          <mesh position={[0, 0.45, 0]}><boxGeometry args={[1.3, 0.9, 1.4]} />{body('#4f7d3b')}</mesh>
          <mesh position={[0, 0.46, 0.71]}><boxGeometry args={[0.4, 0.4, 0.02]} /><meshStandardMaterial color="#9be07b" emissive="#3d8f2a" emissiveIntensity={0.6} /></mesh>
          <group ref={door} position={[0, 0.92, -0.7]}>
            <mesh position={[0, 0, 0.7]}><boxGeometry args={[1.36, 0.1, 1.44]} />{body('#5f9147')}</mesh>
          </group>
        </group>
      )
      break
    case 'console':
      content = (
        <group position={[x, 0, z]}>
          <mesh position={[0, 0.5, 0]}><boxGeometry args={[3.4, 1, 1.4]} /><meshStandardMaterial color="#3d4a3a" /></mesh>
          <mesh position={[-0.6, 1.25, -0.2]} rotation={[-0.3, 0, 0]}><boxGeometry args={[1, 0.8, 0.5]} /><meshStandardMaterial color="#ddd8c4" /></mesh>
          <mesh position={[-0.6, 1.27, 0.03]} rotation={[-0.3, 0, 0]}><planeGeometry args={[0.8, 0.6]} /><meshBasicMaterial color="#f5f0c8" toneMapped={false} /></mesh>
          {[0.3, 0.6, 0.9].map((bx, i) => <mesh key={bx} position={[bx, 1.02, 0.4]}><cylinderGeometry args={[0.07, 0.07, 0.06, 10]} /><meshStandardMaterial color={['#ff5a5a', '#ffd166', '#7be07b'][i]} emissive={['#ff0000', '#b68200', '#2f8f3f'][i]} emissiveIntensity={0.8} /></mesh>)}
          <mesh position={[0, 1.6, -0.3]}><sphereGeometry args={[0.12, 10, 10]} /><meshBasicMaterial color="#b9ff7a" toneMapped={false} /></mesh>
        </group>
      )
      break
    case 'rack':
      content = (
        <group position={[x, 0, z]}>
          <mesh position={[0, 0.22, 0]}><boxGeometry args={[1.8, 0.08, 1]} /><meshStandardMaterial color="#7d7f70" /></mesh>
          {[-0.85, 0.85].map((sx) => <mesh key={sx} position={[sx, 0.9, 0]}><boxGeometry args={[0.08, 1.8, 1]} /><meshStandardMaterial color="#6a6c5e" /></mesh>)}
        </group>
      )
      break
    case 'bench':
      content = (
        <group position={[x, 0, z]}>
          <mesh position={[0, 0.95, 0]}><boxGeometry args={[2.4, 0.1, 1.2]} /><meshStandardMaterial color="#ddd8c4" /></mesh>
          {[[-1.1, -0.5], [1.1, -0.5], [-1.1, 0.5], [1.1, 0.5]].map(([lx, lz], i) => <mesh key={i} position={[lx, 0.47, lz]}><boxGeometry args={[0.08, 0.95, 0.08]} /><meshStandardMaterial color="#555" /></mesh>)}
          <mesh position={[-0.7, 1.15, 0.2]}><cylinderGeometry args={[0.12, 0.15, 0.3, 12]} /><meshStandardMaterial color="#9fe3ff" transparent opacity={0.7} /></mesh>
        </group>
      )
      break
    default:
      content = null
  }
  const showQ = closedKind && !open
  return (
    <>
      {content}
      {showQ && (
        <Html position={[x, f.kind === 'wallcab' ? 3.1 : f.kind === 'crate' || f.kind === 'drawers' ? 2.1 : 3.6, z + 0.6]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className={'furn-tag' + (hover ? ' hover' : '')}>❓</div>
        </Html>
      )}
      {open && f.empty && (
        <Html position={[x, 2.4, z + 0.8]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className="furn-tag">🕸️</div>
        </Html>
      )}
      {open && !f.empty && !hasItems && null}
    </>
  )
}

// ---------- Objetos ----------
function RoomItem({ entry, playerRef }) {
  const [hover, setHover] = useState(false)
  const group = useRef()
  const item = itemById(entry.id)
  const Model = ITEM_MODELS[entry.id]
  const spot = SPOTS[entry.key]
  const f = FURN[spot.furn]
  const open = useGame((s) => s.openFurn.includes(spot.furn))
  const accessible = !CLOSED_KINDS.has(f.kind) || open
  const carrying = useGame((s) => s.carrying)
  const loadedKeys = useGame((s) => s.roomItems.filter((r) => r.state === 'loaded').map((r) => r.key).join(','))

  useFrame((st, dt) => {
    const g = group.current
    if (!g) return
    let tx, ty, tz, ts
    if (entry.state === 'carried') {
      const idx = carrying.indexOf(entry.key)
      const p = playerRef.current
      tx = p.x + (idx ? 0.6 : -0.6); ty = 1.2; tz = p.z + 0.5; ts = 0.7
    } else if (entry.state === 'loaded') {
      const idx = loadedKeys.split(',').indexOf(entry.key)
      tx = 10.3 + (idx % 2) * 0.7 - 0.35; tz = -2.3 + Math.floor(idx / 2) * 0.65; ty = 0.15; ts = 0.5
    } else {
      const s = spot.s || 1
      ;[tx, ty, tz] = spot.at
      if (hover && accessible) ty += 0.15 + Math.sin(st.clock.elapsedTime * 6) * 0.05
      ts = accessible ? (hover ? s * 1.15 : s) : s
    }
    const k = Math.min(1, dt * 12)
    g.position.x += (tx - g.position.x) * k
    g.position.y += (ty - g.position.y) * k
    g.position.z += (tz - g.position.z) * k
    const sc = g.scale.x + (ts - g.scale.x) * k
    g.scale.setScalar(sc)
  })

  const onDown = (e) => {
    e.stopPropagation()
    if (entry.state === 'shelf' && accessible) go({ type: 'pick', key: entry.key })
    else if (entry.state === 'shelf' && !accessible) go({ type: 'open', id: spot.furn })
    if (entry.state === 'loaded') useGame.getState().unload(entry.key)
  }
  // Dentro de un mueble cerrado no se ve (salvo la vitrina, que es de vidrio)
  const hidden = entry.state === 'shelf' && !accessible && f.kind !== 'glasscase'
  return (
    <group ref={group} position={spot.at} visible={!hidden}>
      <group
        onPointerDown={onDown}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); setCursor('pointer') }}
        onPointerOut={() => { setHover(false); setCursor('default') }}
      >
        <Model />
        <mesh position={[0, 0.6, 0]} visible={false}><boxGeometry args={[1.3, 1.3, 1.3]} /></mesh>
      </group>
      {entry.state === 'shelf' && accessible && (
        <Html position={[0, 1.6, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className={'item-tag' + (hover ? ' hover' : '')}>
            <span>{item.emoji}</span>
            {hover && <><b>{item.name}</b><small>⚖️ {item.mass}</small></>}
          </div>
        </Html>
      )}
    </group>
  )
}

// ---------- Tripulación de fondo (dan pistas) ----------
const HINTS = {
  engineer: ['🧰 → 🗄️', '🫧 → 🔒', '⚡🔋!'],
  botanist: ['🥔 → 📦🟩', '💧🛡️', '⛑️ → ➕'],
}
function CrewMember({ crew, position, hintOffset = 0, urgentRef }) {
  const [bubble, setBubble] = useState(null)
  const ref = useRef()
  useEffect(() => {
    let i = 0
    let hideT
    const show = () => {
      const urgent = urgentRef()
      setBubble(urgent ? '🌪️ ¡Rápido!' : HINTS[crew.id][i++ % HINTS[crew.id].length])
      hideT = setTimeout(() => setBubble(null), 2600)
    }
    const first = setTimeout(show, 1500 + hintOffset)
    const iv = setInterval(show, 7000)
    return () => { clearTimeout(first); clearInterval(iv); clearTimeout(hideT) }
  }, [crew.id, hintOffset, urgentRef])
  useFrame((st) => {
    if (ref.current) ref.current.position.y = Math.abs(Math.sin(st.clock.elapsedTime * 1.6 + hintOffset)) * 0.06
  })
  return (
    <group position={position}>
      <group ref={ref}>
        <Suspense fallback={null}><CharacterSprite src={crew.sprite} height={2.7} tilt={0.5} /></Suspense>
      </group>
      <Html position={[0, 3.2, -1.4]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        {bubble ? <div className="bubble small">{bubble}</div> : <div className="role-tag">{crew.emoji}</div>}
      </Html>
    </group>
  )
}

// ---------- Jugador ----------
const BUBBLES = {
  heavy: '🚫⚖️ ¡Muy pesado!',
  hands: '✋✋ ¡Manos llenas! → 🏠',
  loaded: '✅ ¡A la base!',
  empty: '🕸️ Vacío…',
}

function Player({ playerRef }) {
  const player = useGame((s) => s.player)
  const ch = getCharacter(player.character)
  const msg = useGame((s) => s.roomMsg)
  const group = useRef()
  const body = useRef()
  const target = useRef(new THREE.Vector3(0, 0, 2.6))
  const pending = useRef(null)
  const marker = useRef()
  const [flip, setFlip] = useState(false)
  const [bubble, setBubble] = useState(null)

  useEffect(() => {
    if (!msg || !BUBBLES[msg.type]) return
    setBubble(BUBBLES[msg.type])
    const t = setTimeout(() => setBubble(null), 1500)
    return () => clearTimeout(t)
  }, [msg])

  useEffect(() => {
    const onGo = (ev) => {
      const d = ev.detail
      if (d.type === 'pick') {
        target.current.set(...FURN[SPOTS[d.key].furn].front)
        pending.current = d
      } else if (d.type === 'open') {
        target.current.set(...FURN[d.id].front)
        pending.current = d
      } else if (d.type === 'drop') {
        target.current.set(HATCH.x - 1, 0, HATCH.z)
        pending.current = d
      } else if (d.type === 'walk') {
        target.current.set(d.x, 0, d.z)
        pending.current = null
      }
      clampTarget(target.current)
      if (marker.current) { marker.current.position.set(target.current.x, 0.05, target.current.z); marker.current.material.opacity = 1 }
    }
    window.addEventListener('room-go', onGo)
    return () => window.removeEventListener('room-go', onGo)
  }, [playerRef])

  useFrame((st, dt) => {
    const p = playerRef.current
    const t = target.current
    const dx = t.x - p.x, dz = t.z - p.z
    const dist = Math.hypot(dx, dz)
    const moving = dist > 0.06
    if (moving) {
      const step = Math.min(dist, SPEED * dt)
      p.x += (dx / dist) * step
      p.z += (dz / dist) * step
      if (Math.abs(dx) > 0.05) { const f = dx < 0; if (f !== flip) setFlip(f) }
    } else if (pending.current) {
      const a = pending.current
      pending.current = null
      const s = useGame.getState()
      if (a.type === 'pick') s.pickItem(a.key)
      if (a.type === 'drop') s.depositAll()
      if (a.type === 'open') {
        s.openFurniture(a.id)
        if (FURN[a.id].empty) s.say('empty')
      }
    }
    const s = useGame.getState()
    if (s.carrying.length && Math.hypot(p.x - HATCH.x, p.z - HATCH.z) < DROP_RADIUS) s.depositAll()

    if (group.current) group.current.position.set(p.x, 0, p.z)
    if (body.current) {
      const time = st.clock.elapsedTime
      body.current.position.y = moving ? Math.abs(Math.sin(time * 11)) * 0.14 : 0
      body.current.rotation.z = moving ? Math.sin(time * 11) * 0.05 : 0
    }
    if (marker.current) marker.current.material.opacity = Math.max(0, marker.current.material.opacity - dt * 1.5)
  })

  return (
    <>
      <group ref={group}>
        <group ref={body}>
          <Suspense fallback={null}><CharacterSprite src={ch.sprite} height={3.1} flip={flip} tilt={0.55} /></Suspense>
        </group>
        <Html position={[0, 3.4, -1.6]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          {bubble ? <div className="bubble">{bubble}</div> : player.name ? <div className="name-tag">⭐ {player.name}</div> : null}
        </Html>
      </group>
      <mesh ref={marker} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 2.6]}>
        <ringGeometry args={[0.3, 0.45, 32]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}

function clampTarget(v) {
  v.x = THREE.MathUtils.clamp(v.x, BOUNDS.x[0], BOUNDS.x[1])
  v.z = THREE.MathUtils.clamp(v.z, BOUNDS.z[0], BOUNDS.z[1])
  return v
}

// Compuerta hacia la base
function Hatch({ carrying }) {
  const glow = useRef()
  useFrame((st) => {
    if (glow.current) glow.current.material.opacity = carrying ? 0.35 + Math.sin(st.clock.elapsedTime * 5) * 0.25 : 0.12
  })
  return (
    <group>
      <mesh position={[11.35, 2.2, -1]}><boxGeometry args={[0.2, 4.4, 4.4]} /><meshStandardMaterial color="#ffb347" emissive="#ff7a1a" emissiveIntensity={1.2} /></mesh>
      <mesh position={[11.3, 2.2, -1]}><boxGeometry args={[0.25, 4, 3.6]} /><meshBasicMaterial color="#ffd8a8" /></mesh>
      <mesh ref={glow} position={[HATCH.x, 0.03, HATCH.z]} rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(e) => { e.stopPropagation(); go({ type: 'drop' }) }}
        onPointerOver={() => setCursor('pointer')} onPointerOut={() => setCursor('default')}>
        <circleGeometry args={[DROP_RADIUS, 40]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <mesh position={[HATCH.x, 0.04, HATCH.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[DROP_RADIUS - 0.12, DROP_RADIUS, 48]} />
        <meshBasicMaterial color="#ffd166" />
      </mesh>
      <Html position={[10.6, 4.9, -1]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className="room-sign">🏠</div>
      </Html>
      <pointLight position={[9.5, 3, -1]} color="#ffb347" intensity={carrying ? 30 : 12} distance={8} />
    </group>
  )
}

function CamRig() {
  const { camera, size } = useThree()
  const base = useRef(new THREE.Vector3())
  useEffect(() => {
    const aspect = size.width / size.height
    const k = aspect < 1.3 ? 1.3 / aspect : 1
    base.current.set(0, 13 * k, 13 * k)
    camera.position.copy(base.current)
    camera.lookAt(0, 0, -2.2)
    camera.clearViewOffset?.()
    camera.updateProjectionMatrix()
  }, [camera, size])
  // la nave tiembla cuando la tormenta está muy cerca
  useFrame(() => {
    const left = useGame.getState().roomLeft
    const shake = left !== null && left <= 6 ? 0.08 : 0
    camera.position.set(base.current.x + (Math.random() - 0.5) * shake, base.current.y + (Math.random() - 0.5) * shake, base.current.z)
  })
  return null
}

export default function Room() {
  const roomItems = useGame((s) => s.roomItems)
  const openFurn = useGame((s) => s.openFurn)
  const carrying = useGame((s) => s.carrying.length > 0)
  const floorTex = useTileTexture('#4f5546', '#3a3f33', [11, 7])
  const playerRef = useRef(new THREE.Vector3(0, 0, 2.6))
  const dustRef = useMemo(() => () => {
    const left = useGame.getState().roomLeft
    return left === null ? 0 : 1 - left / 60
  }, [])
  const urgentRef = useMemo(() => () => {
    const left = useGame.getState().roomLeft
    return left !== null && left <= 12
  }, [])
  const onFloor = (e) => {
    e.stopPropagation()
    go({ type: 'walk', x: e.point.x, z: e.point.z })
  }
  return (
    <>
      <CamRig />
      <color attach="background" args={['#14161f']} />
      <ambientLight intensity={0.5} />
      <hemisphereLight args={['#f1e6c8', '#3a2f2a', 0.55]} />
      <directionalLight position={[6, 14, 8]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={10} shadow-camera-bottom={-10} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.3, 0, -0.6]} receiveShadow onPointerDown={onFloor}>
        <planeGeometry args={[23, 13.4]} />
        <meshStandardMaterial map={floorTex} roughness={0.85} />
      </mesh>
      <Cabin dustRef={dustRef} />
      {Object.entries(FURN).map(([id, f]) => (
        <Furniture key={id} id={id} f={f} open={openFurn.includes(id)} hasItems={roomItems.some((r) => SPOTS[r.key].furn === id && r.state === 'shelf')} />
      ))}
      <Hatch carrying={carrying} />
      <CrewMember crew={CREW[0]} position={[3.6, 0, -3.4]} hintOffset={0} urgentRef={urgentRef} />
      <CrewMember crew={CREW[1]} position={[-6.4, 0, -3.6]} hintOffset={3500} urgentRef={urgentRef} />
      {roomItems.map((r) => <RoomItem key={r.key} entry={r} playerRef={playerRef} />)}
      <Player playerRef={playerRef} />
    </>
  )
}
