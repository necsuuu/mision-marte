import { Environment, Lightformer } from '@react-three/drei'

/**
 * Entorno para los reflejos: sin esto los metales se ven grises y "de plástico".
 * Se arma con paneles de luz dentro del juego (no descarga ninguna imagen).
 * kind: 'mars' (cielo naranja y suelo rojizo) o 'ship' (luces de techo de la nave).
 */
export default function Reflections({ kind = 'mars', intensity = 0.35 }) {
  const mars = kind === 'mars'
  return (
    <Environment resolution={64} frames={1} environmentIntensity={intensity}>
      <color attach="background" args={[mars ? '#5a2c1a' : '#15171c']} />
      {/* cielo / techo */}
      <Lightformer form="rect" intensity={mars ? 2.2 : 3} color={mars ? '#ffc79a' : '#fff1d6'} position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[mars ? 30 : 14, mars ? 30 : 5, 1]} />
      {/* sol o lámparas laterales */}
      <Lightformer form="circle" intensity={mars ? 6 : 2} color={mars ? '#fff0dc' : '#ffd9a0'} position={[8, 6, 6]} scale={mars ? 3 : 4} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={mars ? 0.8 : 1.4} color={mars ? '#ff9a5c' : '#9fc4ff'} position={[-9, 2, -4]} scale={[6, 4, 1]} target={[0, 0, 0]} />
      {/* suelo */}
      <Lightformer form="rect" intensity={mars ? 0.9 : 0.35} color={mars ? '#b4552a' : '#4a4f42'} position={[0, -6, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[30, 30, 1]} />
    </Environment>
  )
}
