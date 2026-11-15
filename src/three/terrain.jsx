import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { fbm, rng } from './noise'

export const FLAT_R = 13

export function terrainHeight(x, z) {
  const d = Math.hypot(x, z)
  const n = fbm(x * 0.035 + 3, z * 0.035 + 7, 5)
  const ridges = Math.pow(fbm(x * 0.012, z * 0.012, 3), 2) * 26
  let h = (n - 0.5) * 6 + ridges - 3
  const t = THREE.MathUtils.smoothstep(d, FLAT_R, FLAT_R + 18)
  return h * t - 0.02
}

export function Terrain() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(260, 260, 180, 180)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position
    const colors = []
    const cA = new THREE.Color('#7a2f14'), cB = new THREE.Color('#c0602c'), cC = new THREE.Color('#e3a06a')
    const tmp = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i)
      const y = terrainHeight(x, z)
      pos.setY(i, y)
      const k = THREE.MathUtils.clamp((y + 4) / 18, 0, 1)
      const grain = fbm(x * 0.3, z * 0.3, 2) * 0.25
      tmp.copy(cA).lerp(cB, Math.min(1, k * 1.6 + grain)).lerp(cC, Math.max(0, k - 0.55))
      colors.push(tmp.r, tmp.g, tmp.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    g.computeVertexNormals()
    return g
  }, [])
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors roughness={1} />
    </mesh>
  )
}

export function Rocks() {
  const ref = useRef()
  const N = 160
  const data = useMemo(() => {
    const r = rng(42)
    const arr = []
    for (let i = 0; i < N; i++) {
      const ang = r() * Math.PI * 2
      const dist = FLAT_R + 1 + r() * 70
      const x = Math.cos(ang) * dist, z = Math.sin(ang) * dist
      const s = 0.2 + Math.pow(r(), 3) * 1.6
      arr.push({ x, z, y: terrainHeight(x, z), s, rx: r() * 3, ry: r() * 3 })
    }
    return arr
  }, [])
  const setRef = (mesh) => {
    if (!mesh || ref.current) return
    ref.current = mesh
    const m = new THREE.Object3D()
    data.forEach((d, i) => {
      m.position.set(d.x, d.y + d.s * 0.3, d.z)
      m.rotation.set(d.rx, d.ry, 0)
      m.scale.setScalar(d.s)
      m.updateMatrix()
      mesh.setMatrixAt(i, m.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }
  return (
    <instancedMesh ref={setRef} args={[null, null, N]} castShadow>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#6b2c16" roughness={1} flatShading />
    </instancedMesh>
  )
}

