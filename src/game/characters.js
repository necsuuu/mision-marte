// Personajes del juego.
// - El jugador elige un COMANDANTE (select_*). Es el personaje que maneja.
// - El ingeniero y la botánica son la TRIPULACIÓN: aparecen de fondo en la nave y en la base.
// - walk: fotogramas de caminata [quieto, pierna izq. arriba, pierna der. arriba].
//   Se generan con tools/generar_fotogramas.py; si el equipo dibuja fotogramas propios, se reemplazan acá.
// - interior: ilustración de la cabina que se usa en las escenas de decisión (según el comandante).
import selectWoman from '../assets/characters/select_woman.webp'
import selectMan from '../assets/characters/select_man.webp'
import interiorMan from '../assets/scenes/interior_man.webp'
import portraitMan from '../assets/characters/portrait_man.webp'
import portraitWoman from '../assets/characters/portrait_woman.webp'
import interiorWoman from '../assets/scenes/interior_woman.webp'
import w0 from '../assets/characters/walk/select_woman_0.webp'
import w1 from '../assets/characters/walk/select_woman_1.webp'
import w3 from '../assets/characters/walk/select_woman_3.webp'
import m0 from '../assets/characters/walk/select_man_0.webp'
import m1 from '../assets/characters/walk/select_man_1.webp'
import m3 from '../assets/characters/walk/select_man_3.webp'
import e0 from '../assets/characters/walk/skin_man_0.webp'
import e1 from '../assets/characters/walk/skin_man_1.webp'
import e3 from '../assets/characters/walk/skin_man_3.webp'
import b0 from '../assets/characters/walk/skin_woman_0.webp'
import b1 from '../assets/characters/walk/skin_woman_1.webp'
import b3 from '../assets/characters/walk/skin_woman_3.webp'

// Secuencia de caminata: quieto → izq → quieto → der
export const WALK_SEQUENCE = [0, 1, 0, 2]

export const CREW = [
  { id: 'engineer', sprite: e0, walk: [e0, e1, e3], emoji: '🔧' },
  { id: 'botanist', sprite: b0, walk: [b0, b1, b3], emoji: '🌱' },
]

export const CHARACTERS = [
  { id: 'woman', portrait: portraitWoman, select: selectWoman, sprite: w0, walk: [w0, w1, w3], interior: interiorWoman, color: '#7be07b', female: true },
  { id: 'man', portrait: portraitMan, select: selectMan, sprite: m0, walk: [m0, m1, m3], interior: interiorMan, color: '#ffb347', female: false },
]

export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0]
