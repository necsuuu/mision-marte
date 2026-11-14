// Personajes del juego.
// - El jugador elige un COMANDANTE (select_*). Es el personaje que maneja.
// - La ingeniera/o y la botánica son la TRIPULACIÓN: aparecen de fondo en la nave y en la base.
// - interior: ilustración de la cabina que se usa en las escenas de decisión (según el comandante).
import selectWoman from '../assets/characters/select_woman.webp'
import selectMan from '../assets/characters/select_man.webp'
import skinWoman from '../assets/characters/skin_woman.webp'
import skinMan from '../assets/characters/skin_man.webp'
import interiorMan from '../assets/scenes/interior_man.webp'
import interiorWoman from '../assets/scenes/interior_woman.webp'

export const CREW = [
  { id: 'engineer', sprite: skinMan, role: 'Ingeniero', emoji: '🔧' },
  { id: 'botanist', sprite: skinWoman, role: 'Botánica', emoji: '🌱' },
]

export const CHARACTERS = [
  { id: 'woman', select: selectWoman, sprite: selectWoman, interior: interiorWoman, color: '#7be07b', welcome: 'Bienvenida', title: 'Comandante' },
  { id: 'man', select: selectMan, sprite: selectMan, interior: interiorMan, color: '#ffb347', welcome: 'Bienvenido', title: 'Comandante' },
]

export const getCharacter = (id) => CHARACTERS.find((c) => c.id === id) || CHARACTERS[0]
