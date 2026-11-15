// Relojes y constantes de las cinemáticas, sin depender de three.js:
// así la interfaz puede leerlos sin obligar a descargar el motor 3D antes de mostrar el título.

// Despegue desde la Tierra
export const launchClock = { t: 0 }
if (typeof window !== 'undefined') window.__launch = launchClock // para pruebas automáticas
export const LAUNCH_END = 13
export const LIFTOFF = 3.6 // segundo en el que el cohete se despega
export const SPACE_CUT = 8.2 // corte a la vista desde el espacio

// Aterrizaje en Marte. Fuera de la cinemática (active=false) todo se muestra completo.
export const cine = { active: false, t: 0 }
export const CINE_END = 17

// Vista 3D: cuando la computadora del juego tapa toda la pantalla, no hace falta dibujar la escena de atrás.
export const view = { covered: false }
if (typeof window !== 'undefined') window.__view = view // para pruebas automáticas
