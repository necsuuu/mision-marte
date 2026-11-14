import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
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
  return <PerformanceMonitor onDecline={() => setDpr(1)} flipflops={2} />
}
