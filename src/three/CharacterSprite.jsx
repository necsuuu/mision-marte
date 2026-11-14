import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { WALK_SEQUENCE } from '../game/characters'

/**
 * Personaje 2D "de cartón" dentro del mundo 3D. Los pies quedan en y=0.
 * - frames: [quieto, izq, der] → cuando movingRef() devuelve true, camina a ~9 cuadros por segundo.
 * - src: una sola imagen (sin animación).
 */
export default function CharacterSprite({ src, frames, movingRef, height = 2.4, flip = false, shadow = true, tilt = 0, fps = 9 }) {
  const list = frames || [src]
  const texs = useTexture(list)
  const arr = Array.isArray(texs) ? texs : [texs]
  useMemo(() => {
    arr.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4 })
  }, [arr])
  const mat = useRef()
  const clock = useRef(0)
  const aspect = arr[0].image ? arr[0].image.width / arr[0].image.height : 0.5
  const w = height * aspect
  useFrame((_, dt) => {
    if (!mat.current || arr.length < 2) return
    const moving = movingRef ? movingRef() : false
    clock.current = moving ? clock.current + dt : 0
    const idx = moving ? WALK_SEQUENCE[Math.floor(clock.current * fps) % WALK_SEQUENCE.length] : 0
    const tex = arr[Math.min(idx, arr.length - 1)]
    if (mat.current.map !== tex) { mat.current.map = tex; mat.current.needsUpdate = true }
  })
  return (
    <group>
      {shadow && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[w * 0.42, 24]} />
          <meshBasicMaterial color="#000" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      )}
      <group rotation={[-tilt, 0, 0]}>
        <mesh position={[0, height / 2, 0]} scale={[flip ? -1 : 1, 1, 1]}>
          <planeGeometry args={[w, height]} />
          <meshBasicMaterial ref={mat} map={arr[0]} transparent alphaTest={0.35} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
