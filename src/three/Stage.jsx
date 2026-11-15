import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGame } from '../game/store'
import { view } from '../game/clocks'
import Planet from './Planet'
import MarsBase from './MarsBase'
import Room from './Room'
import Launch from './Launch'
import Quality from './Quality'
import PauseClock from './PauseClock'

/**
 * Dibuja la escena, salvo cuando la computadora del juego la tapa por completo.
 * Las animaciones siguen corriendo igual (solo se saltea casi todo el dibujado), así al volver todo está donde debe.
 */
function RenderGate() {
  const n = useRef(0)
  useFrame(({ gl, scene, camera }) => {
    // tapada: solo 1 de cada 30 cuadros, para que todo quede listo (sin tirones) cuando se vuelve a ver
    if (!view.covered || ++n.current % 30 === 0) gl.render(scene, camera)
  }, 1)
  return null
}

/** Escenario 3D completo (un solo Canvas que va cambiando de escena). */
export default function Stage() {
  const screen = useGame((s) => s.screen)
  const paused = useGame((s) => s.paused)
  const finishLanding = useGame((s) => s.finishLanding)
  const finishLaunch = useGame((s) => s.finishLaunch)
  const onBase = screen === 'sol' || screen === 'end' || screen === 'landing'
  const inRoom = screen === 'loading' || screen === 'tutorial'
  const planetOffset = screen === 'title' ? [2.4, -0.2, 0] : screen === 'character' ? [4.6, -2.2, -4] : [3.6, -1.6, -3]
  return (
    <Canvas
      shadows
      frameloop={paused || screen === 'title' ? 'never' : 'always'}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ powerPreference: 'high-performance' }}
    >
      <Quality />
      <PauseClock />
      <RenderGate />
      <Suspense fallback={null}>{screen === 'launch' ? <Launch onDone={finishLaunch} /> : onBase ? <MarsBase key={screen === 'landing' ? 'cine' : 'base'} cinematic={screen === 'landing'} onCineDone={finishLanding} /> : inRoom ? <Room /> : screen === 'title' ? null : <Planet offset={planetOffset} />}</Suspense>
    </Canvas>
  )
}
