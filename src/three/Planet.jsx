import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect } from 'react'
import { Stars } from '@react-three/drei'
import * as THREE from 'three'
import { fbm } from './noise'

// Textura de Marte generada por código (el CSP del artifact no deja cargar imágenes externas)
function useMarsTexture() {
  return useMemo(() => {
    const w = 1024, h = 512
    const c = document.createElement('canvas')
    c.width = w; c.height = h
    const ctx = c.getContext('2d')
    const img = ctx.createImageData(w, h)
    for (let y = 0; y < h; y++) {
      const lat = Math.abs(y / h - 0.5) * 2
      for (let x = 0; x < w; x++) {
        const u = x / w
        // muestreo cilíndrico para que la textura cierre sin costura
        const ang = u * Math.PI * 2
        const nx = Math.cos(ang) * 2.2, nz = Math.sin(ang) * 2.2
        const n = fbm(nx + 10, nz + y / 90, 6)
        const n2 = fbm(nx * 3 + 4, nz * 3 + y / 30, 4)
        let r = 150 + n * 110 - n2 * 40
        let g = 62 + n * 55 - n2 * 20
        let b = 30 + n * 25
        // zonas oscuras tipo "Syrtis Major", con borde suave
        const dark = 1 - Math.min(1, Math.max(0, (n - 0.36) / 0.12))
        const k = 1 - dark * 0.33
        r *= k; g *= k * 0.95; b *= k
        // casquetes polares
        if (lat > 0.88) { const t = Math.min(1, (lat - 0.88) / 0.06); r = r + (240 - r) * t; g = g + (236 - g) * t; b = b + (230 - b) * t }
        const i = (y * w + x) * 4
        img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [])
}

function Atmosphere() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { color: { value: new THREE.Color('#ff9a5c') } },
        vertexShader: `varying vec3 vN;
          void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `uniform vec3 color; varying vec3 vN;
          void main(){ float f = pow(clamp(0.62 + dot(vN, vec3(0.,0.,1.)), 0., 1.), 4.0); gl_FragColor = vec4(color, f*0.9); }`,
      }),
    []
  )
  return <mesh material={mat} scale={1.09}><sphereGeometry args={[2.4, 64, 64]} /></mesh>
}

export default function Planet({ offset = [2.2, 0, 0] }) {
  const tex = useMarsTexture()
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, 0, 8)
    camera.lookAt(0, 0, 0)
    camera.clearViewOffset()
    camera.updateProjectionMatrix()
  }, [camera])
  const ref = useRef()
  const holder = useRef()
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.06
    if (holder.current) {
      const k = Math.min(1, dt * 2.5)
      holder.current.position.x += (offset[0] - holder.current.position.x) * k
      holder.current.position.y += (offset[1] - holder.current.position.y) * k
      holder.current.position.z += (offset[2] - holder.current.position.z) * k
    }
  })
  return (
    <>
      <color attach="background" args={['#05060d']} />
      <Stars radius={80} depth={40} count={4000} factor={3} fade speed={0.6} />
      <ambientLight intensity={0.12} />
      <directionalLight position={[-6, 2, 5]} intensity={2.6} color="#fff2e0" />
      <group ref={holder} rotation={[0.1, 0, 0.44]}>
        <mesh ref={ref}>
          <sphereGeometry args={[2.4, 128, 128]} />
          <meshStandardMaterial map={tex} roughness={1} metalness={0} />
        </mesh>
        <Atmosphere />
      </group>
    </>
  )
}
