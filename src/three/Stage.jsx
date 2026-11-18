import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGame, gfxTier } from '../game/store'
import { view } from '../game/clocks'
import Planet from './Planet'
import MarsBase from './MarsBase'
import Room from './Room'
import Launch from './Launch'
import Quality, { quality, DPR } from './Quality'
import PauseClock from './PauseClock'

/**
 * Dibuja la escena, salvo cuando la computadora del juego la tapa por completo.
 * Las animaciones siguen corriendo igual (solo se saltea casi todo el dibujado), así al volver todo está donde debe.
 */
function RenderGate() {
  const n = useRef(0)
  const avg = useRef(1 / 60)
  const odd = useRef(false)
  useFrame(({ gl, scene, camera }, dt) => {
    // pantallas de 120/144 Hz: se dibuja un cuadro sí y uno no (~60-72 por segundo). En las de 60 Hz se dibujan todos:
    // se mira el promedio de varios cuadros para no saltear ninguno por un cuadro que llegó un poquito antes.
    avg.current += (Math.min(dt, 0.1) - avg.current) * 0.05
    if (avg.current < 1 / 90) {
      odd.current = !odd.current
      if (odd.current) return
    }
    // tapada: solo 1 de cada 30 cuadros, para que todo quede listo (sin tirones) cuando se vuelve a ver
    if (view.covered && ++n.current % 30 !== 0) return
    // sombras: en el escalón 2 se recalculan un cuadro sí y uno no
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = quality.tier < 2 || (++quality.frame & 1) === 0
    gl.render(scene, camera)
  }, 1)
  return null
}

/** Escenario 3D completo (un solo Canvas que va cambiando de escena). */
export default function Stage() {
  const screen = useGame((s) => s.screen)
  const paused = useGame((s) => s.paused)
  const finishLanding = useGame((s) => s.finishLanding)
  const finishLaunch = useGame((s) => s.finishLaunch)
  const tier = useGame(gfxTier)
  const shadows = tier < 3 // en gráficos livianos, sin sombras
  const dpr = Math.min(window.devicePixelRatio || 1, DPR[tier])
  const onBase = screen === 'sol' || screen === 'end' || screen === 'landing'
  const inRoom = screen === 'loading' || screen === 'tutorial'
  // En el título y en la selección de personaje hay una ilustración de fondo: ahí no se dibuja nada en 3D
  const still = screen === 'title' || screen === 'character' || screen === 'mode' // pantallas con fondo propio: el 3D no dibuja nada
  const planetOffset = [3.6, -1.6, -3]
  return (
    <Canvas
      shadows={shadows}
      frameloop={paused || still ? 'never' : 'always'}
      dpr={dpr}
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ powerPreference: 'high-performance' }}
    >
      <Quality />
      <PauseClock />
      <RenderGate />
      <Suspense fallback={null}>{screen === 'launch' ? <Launch onDone={finishLaunch} /> : onBase ? <MarsBase key={screen === 'landing' ? 'cine' : 'base'} cinematic={screen === 'landing'} onCineDone={finishLanding} /> : inRoom ? <Room /> : still ? null : <Planet offset={planetOffset} />}</Suspense>
    </Canvas>
  )
}
