import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useGame } from '../game/store'

/** Al salir de la pausa, reinicia el reloj de la escena para que nada "salte" por el tiempo pausado. */
export default function PauseClock() {
  const paused = useGame((s) => s.paused)
  const clock = useThree((s) => s.clock)
  useEffect(() => {
    if (!paused) clock.getDelta()
  }, [paused, clock])
  return null
}
