// Interior de la nave: 3 módulos (médico · cabina · ingeniería). El comandante camina (click o WASD),
// abre muebles, agarra objetos (que en cada partida están en lugares distintos) y los lleva a la base.
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useGame } from '../game/store'
import { ITEMS } from '../game/content'
import { getCharacter, CREW } from '../game/characters'
import { FURN, CLOSED_KINDS, slotById, HATCH, START, SECTORS, sectorAt } from '../game/shipLayout'
import { findPath, walkable } from '../game/pathfinding'
import { t, locItem } from '../i18n/core'
import { ITEM_MODELS } from './items3d'
import CharacterSprite from './CharacterSprite'

const SPEED = 6.5
const REACH = 2.1
const itemById = (id) => ITEMS.find((i) => i.id === id)
const setCursor = (c) => (document.body.style.cursor = c)
const go = (detail) => window.dispatchEvent(new CustomEvent('room-go', { detail }))
const isOpen = (furnId) => !CLOSED_KINDS.has(FURN[furnId].kind) || useGame.getState().openFurn.includes(furnId)

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
    const tx = new THREE.CanvasTexture(c)
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping
    tx.repeat.set(...repeat)
    tx.colorSpace = THREE.SRGBColorSpace
    return tx
  }, [base, line, repeat])
}

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
    g.fillStyle = '#ece6dc'; g.beginPath(); g.arc(300, 400, 46, Math.PI, 0); g.fill()
    g.fillStyle = '#1d3b8f'; g.fillRect(380, 390, 50, 8); g.fillRect(440, 385, 50, 8)
    const tx = new THREE.CanvasTexture(c)
    tx.colorSpace = THREE.SRGBColorSpace
    return tx
  }, [])
}

// ---------- Estructura de la nave ----------
function Porthole({ x, tex, dustRef }) {
  const dust = useRef()
  useFrame(() => { if (dust.current) dust.current.material.opacity = Math.min(0.92, dustRef()) })
  return (
    <group position={[x, 3.4, -6.8]}>
      <mesh><torusGeometry args={[1.25, 0.22, 16, 48]} /><meshStandardMaterial color="#2f3428" metalness={0.5} /></mesh>
      <mesh><circleGeometry args={[1.2, 48]} /><meshBasicMaterial map={tex} toneMapped={false} /></mesh>
      <mesh ref={dust} position={[0, 0, 0.01]}><circleGeometry args={[1.2, 48]} /><meshBasicMaterial color="#7a4a2a" transparent opacity={0} /></mesh>
    </group>
  )
}

function Bulkhead({ x }) {
  // pared entre módulos con su puerta (marco amarillo y negro)
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 3, -4.2]}><boxGeometry args={[0.5, 6, 5.6]} /><meshStandardMaterial color="#555c4a" /></mesh>
      <mesh position={[0, 0.7, 4.6]}><boxGeometry args={[0.5, 1.4, 4]} /><meshStandardMaterial color="#555c4a" /></mesh>
      <mesh position={[0, 4.6, 0.6]}><boxGeometry args={[0.6, 0.35, 4]} /><meshStandardMaterial color="#ffd166" /></mesh>
      {[-1.4, 2.6].map((z) => (
        <mesh key={z} position={[0, 2.3, z]}><boxGeometry args={[0.6, 4.6, 0.25]} /><meshStandardMaterial color="#2b2b2b" /></mesh>
      ))}
    </group>
  )
}

function SectorSign({ sector, lang }) {
  const cx = (sector.x0 + sector.x1) / 2
  return (
    <Html pointerEvents="none" position={[cx, 5.4, -6.8]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
      <div className="sector-sign" style={{ '--c': sector.color }}>{sector.emoji} {t(lang, 'sector.' + sector.id)}</div>
    </Html>
  )
}

function Ship({ dustRef }) {
  const lang = useGame((s) => s.lang)
  const left = useGame((s) => s.roomLeft)
  const wallTex = useTileTexture('#5f6652', '#4a5040', [24, 2])
  const medWall = useTileTexture('#cfd8d6', '#a9b5b2', [8, 2])
  const engWall = useTileTexture('#5c5248', '#463d35', [8, 2])
  const port = usePortholeTexture()
  const alarm = useRef()
  useFrame((st) => {
    const d = dustRef()
    if (alarm.current) alarm.current.intensity = d > 0.8 ? 30 + Math.sin(st.clock.elapsedTime * 10) * 25 : 0
  })
  return (
    <group>
      {/* paredes del fondo: un color por módulo */}
      <mesh position={[-22.75, 3, -7]}><boxGeometry args={[22.5, 6, 0.3]} /><meshStandardMaterial map={medWall} roughness={0.9} /></mesh>
      <mesh position={[0, 3, -7]}><boxGeometry args={[23, 6, 0.3]} /><meshStandardMaterial map={wallTex} roughness={0.9} /></mesh>
      <mesh position={[22.75, 3, -7]}><boxGeometry args={[22.5, 6, 0.3]} /><meshStandardMaterial map={engWall} roughness={0.9} /></mesh>
      {/* paredes de las puntas */}
      <mesh position={[-34.2, 3, -0.4]}><boxGeometry args={[0.4, 6, 13.4]} /><meshStandardMaterial map={medWall} /></mesh>
      <mesh position={[34.2, 3, -0.4]}><boxGeometry args={[0.4, 6, 13.4]} /><meshStandardMaterial map={engWall} /></mesh>
      <Bulkhead x={-11.5} />
      <Bulkhead x={11.5} />
      <Porthole x={-3.6} tex={port} dustRef={dustRef} />
      <Porthole x={-25} tex={port} dustRef={dustRef} />
      {/* caños */}
      <mesh position={[0, 5.6, -6.7]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.12, 0.12, 68, 8]} /><meshStandardMaterial color="#7d7f70" metalness={0.5} /></mesh>
      <mesh position={[0, 5.25, -6.7]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.06, 0.06, 68, 8]} /><meshStandardMaterial color="#b0573a" /></mesh>
      {/* lámparas (pocas luces para que ande en compus modestas) */}
      {[[-22, 5, -3, '#e8f6ff'], [-4, 5, -3, '#ffd27a'], [6, 5, -3, '#ffd27a'], [23, 5, -3, '#ffb36b']].map(([x, y, z, c], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh><sphereGeometry args={[0.18, 12, 12]} /><meshBasicMaterial color={c} toneMapped={false} /></mesh>
          <pointLight color={c} intensity={30} distance={16} />
        </group>
      ))}
      <pointLight ref={alarm} position={[0, 5, -5]} color="#ff2a2a" intensity={0} distance={40} />
      {SECTORS.map((sec) => <SectorSign key={sec.id} sector={sec} lang={lang} />)}
      <Html pointerEvents="none" position={[9.4, 4.6, -6.8]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className="flip-counter">{String(left ?? 60).padStart(3, '0')}</div>
      </Html>
      <MedicalDecor />
      <EngineeringDecor />
      <CabinDecor />
    </group>
  )
}

function MedicalDecor() {
  return (
    <group>
      {/* camilla */}
      <group position={[-24.2, 0, -5.6]}>
        <mesh position={[0, 0.55, 0]}><boxGeometry args={[4.4, 0.25, 1.8]} /><meshStandardMaterial color="#e9eef2" /></mesh>
        <mesh position={[0, 0.75, 0]}><boxGeometry args={[4.2, 0.18, 1.6]} /><meshStandardMaterial color="#6fb4d8" /></mesh>
        <mesh position={[-1.7, 0.95, 0]}><boxGeometry args={[0.7, 0.2, 1.2]} /><meshStandardMaterial color="#ffffff" /></mesh>
        {[-2, 2].map((x) => <mesh key={x} position={[x, 0.25, 0]}><boxGeometry args={[0.15, 0.5, 1.6]} /><meshStandardMaterial color="#9aa5ab" /></mesh>)}
      </group>
      {/* suero */}
      <group position={[-21.5, 0, -5]}>
        <mesh position={[0, 1.3, 0]}><cylinderGeometry args={[0.04, 0.04, 2.6, 6]} /><meshStandardMaterial color="#bbb" metalness={0.7} /></mesh>
        <mesh position={[0.2, 2.3, 0]}><boxGeometry args={[0.25, 0.4, 0.1]} /><meshStandardMaterial color="#cfefff" transparent opacity={0.8} /></mesh>
      </group>
      {/* cruz verde grande */}
      <group position={[-12.8, 3.6, -6.8]}>
        <mesh><boxGeometry args={[1.4, 0.4, 0.05]} /><meshStandardMaterial color="#2fbf5a" emissive="#1d8f3d" emissiveIntensity={0.8} /></mesh>
        <mesh><boxGeometry args={[0.4, 1.4, 0.05]} /><meshStandardMaterial color="#2fbf5a" emissive="#1d8f3d" emissiveIntensity={0.8} /></mesh>
      </group>
    </group>
  )
}

function EngineeringDecor() {
  const core = useRef()
  useFrame((st) => { if (core.current) core.current.material.emissiveIntensity = 1.2 + Math.sin(st.clock.elapsedTime * 3) * 0.5 })
  return (
    <group>
      {/* reactor */}
      <group position={[29, 0, -5.1]}>
        <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[1.2, 1.3, 3.2, 20]} /><meshStandardMaterial color="#4a4f55" metalness={0.6} /></mesh>
        <mesh ref={core} position={[0, 1.6, 0]}><cylinderGeometry args={[0.6, 0.6, 3.3, 16]} /><meshStandardMaterial color="#7fe9ff" emissive="#2ab5ff" emissiveIntensity={1.2} transparent opacity={0.85} /></mesh>
        {[0.5, 1.6, 2.7].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.32, 0.08, 8, 32]} /><meshStandardMaterial color="#ffd166" /></mesh>)}
      </group>
      {/* franjas de peligro en el piso */}
      {[[18, 1], [30, 0]].map(([x], i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.02, -2.9]}>
          <planeGeometry args={[3, 0.4]} />
          <meshBasicMaterial color={i ? '#ffd166' : '#ffd166'} />
        </mesh>
      ))}
    </group>
  )
}

function CabinDecor() {
  // asientos naranjas como en la ilustración
  return (
    <group>
      {[[-4, 2.5, 0.3], [4.6, 2.8, -0.3]].map(([x, z, r], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, r, 0]}>
          <mesh position={[0, 0.55, 0]}><boxGeometry args={[1.2, 0.3, 1.1]} /><meshStandardMaterial color="#e89a2c" /></mesh>
          <mesh position={[0, 1.2, -0.45]}><boxGeometry args={[1.2, 1.2, 0.25]} /><meshStandardMaterial color="#e89a2c" /></mesh>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.12, 0.2, 0.4, 8]} /><meshStandardMaterial color="#555" /></mesh>
        </group>
      ))}
    </group>
  )
}

// ---------- Muebles ----------
/** Caja hueca (abierta adelante) para que los objetos de adentro se vean al abrir la puerta. */
function Hollow({ w, h, d, body, inner, shelves = [], open }) {
  const t = 0.06
  const innerMat = <meshStandardMaterial color={inner} emissive="#fff3c4" emissiveIntensity={open ? 0.35 : 0} roughness={0.8} />
  return (
    <group>
      <mesh position={[0, 0, -d / 2 + t / 2]}><boxGeometry args={[w, h, t]} />{innerMat}</mesh>
      <mesh position={[-w / 2 + t / 2, 0, 0]}><boxGeometry args={[t, h, d]} />{body}</mesh>
      <mesh position={[w / 2 - t / 2, 0, 0]}><boxGeometry args={[t, h, d]} />{body}</mesh>
      <mesh position={[0, h / 2 - t / 2, 0]}><boxGeometry args={[w, t, d]} />{body}</mesh>
      <mesh position={[0, -h / 2 + t / 2, 0]}><boxGeometry args={[w, t, d]} />{body}</mesh>
      {shelves.map((y) => <mesh key={y} position={[0, y, 0]}><boxGeometry args={[w - t * 2, t, d - t]} />{innerMat}</mesh>)}
    </group>
  )
}

function Furniture({ id, f, open, empty }) {
  const door = useRef()
  const [mouseHover, setHover] = useState(false)
  const focused = useGame((s) => s.roomFocus === 'open:' + id)
  const hover = mouseHover || focused
  const closedKind = CLOSED_KINDS.has(f.kind)
  useFrame((_, dt) => {
    const d = door.current
    if (!d) return
    const k = Math.min(1, dt * 7)
    if (f.kind === 'drawers') d.position.z += ((open ? 0.9 : 0) - d.position.z) * k
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
          {[-0.8, -0.3, 0.2].map((cx) => <mesh key={cx} position={[cx, 3.1, 0]}><cylinderGeometry args={[0.17, 0.17, 0.4, 12]} /><meshStandardMaterial color="#d94a3d" /></mesh>)}
        </group>
      )
      break
    case 'wallcab':
      content = (
        <group position={[x, 1.9, z + 0.35]} {...handlers}>
          <Hollow w={1.7} h={1.5} d={0.7} body={body('#d9d4c6')} inner="#f1efe6" open={open} />
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
          <group position={[0, 1.6, 0]}>
            <Hollow w={1.5} h={3.2} d={1} body={body(f.color || '#6f7a63')} inner="#dcdccf" shelves={[-0.46, 0.7]} open={open} />
          </group>
          <group ref={door} position={[-0.75, 1.6, 0.53]}>
            <mesh position={[0.75, 0, 0]}><boxGeometry args={[1.5, 3.2, 0.06]} />{body(f.color ? new THREE.Color(f.color).offsetHSL(0, 0, 0.05) : '#7f8b71')}</mesh>
            {[0.9, 1.1, 1.3].map((y) => <mesh key={y} position={[0.75, y, 0.04]}><boxGeometry args={[0.9, 0.06, 0.02]} /><meshStandardMaterial color="#3b4234" /></mesh>)}
            <mesh position={[1.3, 0, 0.06]}><boxGeometry args={[0.08, 0.4, 0.06]} /><meshStandardMaterial color="#c9c9c9" metalness={0.8} /></mesh>
          </group>
        </group>
      )
      break
    case 'glasscase':
      content = (
        <group position={[x, 0, z]} {...handlers}>
          <group position={[0, 1.5, 0]}>
            <Hollow w={2} h={3} d={0.8} body={body('#3d4236')} inner="#cfd8c8" shelves={[-0.47, 0.5]} open />
          </group>
          <mesh position={[0, 3.05, 0.42]}><boxGeometry args={[2, 0.12, 0.02]} /><meshStandardMaterial color="#ffd166" /></mesh>
          <group ref={door} position={[-1, 1.5, 0.44]}>
            <mesh position={[1, 0, 0]}><boxGeometry args={[2, 3, 0.04]} /><meshStandardMaterial color="#bfe7ff" transparent opacity={0.25} emissive="#ffd166" emissiveIntensity={hl} /></mesh>
          </group>
        </group>
      )
      break
    case 'drawers':
      content = (
        <group position={[x, 0, z]} {...handlers}>
          <mesh position={[0, 0.8, 0]}><boxGeometry args={[1.8, 1.6, 1.2]} />{body('#b0573a')}</mesh>
          {[0.35, 0.8].map((y) => <mesh key={y} position={[0, y, 0.61]}><boxGeometry args={[1.6, 0.38, 0.02]} /><meshStandardMaterial color="#8a3f28" /></mesh>)}
          <group ref={door}>
            <mesh position={[0, 1.27, 0.25]}><boxGeometry args={[1.6, 0.36, 0.9]} />{body('#c9653f')}</mesh>
            <mesh position={[0, 1.27, 0.72]}><boxGeometry args={[0.5, 0.08, 0.06]} /><meshStandardMaterial color="#ddd" metalness={0.8} /></mesh>
          </group>
        </group>
      )
      break
    case 'crate':
      content = (
        <group position={[x, 0, z]} {...handlers}>
          <mesh position={[0, 0.45, 0]}><boxGeometry args={[1.3, 0.9, 1.4]} />{body(f.color || '#4f7d3b')}</mesh>
          <mesh position={[0, 0.46, 0.71]}><boxGeometry args={[0.4, 0.4, 0.02]} /><meshStandardMaterial color="#ffd166" emissive="#b68200" emissiveIntensity={0.5} /></mesh>
          <group ref={door} position={[0, 0.92, -0.7]}>
            <mesh position={[0, 0, 0.7]}><boxGeometry args={[1.36, 0.1, 1.44]} />{body(f.color ? new THREE.Color(f.color).offsetHSL(0, 0, 0.06) : '#5f9147')}</mesh>
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
        </group>
      )
      break
    default:
      content = null
  }
  const showQ = closedKind && !open
  const tagY = f.kind === 'wallcab' ? 3.1 : f.kind === 'crate' || f.kind === 'drawers' ? 2.1 : 3.6
  return (
    <>
      {content}
      {showQ && (
        <Html pointerEvents="none" position={[x, tagY, z + 0.6]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className={'furn-tag' + (hover ? ' hover' : '')}>❓{focused && <kbd className="key-e">E</kbd>}</div>
        </Html>
      )}
      {open && closedKind && empty && (
        <Html pointerEvents="none" position={[x, tagY - 0.6, z + 0.8]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className="furn-tag">🕸️</div>
        </Html>
      )}
    </>
  )
}

// ---------- Objetos ----------
// Área de clic = caja exacta del modelo (un poco más grande para que sea fácil tocar)
function useHitbox(modelRef) {
  const [hit, setHit] = useState(null)
  useLayoutEffect(() => {
    const m = modelRef.current
    if (!m) return
    m.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(m)
    const min = m.worldToLocal(box.min.clone())
    const max = m.worldToLocal(box.max.clone())
    const size = max.clone().sub(min)
    const center = min.clone().add(max).multiplyScalar(0.5)
    setHit({ size: [size.x * 1.15 + 0.25, size.y * 1.1 + 0.2, size.z * 1.15 + 0.25], center: [center.x, center.y, center.z] })
  }, [modelRef])
  return hit
}

function RoomItem({ entry, playerRef }) {
  const [mouseHover, setHover] = useState(false)
  const focused = useGame((s) => s.roomFocus === 'pick:' + entry.key)
  const hover = mouseHover || focused
  const group = useRef()
  const modelRef = useRef()
  const hit = useHitbox(modelRef)
  const lang = useGame((s) => s.lang)
  const slot = slotById(useGame((s) => s.layout[entry.key]))
  const item = locItem(lang, itemById(entry.id))
  const Model = ITEM_MODELS[entry.id]
  const f = FURN[slot.furn]
  const open = useGame((s) => s.openFurn.includes(slot.furn))
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
      tx = HATCH.x - 1.6 + (idx % 4) * 0.8; tz = -6.2 + Math.floor(idx / 4) * 0.6; ty = 0.1; ts = 0.5
    } else {
      ;[tx, ty, tz] = slot.at
      if (f.kind === 'drawers' && open) tz += 0.9
      ts = (slot.s || 1) * (hover && accessible ? 1.12 : 1)
    }
    const k = Math.min(1, dt * 12)
    g.position.x += (tx - g.position.x) * k
    g.position.y += (ty - g.position.y) * k
    g.position.z += (tz - g.position.z) * k
    g.scale.setScalar(g.scale.x + (ts - g.scale.x) * k)
  })

  const onDown = (e) => {
    e.stopPropagation()
    if (entry.state === 'shelf' && accessible) go({ type: 'pick', key: entry.key })
    else if (entry.state === 'shelf') go({ type: 'open', id: slot.furn })
    if (entry.state === 'loaded') useGame.getState().unload(entry.key)
  }
  const hidden = entry.state === 'shelf' && !accessible && f.kind !== 'glasscase'
  return (
    <group ref={group} position={slot.at} visible={!hidden}>
      <group
        onPointerDown={onDown}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); setCursor('pointer') }}
        onPointerOut={() => { setHover(false); setCursor('default') }}
      >
        <group ref={modelRef}><Model /></group>
        {hit && (
          <mesh position={hit.center} userData={{ itemKey: entry.key }}>
            <boxGeometry args={hit.size} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
          </mesh>
        )}
      </group>
      {entry.state === 'shelf' && accessible && (
        <Html pointerEvents="none" position={[0, 1.6, 0]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          <div className={'item-tag' + (hover ? ' hover' : '')}>
            <span>{item.emoji}</span>
            {hover && <><b>{item.name}</b><small>⚖️ {item.mass}</small></>}
            {focused && <kbd className="key-e">E</kbd>}
          </div>
        </Html>
      )}
    </group>
  )
}

// ---------- Tripulación de fondo: pistas según dónde quedaron los objetos en esta partida ----------
function useHints() {
  const layout = useGame((s) => s.layout)
  return useMemo(() => {
    const out = []
    Object.entries(layout).forEach(([key, slotId]) => {
      const slot = slotById(slotId)
      const f = FURN[slot.furn]
      if (!CLOSED_KINDS.has(f.kind)) return
      const it = itemById(key.split('-')[0])
      const sec = sectorAt(f.pos[0])
      out.push(`${it.emoji} → ${sec.emoji}${f.icon}`)
    })
    return out.sort(() => Math.random() - 0.5)
  }, [layout])
}

function CrewMember({ crew, position, hintOffset = 0, urgentRef, hints, lang }) {
  const [bubble, setBubble] = useState(null)
  const ref = useRef()
  useEffect(() => {
    let i = hintOffset ? 1 : 0
    let hideT
    const show = () => {
      setBubble(urgentRef() ? t(lang, 'b.hurry') : hints[(i += 2) % Math.max(1, hints.length)] || null)
      hideT = setTimeout(() => setBubble(null), 2800)
    }
    const first = setTimeout(show, 1200 + hintOffset)
    const iv = setInterval(show, 6500)
    return () => { clearTimeout(first); clearInterval(iv); clearTimeout(hideT) }
  }, [hintOffset, urgentRef, hints, lang])
  useFrame((st) => {
    if (ref.current) ref.current.position.y = Math.abs(Math.sin(st.clock.elapsedTime * 1.6 + hintOffset)) * 0.06
  })
  return (
    <group position={position}>
      <group ref={ref}>
        <Suspense fallback={null}><CharacterSprite src={crew.sprite} height={2.7} tilt={0.5} /></Suspense>
      </group>
      <Html pointerEvents="none" position={[0, 3.2, -1.4]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        {bubble ? <div className="bubble small">{bubble}</div> : <div className="role-tag">{crew.emoji}</div>}
      </Html>
    </group>
  )
}

// ---------- Jugador ----------
const BUBBLE_KEYS = { heavy: 'b.heavy', hands: 'b.hands', loaded: 'b.loaded', empty: 'b.empty' }

/** Lo que el comandante tiene más cerca para interactuar con la tecla E. */
function nearestAction(p) {
  const s = useGame.getState()
  if (s.carrying.length && Math.hypot(p.x - HATCH.x, p.z - HATCH.z) < HATCH.r + 1.2) return { type: 'drop' }
  let best = null, bd = REACH
  s.roomItems.forEach((r) => {
    if (r.state !== 'shelf') return
    const slot = slotById(s.layout[r.key])
    if (!isOpen(slot.furn)) return
    const d = Math.hypot(p.x - slot.at[0], p.z - slot.at[2])
    if (d < bd + 0.6) { bd = d - 0.6; best = { type: 'pick', key: r.key } }
  })
  if (best) return best
  bd = REACH
  Object.entries(FURN).forEach(([id, f]) => {
    if (!CLOSED_KINDS.has(f.kind) || s.openFurn.includes(id)) return
    const d = Math.hypot(p.x - f.front[0], p.z - f.front[2])
    if (d < bd) { bd = d; best = { type: 'open', id } }
  })
  return best
}

function Player({ playerRef }) {
  const player = useGame((s) => s.player)
  const lang = useGame((s) => s.lang)
  const ch = getCharacter(player.character)
  const msg = useGame((s) => s.roomMsg)
  const group = useRef()
  const body = useRef()
  const path = useRef([])
  const pending = useRef(null)
  const marker = useRef()
  const keys = useRef({})
  const moving = useRef(false)
  const lastPub = useRef(0)
  const [flip, setFlip] = useState(false)
  const [bubble, setBubble] = useState(null)

  useEffect(() => {
    if (!msg || !BUBBLE_KEYS[msg.type]) return
    setBubble(t(lang, BUBBLE_KEYS[msg.type]))
    const tm = setTimeout(() => setBubble(null), 1500)
    return () => clearTimeout(tm)
  }, [msg, lang])

  const walkTo = (x, z, action) => {
    const p = playerRef.current
    path.current = findPath([p.x, p.z], [x, z])
    pending.current = action || null
    const last = path.current[path.current.length - 1]
    if (marker.current && last) { marker.current.position.set(last[0], 0.05, last[1]); marker.current.material.opacity = 1 }
  }

  const act = (a) => {
    const s = useGame.getState()
    if (a.type === 'pick') s.pickItem(a.key)
    if (a.type === 'drop') s.depositAll()
    if (a.type === 'open') { s.openFurniture(a.id); if (!s.roomItems.some((r) => r.state === 'shelf' && slotById(s.layout[r.key]).furn === a.id)) s.say('empty') }
  }

  useEffect(() => {
    const onGo = (ev) => {
      const d = ev.detail
      if (d.type === 'pick') { const f = FURN[slotById(useGame.getState().layout[d.key]).furn]; walkTo(f.front[0], f.front[2], d) }
      else if (d.type === 'open') walkTo(FURN[d.id].front[0], FURN[d.id].front[2], d)
      else if (d.type === 'drop') walkTo(HATCH.x, HATCH.z, d)
      else if (d.type === 'walk') walkTo(d.x, d.z, null)
    }
    const down = (e) => {
      if (e.target?.tagName === 'INPUT') return
      if (useGame.getState().screen !== 'loading') return // durante el tutorial la nave está de fondo, sin control
      const k = e.key.toLowerCase()
      keys.current[k] = true
      if (k === 'e' || k === ' ' || k === 'enter') {
        const a = nearestAction(playerRef.current)
        if (a) act(a)
        e.preventDefault()
      }
    }
    const up = (e) => { keys.current[e.key.toLowerCase()] = false }
    window.addEventListener('room-go', onGo)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('room-go', onGo); window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [playerRef])

  useFrame((st, dt) => {
    const p = playerRef.current
    const k = keys.current
    const kx = (k.d || k.arrowright ? 1 : 0) - (k.a || k.arrowleft ? 1 : 0)
    const kz = (k.s || k.arrowdown ? 1 : 0) - (k.w || k.arrowup ? 1 : 0)
    let mv = false
    if (kx || kz) {
      // Teclado: movimiento directo con choque contra muebles (se desliza por las paredes)
      path.current = []
      pending.current = null
      const len = Math.hypot(kx, kz)
      const step = SPEED * dt
      const nx = p.x + (kx / len) * step, nz = p.z + (kz / len) * step
      if (walkable(nx, p.z)) p.x = nx
      if (walkable(p.x, nz)) p.z = nz
      if (kx) { const f = kx < 0; if (f !== flip) setFlip(f) }
      mv = true
    } else if (path.current.length) {
      const [tx, tz] = path.current[0]
      const dx = tx - p.x, dz = tz - p.z
      const dist = Math.hypot(dx, dz)
      const step = Math.min(dist, SPEED * dt)
      if (dist > 0.04) {
        p.x += (dx / dist) * step
        p.z += (dz / dist) * step
        if (Math.abs(dx) > 0.05) { const f = dx < 0; if (f !== flip) setFlip(f) }
        mv = true
      } else path.current.shift()
    } else if (pending.current) {
      const a = pending.current
      pending.current = null
      act(a)
    }
    moving.current = mv
    const s = useGame.getState()
    if (s.carrying.length && Math.hypot(p.x - HATCH.x, p.z - HATCH.z) < HATCH.r) s.depositAll()
    if (st.clock.elapsedTime - lastPub.current > 0.15) {
      lastPub.current = st.clock.elapsedTime
      const a = s.screen === 'loading' ? nearestAction(p) : null
      const focus = a ? (a.type === 'pick' ? 'pick:' + a.key : a.type === 'open' ? 'open:' + a.id : 'drop') : null
      useGame.setState(focus === s.roomFocus ? { roomPlayerX: p.x } : { roomPlayerX: p.x, roomFocus: focus })
    }

    if (group.current) group.current.position.set(p.x, 0, p.z)
    if (body.current) body.current.position.y = mv ? Math.abs(Math.sin(st.clock.elapsedTime * 9)) * 0.08 : 0
    if (marker.current) marker.current.material.opacity = Math.max(0, marker.current.material.opacity - dt * 1.5)
  })

  const movingRef = useMemo(() => () => moving.current, [])
  return (
    <>
      <group ref={group} position={START}>
        <group ref={body}>
          <Suspense fallback={null}><CharacterSprite frames={ch.walk} movingRef={movingRef} height={3.1} flip={flip} tilt={0.55} /></Suspense>
        </group>
        <Html pointerEvents="none" position={[0, 3.4, -1.6]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
          {bubble ? <div className="bubble">{bubble}</div> : player.name ? <div className="name-tag">⭐ {player.name}</div> : null}
        </Html>
      </group>
      <mesh ref={marker} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 2.4]}>
        <ringGeometry args={[0.3, 0.45, 32]} />
        <meshBasicMaterial color="#ffd166" transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  )
}

// Compuerta hacia la base (en la pared del fondo de la cabina)
function Hatch({ carrying }) {
  const dropFocus = useGame((s) => s.roomFocus === 'drop')
  const glow = useRef()
  useFrame((st) => {
    if (glow.current) glow.current.material.opacity = carrying ? 0.35 + Math.sin(st.clock.elapsedTime * 5) * 0.25 : 0.12
  })
  return (
    <group>
      <mesh position={[HATCH.x, 2.2, -6.75]}><boxGeometry args={[3.6, 4.4, 0.2]} /><meshStandardMaterial color="#ffb347" emissive="#ff7a1a" emissiveIntensity={1.2} /></mesh>
      <mesh position={[HATCH.x, 2.1, -6.6]}><boxGeometry args={[2.9, 3.8, 0.1]} /><meshBasicMaterial color="#ffd8a8" /></mesh>
      <mesh ref={glow} position={[HATCH.x, 0.03, HATCH.z]} rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(e) => { e.stopPropagation(); go({ type: 'drop' }) }}
        onPointerOver={() => setCursor('pointer')} onPointerOut={() => setCursor('default')}>
        <circleGeometry args={[HATCH.r, 40]} />
        <meshBasicMaterial color="#ffb347" transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <mesh position={[HATCH.x, 0.04, HATCH.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[HATCH.r - 0.12, HATCH.r, 48]} />
        <meshBasicMaterial color="#ffd166" />
      </mesh>
      <Html pointerEvents="none" position={[HATCH.x, 4.9, -6.6]} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className="room-sign">🏠{dropFocus && <kbd className="key-e">E</kbd>}</div>
      </Html>
      <pointLight position={[HATCH.x, 3, -5]} color="#ffb347" intensity={carrying ? 30 : 12} distance={9} />
    </group>
  )
}

// La cámara sigue al comandante por la nave
function CamRig({ playerRef }) {
  const { camera, size, scene } = useThree()
  useEffect(() => { window.__room = { camera, scene } }, [camera, scene]) // para pruebas automáticas
  const k = useRef(1)
  const cx = useRef(0)
  useEffect(() => {
    const aspect = size.width / size.height
    k.current = aspect < 1.3 ? 1.3 / aspect : 1
    camera.clearViewOffset?.()
    camera.updateProjectionMatrix()
  }, [camera, size])
  useFrame((_, dt) => {
    const half = 34 - 12.5 / k.current
    const target = Math.max(-half, Math.min(half, playerRef.current.x))
    cx.current += (target - cx.current) * Math.min(1, dt * 3)
    const left = useGame.getState().roomLeft
    const shake = left !== null && left <= 6 ? 0.08 : 0
    camera.position.set(cx.current + (Math.random() - 0.5) * shake, 13 * k.current + (Math.random() - 0.5) * shake, 13 * k.current)
    camera.lookAt(cx.current, 0, -2.2)
  })
  return null
}

export default function Room() {
  const roomItems = useGame((s) => s.roomItems)
  const openFurn = useGame((s) => s.openFurn)
  const layout = useGame((s) => s.layout)
  const lang = useGame((s) => s.lang)
  const carrying = useGame((s) => s.carrying.length > 0)
  const floorTex = useTileTexture('#4f5546', '#3a3f33', [34, 7])
  const playerRef = useRef(new THREE.Vector3(...START))
  const hints = useHints()
  const dustRef = useMemo(() => () => {
    const left = useGame.getState().roomLeft
    return left === null ? 0 : 1 - left / 60
  }, [])
  const urgentRef = useMemo(() => () => {
    const left = useGame.getState().roomLeft
    return left !== null && left <= 12
  }, [])
  const usedFurn = useMemo(() => new Set(Object.values(layout).map((id) => slotById(id)?.furn)), [layout])
  const onFloor = (e) => {
    e.stopPropagation()
    go({ type: 'walk', x: e.point.x, z: e.point.z })
  }
  return (
    <>
      <CamRig playerRef={playerRef} />
      <color attach="background" args={['#14161f']} />
      <ambientLight intensity={0.55} />
      <hemisphereLight args={['#f1e6c8', '#3a2f2a', 0.6]} />
      <directionalLight position={[6, 14, 8]} intensity={1.1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.4]} onPointerDown={onFloor}>
        <planeGeometry args={[68.4, 13.4]} />
        <meshStandardMaterial map={floorTex} roughness={0.85} />
      </mesh>
      <Ship dustRef={dustRef} />
      {Object.entries(FURN).map(([id, f]) => (
        <Furniture key={id} id={id} f={f} open={openFurn.includes(id)} empty={!usedFurn.has(id) || !roomItems.some((r) => r.state === 'shelf' && slotById(layout[r.key])?.furn === id)} />
      ))}
      <Hatch carrying={carrying} />
      <CrewMember crew={CREW[0]} position={[22, 0, -3.6]} hintOffset={0} urgentRef={urgentRef} hints={hints} lang={lang} />
      <CrewMember crew={CREW[1]} position={[-16.5, 0, -3.4]} hintOffset={3000} urgentRef={urgentRef} hints={hints} lang={lang} />
      {roomItems.map((r) => <RoomItem key={r.key} entry={r} playerRef={playerRef} />)}
      <Player playerRef={playerRef} />
    </>
  )
}
