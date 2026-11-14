import { useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

/** Personaje 2D "de cartón" dentro del mundo 3D (estilo papel). Los pies quedan en y=0. */
export default function CharacterSprite({ src, height = 2.4, flip = false, shadow = true, tilt = 0 }) {
  const tex = useTexture(src)
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
  }, [tex])
  const aspect = tex.image ? tex.image.width / tex.image.height : 0.5
  const w = height * aspect
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
          <meshBasicMaterial map={tex} transparent alphaTest={0.35} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
