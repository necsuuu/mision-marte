import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { applySurfaces } from './surfaces'
import { PerformanceMonitor } from '@react-three/drei'
import { useGame } from '../game/store'

/**
 * Calidad gráfica: en modo liviano se apagan las sombras y se baja la resolución.
 * Además, si la compu no llega a buen ritmo de cuadros, baja la resolución sola.
 */
export default function Quality() {
  const lite = useGame((s) => s.lite)
  const { gl, scene, setDpr } = useThree()
  useEffect(() => {
    gl.shadowMap.enabled = !lite
    setDpr(lite ? 1 : Math.min(window.devicePixelRatio || 1, 1.75))
    scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true)) })
  }, [lite, gl, scene, setDpr])
  // Texturas reales (grano, relieve, desgaste): se revisan los materiales nuevos cada medio segundo. En modo liviano se sacan.
  const tick = useRef(0)
  useEffect(() => { window.__scene = scene; applySurfaces(scene, !lite) }, [lite, scene])
  useFrame(() => { if (++tick.current % 30 === 0) applySurfaces(scene, !lite) })
  return <PerformanceMonitor onDecline={() => setDpr(1)} flipflops={2} />
}
