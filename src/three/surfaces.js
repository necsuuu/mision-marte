// Superficies "reales": en vez de colores lisos (que se ven como plástico), cada material recibe
// grano, relieve, desgaste y manchas calculados en la placa de video (ruido 3D procedural).
// No usa imágenes: funciona sin internet y sobre cualquier forma, sin costuras.
import * as THREE from 'three'
//
// Tipos de superficie:
//   1 metal    → cepillado, rayones finos y manchas de uso
//   2 pintura  → piel de naranja, mugre en zonas grandes y saltaduras
//   3 roca     → relieve fuerte en varias escalas, granos y piedritas (suelo de Marte, rocas)
//   4 tela     → trama tejida y arrugas (domo inflable, paracaídas)
// Se elige solo según el material (metalness, flatShading...) o a mano con userData={{ surf: 'tela' }}.

const KINDS = { metal: 1, pintura: 2, roca: 3, tela: 4 }

// Optimización: el mismo ruido que antes se calculaba con cuentas en cada píxel, ahora se lee de una
// textura 3D chiquita (64³, 256 KB) que se genera una sola vez. Mismos valores, una lectura en vez de 8 cuentas.
// Solo las ondas grandes que dan relieve (roca, arrugas de tela) siguen calculándose, porque ahí hace falta precisión.
const N = 64
let noiseTex = null
function getNoiseTexture() {
  if (noiseTex) return noiseTex
  const data = new Uint8Array(N * N * N)
  const fr = (v) => v - Math.floor(v)
  const f32 = Math.fround
  let k = 0
  for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    // misma fórmula que sHash() del shader
    let px = f32(fr(f32(x * 0.3183099 + 0.1)) * 17), py = f32(fr(f32(y * 0.3183099 + 0.1)) * 17), pz = f32(fr(f32(z * 0.3183099 + 0.1)) * 17)
    data[k++] = Math.round(fr(f32(px * py * pz * (px + py + pz))) * 255)
  }
  noiseTex = new THREE.Data3DTexture(data, N, N, N)
  noiseTex.format = THREE.RedFormat
  noiseTex.type = THREE.UnsignedByteType
  noiseTex.minFilter = noiseTex.magFilter = THREE.LinearFilter
  noiseTex.wrapS = noiseTex.wrapT = noiseTex.wrapR = THREE.RepeatWrapping
  noiseTex.unpackAlignment = 1
  noiseTex.needsUpdate = true
  return noiseTex
}

const VERT_DECL = /* glsl */ `
varying vec3 vSurfPos;
`
const VERT_MAIN = /* glsl */ `
  // posición propia del objeto (así la textura no "nada" cuando el objeto se mueve), en escala real
  float surfScale = length(modelMatrix[0].xyz);
  #ifdef USE_INSTANCING
    surfScale *= length(instanceMatrix[0].xyz);
  #endif
  vSurfPos = position * surfScale;
`

const FRAG_DECL = /* glsl */ `
varying vec3 vSurfPos;
float sHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float sNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(sHash(i), sHash(i + vec3(1, 0, 0)), f.x), mix(sHash(i + vec3(0, 1, 0)), sHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(sHash(i + vec3(0, 0, 1)), sHash(i + vec3(1, 0, 1)), f.x), mix(sHash(i + vec3(0, 1, 1)), sHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float sFbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * sNoise(p); p = p * 2.03 + 7.1; a *= 0.5; } return clamp((s - 0.22) / 0.5, 0.0, 1.0); }
// Lo mismo, leyendo la textura de ruido: la interpolación suave se hace corriendo la coordenada (una sola lectura).
uniform highp sampler3D sNoiseTex;
float sTex(vec3 x) { vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f); return textureLod(sNoiseTex, (i + f + 0.5) / 64.0, 0.0).r; }
float sFbmT(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * sTex(p); p = p * 2.03 + 7.1; a *= 0.5; } return clamp((s - 0.22) / 0.5, 0.0, 1.0); }
`

// Después de calcular el color base: variación de color, y se guarda el relieve (sH) y el cambio de rugosidad (sRough)
const FRAG_COLOR = /* glsl */ `
  vec3 sp = vSurfPos;
  float sPx = length(fwidth(sp));           // cuánto mide un píxel sobre la superficie
  float sH = 0.0;                            // altura del relieve
  float sRough = 0.0;                        // cambio de rugosidad
  float sBump = 0.0;                         // fuerza del relieve
  #if SURF_KIND == 1
    float sFade = clamp(1.0 - sPx * 30.0, 0.0, 1.0);
    float streak = 0.5, scratch = 0.0;
    if (sFade > 0.0) {   // de lejos el detalle fino no se ve: no se calcula
      streak = sTex(vec3(sp.x * 5.0, sp.y * 90.0, sp.z * 5.0)) * 0.6 + sTex(vec3(sp.x * 90.0, sp.y * 5.0, sp.z * 90.0)) * 0.4;
      scratch = smoothstep(0.80, 0.86, sTex(vec3(sp.x * 6.0 + sp.y * 3.0, sp.y * 140.0, sp.z * 9.0)));
    }
    float grime = sFbmT(sp * 1.6 + 11.0);
    float stain = smoothstep(0.4, 0.8, grime);
    diffuseColor.rgb *= mix(1.0, 0.86 + 0.26 * streak, sFade);
    diffuseColor.rgb *= mix(1.0, 0.72, stain * 0.8);
    diffuseColor.rgb += scratch * sFade * 0.10;
    sH = (streak * 0.7 - scratch * 0.6) * 0.004;
    sRough = (streak - 0.5) * 0.35 * sFade + stain * 0.3 - scratch * sFade * 0.15;
    sBump = sFade;
  #elif SURF_KIND == 2
    float sFade = clamp(1.0 - sPx * 22.0, 0.0, 1.0);
    float fine = 0.5, chips = 0.0;
    if (sFade > 0.0) {
      fine = sFbmT(sp * 48.0);
      chips = smoothstep(0.70, 0.76, sTex(sp * 19.0) * 0.6 + sTex(sp * 63.0) * 0.4);
    }
    float grime = sFbmT(sp * 1.1 + 3.0);
    float stain = smoothstep(0.45, 0.9, grime);
    float streaks = smoothstep(0.45, 0.9, sFbmT(vec3(sp.x * 5.0, sp.y * 0.5, sp.z * 5.0) + 4.0));   // chorreaduras verticales
    diffuseColor.rgb *= mix(1.0, 0.86 + 0.26 * fine, sFade);
    diffuseColor.rgb *= mix(1.0, 0.76, stain * 0.8);
    diffuseColor.rgb *= 1.0 - streaks * 0.12;
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.42 + 0.03, chips * sFade * 0.55);
    sH = (fine * 0.6 - chips * 0.9) * 0.003;
    sRough = -0.12 + (fine - 0.5) * 0.3 * sFade + stain * 0.2 + chips * sFade * 0.25;
    sBump = sFade;
  #elif SURF_KIND == 3
    float sFade = clamp(1.0 - sPx * 5.0, 0.0, 1.0);
    float sFadeFine = clamp(1.0 - sPx * 20.0, 0.0, 1.0);
    float big = sFbm(sp * 0.9);
    float med = sFbmT(sp * 6.0 + 5.0);
    float fine = 0.5, pebble = 0.0;
    if (sFadeFine > 0.0) {
      fine = sTex(sp * 42.0);
      pebble = smoothstep(0.80, 0.86, sTex(sp * 17.0)) * sFadeFine;
    }
    float dust = smoothstep(0.35, 0.7, sFbmT(sp * 0.35 + 20.0));
    float ripple = sin(sp.x * 2.6 + sp.z * 1.1 + big * 5.0) * 0.5 + 0.5;            // ondas de arena
    float shade = big * 0.5 + med * 0.35 * sFade + fine * 0.15 * sFadeFine;
    diffuseColor.rgb *= 0.62 + 0.70 * shade;
    diffuseColor.rgb *= 0.94 + 0.10 * ripple * sFade;
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.12, 0.98, 0.86), dust * 0.6);   // polvo más claro y anaranjado
    diffuseColor.rgb *= 1.0 - pebble * 0.45;
    sH = big * 0.30 + med * 0.07 * sFade + ripple * 0.03 * sFade + fine * 0.008 * sFadeFine + pebble * 0.012;
    sRough = (med - 0.5) * 0.2;
    sBump = 1.0;
  #elif SURF_KIND == 4
    float sFade = clamp(1.0 - sPx * 60.0, 0.0, 1.0);
    vec3 w = sp * 170.0;
    float weave = (sin(w.x) * sin(w.y) + sin(w.y) * sin(w.z) + sin(w.z) * sin(w.x)) / 3.0;
    float wrinkle = sFbm(sp * vec3(2.0, 7.0, 2.0) + 2.0);
    float grime = smoothstep(0.4, 0.85, sFbmT(sp * 0.8 + 9.0));
    diffuseColor.rgb *= mix(1.0, 0.93 + 0.12 * weave, sFade);
    diffuseColor.rgb *= 0.88 + 0.2 * wrinkle;
    diffuseColor.rgb *= mix(1.0, 0.74, grime * 0.8);
    sH = weave * 0.0012 * sFade + wrinkle * 0.06;
    sRough = 0.05 + grime * 0.15;
    sBump = 1.0;
  #endif
`
const FRAG_ROUGH = /* glsl */ `
  roughnessFactor = clamp(roughnessFactor + sRough, 0.08, 1.0);
`
// Relieve: inclina la normal según la pendiente de sH (sin necesitar mapas ni coordenadas UV)
const FRAG_NORMAL = /* glsl */ `
  {
    vec3 sDx = dFdx(-vViewPosition), sDy = dFdy(-vViewPosition);
    float sHx = dFdx(sH), sHy = dFdy(sH);
    vec3 sR1 = cross(sDy, normal), sR2 = cross(normal, sDx);
    float sDet = dot(sDx, sR1);
    vec3 sGrad = sign(sDet) * (sHx * sR1 + sHy * sR2);
    normal = normalize(abs(sDet) * normal - sBump * sGrad);
  }
`

function patch(shader) {
  shader.uniforms.sNoiseTex = { value: getNoiseTexture() }
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\n' + VERT_DECL)
    .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VERT_MAIN)
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\n' + FRAG_DECL)
    .replace('#include <map_fragment>', '#include <map_fragment>\n' + FRAG_COLOR)
    .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + FRAG_ROUGH)
    .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + FRAG_NORMAL)
}
const noPatch = () => {}

/** Qué tipo de superficie le toca a un material (0 = dejarlo como está). */
function kindOf(m) {
  if (!m.isMeshStandardMaterial) return 0
  const forced = m.userData?.surf
  if (forced === 'lisa') return 0
  if (forced) return KINDS[forced] || 0
  if (m.transparent || m.opacity < 1 || m.toneMapped === false) return 0 // vidrios, luces
  if (m.flatShading || m.vertexColors) return 3
  if (m.metalness >= 0.45) return 1
  return 2
}

/** Aplica (o saca, en modo liviano) las superficies a todos los materiales de la escena. Devuelve cuántos cambió. */
export function applySurfaces(scene, on) {
  let changed = 0
  scene.traverse((o) => {
    if (!o.material) return
    for (const m of [].concat(o.material)) {
      const want = on ? kindOf(m) : 0
      if ((m.__surf || 0) === want) continue
      m.__surf = want
      m.defines = { ...(m.defines || {}) }
      if (want) { m.defines.SURF_KIND = want; m.onBeforeCompile = patch }
      else { delete m.defines.SURF_KIND; m.onBeforeCompile = noPatch }
      m.needsUpdate = true
      changed++
    }
  })
  return changed
}
