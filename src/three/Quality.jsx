import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { applySurfaces } from './surfaces'
import { PerformanceMonitor } from '@react-three/drei'
import { useGame, gfxTier } from '../game/store'

/**
 * Calidad gráfica en escalones. Si la compu no llega a buen ritmo de cuadros, baja sola un escalón por vez
 * y lo recuerda para la próxima. El botón ✨ ("gráficos livianos") fuerza el escalón 3.
 *
 *   0  resolución hasta 1.5×, sombras, texturas de superficie y desenfoque detrás de los paneles
 *   1  resolución 1×, sin desenfoque (es caro: el navegador re-desenfoca el 3D en cada cuadro)
 *   2  sin texturas de superficie y sombras a medio ritmo (un cuadro sí, uno no)
 *   3  sin sombras y resolución 0.85× (= gráficos livianos)
 *
 * Además, nunca se dibujan más de 60 cuadros por segundo (en pantallas de 120/144 Hz sería el doble de trabajo).
 */
export const quality = { tier: 0, frame: 0 }
/** Resolución máxima de cada escalón (la usa el Canvas en Stage.jsx). */
export const DPR = [1.5, 1, 1, 0.85]

export default function Quality() {
  const tier = useGame(gfxTier)
  const { gl, scene, camera } = useThree()
  quality.tier = tier

  useEffect(() => {
    // (las sombras y la resolución las maneja el Canvas con sus props, en Stage.jsx: si no, las pisa al cambiar de pantalla)
    gl.shadowMap.autoUpdate = false // se actualiza a mano en RenderGate (a medio ritmo en el escalón 2)
    gl.shadowMap.needsUpdate = true
    scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => (m.needsUpdate = true)) })
    document.documentElement.classList.toggle('no-blur', tier >= 1)
  }, [tier, gl, scene])

  // Texturas de superficie (grano, relieve, desgaste): se revisan los materiales nuevos cada medio segundo.
  const surf = tier <= 1
  const tick = useRef(0)
  useEffect(() => { window.__scene = scene; window.__gl = gl; window.__cam = camera; applySurfaces(scene, surf) }, [surf, scene, gl, camera])
  useFrame(() => { if (++tick.current % 30 === 0) applySurfaces(scene, surf) })

  return <PerformanceMonitor onDecline={() => useGame.getState().gfxDown()} flipflops={3} />
}
