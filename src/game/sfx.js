// 🔊 Sonido del juego: efectos y ambiente generados por código con Web Audio (no hay archivos de audio).
// Cada efecto es una "receta" de tonos y ruido. Se apaga con el botón 🔊 de la barra.
import { useGame, chipsUsed } from './store'

const AC = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null
export const soundSupported = !!AC

let ctx = null
let master = null
const on = () => soundSupported && useGame.getState().sound

function ensure() {
  if (!AC) return null
  if (!ctx) {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 1.5
    const comp = ctx.createDynamicsCompressor() // evita que dos sonidos juntos saturen
    master.connect(comp)
    comp.connect(ctx.destination)
  }
  return ctx
}

/** Los navegadores solo dejan sonar después de un toque o una tecla. */
export function unlock() {
  if (!on()) return
  const c = ensure()
  if (!c || useGame.getState().paused) return
  const ready = () => setAmbient(ambientFor(useGame.getState().screen))
  if (c.state === 'suspended') c.resume().then(ready).catch(() => {})
  else ready()
}

// ---------- Ladrillos: un tono y un soplo de ruido ----------
function tone(c, out, { f, f2, type = 'sine', t = 0, d = 0.15, g = 0.1, a = 0.006 }) {
  const o = c.createOscillator()
  const v = c.createGain()
  const t0 = c.currentTime + t
  o.type = type
  o.frequency.setValueAtTime(f, t0)
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d)
  v.gain.setValueAtTime(0.0001, t0)
  v.gain.exponentialRampToValueAtTime(g, t0 + a)
  v.gain.exponentialRampToValueAtTime(0.0001, t0 + d)
  o.connect(v)
  v.connect(out)
  o.start(t0)
  o.stop(t0 + d + 0.03)
}

const noiseBuf = new WeakMap()
function noiseBuffer(c) {
  let b = noiseBuf.get(c)
  if (!b) {
    b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
    const d = b.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    noiseBuf.set(c, b)
  }
  return b
}
/** Ruido filtrado. env = [[tiempo, volumen], ...] para dibujar cómo sube y baja. */
function noise(c, out, { t = 0, d = 0.2, g = 0.1, type = 'lowpass', freq = 1200, freq2, q = 0.7, env }) {
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c)
  src.loop = true
  const f = c.createBiquadFilter()
  f.type = type
  f.Q.value = q
  const t0 = c.currentTime + t
  f.frequency.setValueAtTime(freq, t0)
  if (freq2) f.frequency.exponentialRampToValueAtTime(freq2, t0 + d)
  const v = c.createGain()
  v.gain.setValueAtTime(0.0001, t0)
  if (env) env.forEach(([at, val]) => v.gain.linearRampToValueAtTime(Math.max(0.0001, val), t0 + at))
  else {
    v.gain.exponentialRampToValueAtTime(g, t0 + 0.01)
    v.gain.exponentialRampToValueAtTime(0.0001, t0 + d)
  }
  src.connect(f)
  f.connect(v)
  v.connect(out)
  src.start(t0)
  src.stop(t0 + d + 0.05)
}
const notes = (c, out, list, base = {}) => list.forEach(([f, t, d, g]) => tone(c, out, { ...base, f, t, d: d ?? base.d, g: g ?? base.g }))

// ---------- Recetas ----------
// Notas: do5=523, mi5=659, sol5=784, do6=1047
const RECIPES = {
  click: (c, o) => tone(c, o, { f: 880, f2: 660, d: 0.05, g: 0.05 }),
  pick: (c, o) => notes(c, o, [[523, 0, 0.09], [784, 0.07, 0.15]], { type: 'triangle', g: 0.12 }),
  deposit: (c, o) => {
    noise(c, o, { d: 0.12, g: 0.14, freq: 280 })
    notes(c, o, [[392, 0.02, 0.14], [523, 0.1, 0.14], [659, 0.18, 0.22]], { type: 'triangle', g: 0.1 })
  },
  open: (c, o) => {
    noise(c, o, { d: 0.22, g: 0.07, freq: 500, freq2: 2400 })
    tone(c, o, { f: 300, f2: 520, d: 0.16, g: 0.04 })
  },
  unload: (c, o) => tone(c, o, { f: 520, f2: 300, type: 'triangle', d: 0.13, g: 0.09 }),
  deny: (c, o) => notes(c, o, [[185, 0, 0.11], [150, 0.13, 0.16]], { type: 'triangle', g: 0.13 }),
  chip: (c, o) => tone(c, o, { f: 740, f2: 990, d: 0.06, g: 0.06 }),
  chipOff: (c, o) => tone(c, o, { f: 620, f2: 440, d: 0.06, g: 0.05 }),
  tick: (c, o) => tone(c, o, { f: 1250, d: 0.035, g: 0.05 }),
  beep: (c, o) => tone(c, o, { f: 660, d: 0.2, g: 0.11 }),
  alarm: (c, o) => {
    for (let i = 0; i < 3; i++) notes(c, o, [[740, i * 0.46, 0.2], [554, i * 0.46 + 0.22, 0.2]], { type: 'square', g: 0.035 })
  },
  storm: (c, o) => {
    // chasquidos tipo contador Geiger
    const at = [0, 0.09, 0.21, 0.26, 0.4, 0.47, 0.6, 0.66, 0.71, 0.9, 1.02, 1.2]
    at.forEach((t) => noise(c, o, { t, d: 0.02, g: 0.09, type: 'highpass', freq: 2500 }))
  },
  supply: (c, o) => notes(c, o, [[659, 0, 0.18], [784, 0.12, 0.18], [988, 0.24, 0.18], [1319, 0.36, 0.4]], { g: 0.08 }),
  good: (c, o) => notes(c, o, [[523, 0, 0.2], [659, 0.1, 0.2], [784, 0.2, 0.2], [1047, 0.3, 0.45]], { type: 'triangle', g: 0.1 }),
  bad: (c, o) => notes(c, o, [[392, 0, 0.24], [349, 0.2, 0.24], [294, 0.4, 0.24], [196, 0.6, 0.55]], { type: 'triangle', g: 0.11 }),
  dawn: (c, o) => notes(c, o, [[523, 0, 0.4], [659, 0.18, 0.4], [784, 0.36, 0.6]], { g: 0.05 }),
  night: (c, o) => notes(c, o, [[392, 0, 0.6], [294, 0.3, 0.9]], { g: 0.06 }),
  win: (c, o) => {
    notes(c, o, [[523, 0, 0.16], [659, 0.14, 0.16], [784, 0.28, 0.16], [1047, 0.42, 0.2]], { type: 'triangle', g: 0.1 })
    notes(c, o, [[1047, 0.64, 1.0], [1319, 0.64, 1.0], [1568, 0.64, 1.0]], { type: 'triangle', g: 0.07 })
  },
  lose: (c, o) => notes(c, o, [[392, 0, 0.3], [370, 0.28, 0.3], [349, 0.56, 0.3], [330, 0.84, 0.3], [196, 1.12, 1.0]], { g: 0.09 }),
  // despegue: trueno grave que sube, se sostiene y se va
  liftoff: (c, o) => {
    noise(c, o, { d: 5.5, freq: 160, freq2: 420, env: [[0.5, 0.32], [3.2, 0.3], [5.5, 0]] })
    tone(c, o, { f: 42, f2: 60, d: 5.2, g: 0.16, a: 0.5 })
  },
  // retrocohetes del aterrizaje
  retro: (c, o) => noise(c, o, { d: 3.4, freq: 300, freq2: 140, env: [[0.3, 0.26], [2.6, 0.22], [3.4, 0]] }),
}
const LONG = new Set(['liftoff', 'retro'])
let longOut = null

/** Toca un efecto por su nombre (si el sonido está prendido). */
export function play(name) {
  if (!on() || !RECIPES[name]) return
  const c = ensure()
  if (!c || c.state !== 'running') return
  let out = master
  if (LONG.has(name)) {
    longOut = c.createGain()
    longOut.connect(master)
    out = longOut
  }
  try { RECIPES[name](c, out) } catch { /* si algo falla, el juego sigue sin ese sonido */ }
}
/** Corta los sonidos largos (por ejemplo al saltear una cinemática). */
function stopLong() {
  if (!longOut || !ctx) return
  const g = longOut
  longOut = null
  g.gain.cancelScheduledValues(ctx.currentTime)
  g.gain.setTargetAtTime(0, ctx.currentTime, 0.08)
  setTimeout(() => g.disconnect(), 600)
}

// ---------- Ambiente: zumbido de la nave / viento de Marte ----------
let amb = null // { kind, gain, nodes }
function setAmbient(kind) {
  if (!on()) kind = null
  if ((amb?.kind || null) === kind) return
  const c = kind ? ensure() : ctx
  if (!c) return
  if (amb) {
    const old = amb
    old.gain.gain.setTargetAtTime(0, c.currentTime, 0.4)
    setTimeout(() => { old.nodes.forEach((n) => { try { n.stop() } catch { /* ya paró */ } }); old.gain.disconnect() }, 2500)
    amb = null
  }
  if (!kind) return
  const gain = c.createGain()
  gain.gain.value = 0
  gain.connect(master)
  const nodes = []
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c)
  src.loop = true
  const f = c.createBiquadFilter()
  nodes.push(src)
  if (kind === 'ship') {
    // zumbido grave de máquinas + aire de ventilación
    f.type = 'lowpass'; f.frequency.value = 420
    const v = c.createGain(); v.gain.value = 0.35
    src.connect(f); f.connect(v); v.connect(gain)
    ;[[60, 0.5], [90.4, 0.18], [120.3, 0.08]].forEach(([hz, vol]) => {
      const o = c.createOscillator(); const og = c.createGain()
      o.frequency.value = hz; og.gain.value = vol
      o.connect(og); og.connect(gain); o.start(); nodes.push(o)
    })
    gain.gain.setTargetAtTime(0.045, c.currentTime, 0.8)
  } else {
    // viento: ruido que se abre y se cierra despacio
    f.type = 'bandpass'; f.frequency.value = 380; f.Q.value = 0.5
    const v = c.createGain(); v.gain.value = 0.6
    const lfo = c.createOscillator(); const lg = c.createGain()
    lfo.frequency.value = 0.11; lg.gain.value = 0.35
    lfo.connect(lg); lg.connect(v.gain)
    const lfo2 = c.createOscillator(); const lg2 = c.createGain()
    lfo2.frequency.value = 0.07; lg2.gain.value = 160
    lfo2.connect(lg2); lg2.connect(f.frequency)
    src.connect(f); f.connect(v); v.connect(gain)
    lfo.start(); lfo2.start(); nodes.push(lfo, lfo2)
    gain.gain.setTargetAtTime(0.05, c.currentTime, 1.2)
  }
  src.start()
  amb = { kind, gain, nodes }
}
const ambientFor = (screen) => (screen === 'loading' || screen === 'tutorial' ? 'ship' : screen === 'sol' || screen === 'landing' || screen === 'end' ? 'mars' : null)

// ---------- Director: escucha lo que pasa en el juego y toca lo que corresponde ----------
let started = false
let retroTimer = null
export function initSound() {
  if (started || !soundSupported) return
  started = true
  const wake = () => unlock()
  window.addEventListener('pointerdown', (e) => {
    wake()
    if (e.target?.closest?.('button, .char-card')) play('click')
  }, true)
  window.addEventListener('keydown', wake, true)

  useGame.subscribe((s, p) => {
    if (s.sound !== p.sound) {
      if (s.sound) unlock()
      else { stopLong(); setAmbient(null) }
    }
    if (s.paused !== p.paused && ctx) {
      if (s.paused) ctx.suspend().catch(() => {})
      else if (s.sound) ctx.resume().catch(() => {})
    }
    if (s.screen !== p.screen) {
      stopLong()
      clearTimeout(retroTimer)
      setAmbient(ambientFor(s.screen))
      if (s.screen === 'landing') retroTimer = setTimeout(() => { if (useGame.getState().screen === 'landing') play('retro') }, 4300)
      if (s.screen === 'end') play(s.outcome === 'win' ? 'win' : 'lose')
    }
    // Nave
    if (s.roomMsg !== p.roomMsg && s.roomMsg) {
      const k = s.roomMsg.type
      if (k === 'picked') play('pick')
      else if (k === 'loaded') play('deposit')
      else if (k === 'hands' || k === 'heavy') play('deny')
    }
    if (s.openFurn.length > p.openFurn.length) play('open')
    if (s.screen === 'loading' && s.cargo.length < p.cargo.length) play('unload')
    if (s.screen === 'loading' && s.roomLeft !== p.roomLeft && s.roomLeft !== null && s.roomLeft <= 10 && s.roomLeft > 0) play('tick')
    // Soles
    if (s.screen === 'sol' && s.phase !== p.phase) {
      const card = s.cards[0]
      if (s.phase === 'dawn') play('dawn')
      else if (s.phase === 'incident') play(card?.event?.good ? 'supply' : 'alarm')
      else if (s.phase === 'event' && card?.storm) play('storm')
      else if (s.phase === 'outcome') play(s.cardResult?.good ? 'good' : 'bad')
      else if (s.phase === 'report') play(s.health <= 0 ? 'bad' : 'night')
    }
    if (s.screen === 'sol' && s.phase === 'plan' && p.phase === 'plan' && s.alloc !== p.alloc) {
      const d = chipsUsed(s.alloc) - chipsUsed(p.alloc)
      if (d > 0) play('chip')
      else if (d < 0) play('chipOff')
    }
  })

  // Para pruebas: medir un efecto sin escucharlo (lo dibuja fuera de línea y devuelve pico y volumen medio)
  window.__sfx = {
    names: Object.keys(RECIPES),
    async render(name, seconds = 7) {
      const O = window.OfflineAudioContext || window.webkitOfflineAudioContext
      const c = new O(1, 44100 * seconds, 44100)
      RECIPES[name](c, c.destination)
      const d = (await c.startRendering()).getChannelData(0)
      let peak = 0, sum = 0, last = 0
      for (let i = 0; i < d.length; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; sum += a * a; if (a > 0.002) last = i }
      return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / Math.max(1, last)).toFixed(3), dur: +(last / 44100).toFixed(2) }
    },
    state: () => ({ ctx: ctx?.state || null, ambient: amb?.kind || null }),
  }
}
