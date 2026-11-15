// Quiz final de 4 preguntas: al terminar la misión, para repasar lo que se vio en el juego. Las respuestas solo viven en memoria (no se guardan ni se envían).
// La primera opción de cada pregunta es la correcta; la pantalla las mezcla.
export const QUIZ = [
  {
    id: 'shield',
    es: { q: '¿Qué protege a los astronautas de la radiación de una tormenta solar?', a: ['🛡️ Un escudo y paredes con agua', '🧥 Una campera bien abrigada', '🕶️ Anteojos de sol'], why: 'El agua y los escudos frenan las partículas. Por eso los tanques de agua ayudan.' },
    en: { q: 'What protects astronauts from the radiation of a solar storm?', a: ['🛡️ A shield and walls with water', '🧥 A warm jacket', '🕶️ Sunglasses'], why: 'Water and shields stop the particles. That is why water tanks help.' },
  },
  {
    id: 'direction',
    es: { q: '¿Llegan a Marte TODAS las tormentas que lanza el Sol?', a: ['🎯 No, solo las que salen hacia Marte', '✅ Sí, todas', '🚫 Ninguna llega nunca'], why: 'El Sol lanza tormentas para todos lados. La NASA simula hacia dónde va cada una.' },
    en: { q: 'Do ALL the storms the Sun launches reach Mars?', a: ['🎯 No, only the ones heading to Mars', '✅ Yes, all of them', '🚫 None ever arrive'], why: 'The Sun throws storms in every direction. NASA simulates where each one goes.' },
  },
  {
    id: 'priority',
    es: { q: 'Si hay poca energía, ¿qué conviene cuidar primero?', a: ['🫁 El aire para respirar', '🔬 Los experimentos', '📺 La tele de la base'], why: 'Sin aire no se puede hacer nada más: primero lo que mantiene viva a la tripulación.' },
    en: { q: 'If energy is low, what should you take care of first?', a: ['🫁 The air to breathe', '🔬 The experiments', '📺 The base TV'], why: 'Without air nothing else matters: first what keeps the crew alive.' },
  },
  {
    id: 'delay',
    es: { q: '¿Cuánto tarda un mensaje en ir de Marte a la Tierra?', a: ['⏳ Varios minutos (entre 3 y 22)', '⚡ Menos de un segundo', '📅 Un mes entero'], why: 'La luz tarda minutos en cruzar esa distancia. Por eso los astronautas tienen que decidir solos.' },
    en: { q: 'How long does a message take to travel from Mars to Earth?', a: ['⏳ Several minutes (between 3 and 22)', '⚡ Less than a second', '📅 A whole month'], why: 'Light takes minutes to cross that distance. That is why astronauts must decide on their own.' },
  },
]

/** Cantidad de respuestas correctas (la correcta siempre es la opción 0). */
export const quizScore = (answers) => (answers || []).filter((a) => a === 0).length

/** Habilidades de astronauta que se practican en el juego (para el informe final). */
export const SKILLS = {
  es: [
    ['🧮', 'Administrar recursos', 'Repartir una energía que nunca alcanza para todo.'],
    ['📡', 'Leer pronósticos', 'Usar el clima espacial real para planear el día.'],
    ['🛡️', 'Protegerse de la radiación', 'Saber cuándo y cuánto escudo usar.'],
    ['🆘', 'Decidir en emergencias', 'Elegir rápido cuando algo se rompe.'],
    ['⏳', 'Trabajar sin ayuda inmediata', 'Con minutos de retraso, la tripulación decide sola.'],
  ],
  en: [
    ['🧮', 'Managing resources', 'Splitting energy that is never enough for everything.'],
    ['📡', 'Reading forecasts', 'Using real space weather to plan the day.'],
    ['🛡️', 'Radiation protection', 'Knowing when and how much shield to use.'],
    ['🆘', 'Emergency decisions', 'Choosing fast when something breaks.'],
    ['⏳', 'Working without instant help', 'With minutes of delay, the crew decides alone.'],
  ],
}
