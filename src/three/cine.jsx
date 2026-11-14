import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Reloj compartido de la cinemática de aterrizaje.
// Fuera de la cinemática (active=false) todo se muestra completo.
export const cine = { active: false, t: 0 }

const clamp01 = (v) => Math.max(0, Math.min(1, v))
export const ease = (v) => v * v * (3 - 2 * v)
export const progress = (start, dur) => (cine.active ? ease(clamp01((cine.t - start) / dur)) : 1)

/**
 * Envoltorio de despliegue: anima a su contenido durante la cinemática.
 * mode: grow (escala), rise (sube desde el piso), inflate (escala en Y), pop (con rebote)
 */
export function Deploy({ start = 0, dur = 1, mode = 'grow', children, ...props }) {
  const ref = useRef()
  useFrame(() => {
    const g = ref.current
    if (!g) return
    const p = progress(start, dur)
    g.visible = p > 0.001
    if (mode === 'grow') g.scale.setScalar(Math.max(0.001, p))
    if (mode === 'inflate') g.scale.set(Math.max(0.001, 0.6 + p * 0.4), Math.max(0.001, p), Math.max(0.001, 0.6 + p * 0.4))
    if (mode === 'rise') g.position.y = (p - 1) * 4
    if (mode === 'pop') {
      const b = p < 1 ? p * (1 + Math.sin(p * Math.PI) * 0.35) : 1
      g.scale.setScalar(Math.max(0.001, b))
    }
  })
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  )
}
