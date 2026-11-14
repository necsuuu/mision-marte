// Modelos 3D simples (hechos con formas básicas) de cada objeto que se puede llevar a Marte.
const M = ({ c, e, r = 0.6, m = 0.1, ...p }) => <meshStandardMaterial color={c} emissive={e || '#000'} emissiveIntensity={e ? 0.6 : 0} roughness={r} metalness={m} {...p} />

function Panel() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.05, 0.05, 0.7, 8]} /><M c="#999" m={0.6} /></mesh>
      <mesh position={[0, 0.75, 0]} rotation={[-0.6, 0, 0]}><boxGeometry args={[1.2, 0.05, 0.8]} /><M c="#1f3f9a" e="#0b2a7a" r={0.25} m={0.5} /></mesh>
      {[-0.3, 0, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.78, 0.02]} rotation={[-0.6, 0, 0]}><boxGeometry args={[0.02, 0.06, 0.8]} /><M c="#c9d6ff" /></mesh>
      ))}
    </group>
  )
}
function Battery() {
  return (
    <group>
      <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.3, 0.3, 0.8, 20]} /><M c="#2fbf71" e="#0e5c34" /></mesh>
      <mesh position={[0, 0.85, 0]}><cylinderGeometry args={[0.12, 0.12, 0.1, 12]} /><M c="#ddd" m={0.7} /></mesh>
      <mesh position={[0, 0.5, 0.31]}><boxGeometry args={[0.1, 0.3, 0.02]} /><M c="#fff" e="#fff" /></mesh>
    </group>
  )
}
function Moxie() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]}><boxGeometry args={[0.8, 0.7, 0.6]} /><M c="#d4a73a" m={0.6} r={0.3} /></mesh>
      {[-0.22, 0, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.85, 0]}><cylinderGeometry args={[0.07, 0.07, 0.3, 10]} /><M c="#e9e9e9" m={0.6} /></mesh>
      ))}
      <mesh position={[0, 0.35, 0.31]}><circleGeometry args={[0.14, 20]} /><M c="#7fe9ff" e="#2ab5ff" /></mesh>
    </group>
  )
}
function Rations() {
  return (
    <group>
      {[[-0.2, 0, 0], [0.2, 0, 0], [0, 0.42, 0]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.17, 0.17, 0.4, 16]} /><M c="#d94a3d" /></mesh>
          <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.172, 0.172, 0.16, 16]} /><M c="#f3efe6" /></mesh>
        </group>
      ))}
    </group>
  )
}
function O2Tank() {
  return (
    <group>
      <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.25, 0.25, 1.1, 20]} /><M c="#f2f2f2" r={0.3} m={0.3} /></mesh>
      <mesh position={[0, 1.15, 0]}><sphereGeometry args={[0.25, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2]} /><M c="#f2f2f2" /></mesh>
      <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.255, 0.255, 0.15, 20]} /><M c="#2a8cff" e="#0c4fa8" /></mesh>
      <mesh position={[0, 1.42, 0]}><cylinderGeometry args={[0.06, 0.06, 0.15, 8]} /><M c="#888" m={0.8} /></mesh>
    </group>
  )
}
function Seeds() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} scale={[1, 0.8, 1]}><sphereGeometry args={[0.38, 16, 12]} /><M c="#a0733f" r={1} /></mesh>
      <mesh position={[0, 0.62, 0]}><cylinderGeometry args={[0.12, 0.2, 0.15, 10]} /><M c="#8a5e2f" /></mesh>
      <mesh position={[0, 0.82, 0]}><coneGeometry args={[0.12, 0.3, 6]} /><M c="#5ad16a" e="#1d7a2c" /></mesh>
      <mesh position={[0.12, 0.78, 0]} rotation={[0, 0, -0.9]}><coneGeometry args={[0.07, 0.22, 6]} /><M c="#5ad16a" e="#1d7a2c" /></mesh>
    </group>
  )
}
function Water() {
  return (
    <group>
      {[-0.22, 0.22].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.2, 0.2, 0.9, 16]} /><meshStandardMaterial color="#4fb7ff" transparent opacity={0.7} emissive="#1d6fd1" emissiveIntensity={0.5} /></mesh>
          <mesh position={[0, 0.93, 0]}><cylinderGeometry args={[0.08, 0.08, 0.08, 10]} /><M c="#1a3c6e" /></mesh>
        </group>
      ))}
    </group>
  )
}
function Repair() {
  return (
    <group>
      <mesh position={[0, 0.22, 0]}><boxGeometry args={[0.8, 0.44, 0.4]} /><M c="#d33a2c" r={0.4} m={0.3} /></mesh>
      <mesh position={[0, 0.5, 0]}><torusGeometry args={[0.16, 0.035, 8, 20, Math.PI]} /><M c="#333" /></mesh>
      <mesh position={[0, 0.25, 0.21]}><boxGeometry args={[0.15, 0.08, 0.02]} /><M c="#ddd" m={0.8} /></mesh>
    </group>
  )
}
function Medkit() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}><boxGeometry args={[0.7, 0.5, 0.45]} /><M c="#f5f5f5" /></mesh>
      <mesh position={[0, 0.25, 0.23]}><boxGeometry args={[0.36, 0.1, 0.02]} /><M c="#e23b3b" e="#a10000" /></mesh>
      <mesh position={[0, 0.25, 0.23]}><boxGeometry args={[0.1, 0.36, 0.02]} /><M c="#e23b3b" e="#a10000" /></mesh>
    </group>
  )
}
function Science() {
  return (
    <group>
      <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.6, 0.12, 0.45]} /><M c="#333a4a" /></mesh>
      <mesh position={[-0.12, 0.45, 0]} rotation={[0, 0, -0.25]}><boxGeometry args={[0.12, 0.7, 0.15]} /><M c="#e6e6e6" /></mesh>
      <mesh position={[0.08, 0.72, 0]} rotation={[0, 0, 0.55]}><cylinderGeometry args={[0.08, 0.06, 0.5, 12]} /><M c="#e6e6e6" /></mesh>
      <mesh position={[0.14, 0.3, 0]}><cylinderGeometry args={[0.15, 0.15, 0.03, 16]} /><M c="#ffd166" e="#b68200" /></mesh>
    </group>
  )
}

export const ITEM_MODELS = {
  panel: Panel, battery: Battery, moxie: Moxie, rations: Rations, o2tank: O2Tank,
  seeds: Seeds, water: Water, repair: Repair, medkit: Medkit, science: Science,
}
