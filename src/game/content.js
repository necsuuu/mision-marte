// Todo el texto y los números de diseño del juego están acá,
// así el equipo puede ajustar balance o traducir sin tocar la lógica.

export const SOLS = 12 // duración de la misión
export const CAPACITY = 18 // masa máxima del cohete (unidades del juego)
export const LOAD_SECONDS = 60 // tiempo para cargar el cohete

/** Para qué sirve cada objeto en la base (se muestra en la ficha del objeto). */
export const ITEM_USE = {
  panel: 'energy', battery: 'energy', moxie: 'air', o2tank: 'air', rations: 'food', seeds: 'food',
  water: 'shield', repair: 'repair', medkit: 'health', science: 'science',
}

export const ITEMS = [
  { id: 'panel', name: 'Panel solar extra', emoji: '🔆', mass: 4, desc: '+1 panel: más energía cada sol.' },
  { id: 'battery', name: 'Batería', emoji: '🔋', mass: 3, desc: 'Guarda hasta 4 ⚡ que sobren para el sol siguiente.' },
  {
    id: 'moxie', name: 'Generador MOXIE', emoji: '🫧', mass: 4,
    desc: 'Fabrica oxígeno con el aire de Marte (CO₂). Cada ⚡ en Soporte vital rinde 50% más.',
    fact: 'MOXIE existe de verdad: viajó en el rover Perseverance y fabricó oxígeno en Marte.',
  },
  { id: 'rations', name: 'Raciones de comida', emoji: '🥫', mass: 3, max: 2, desc: '+30 de comida al aterrizar.' },
  { id: 'o2tank', name: 'Tanque de oxígeno', emoji: '🧪', mass: 3, desc: '+30 de oxígeno al aterrizar.' },
  { id: 'seeds', name: 'Plantines de papa', emoji: '🥔', mass: 1, desc: 'Brotes ya germinados para el invernadero hidropónico. ¡Sin plantines no hay comida nueva!' },
  {
    id: 'water', name: 'Tanques de agua', emoji: '💧', mass: 4,
    desc: 'El agua frena la radiación: tu escudo bloquea un 30% extra.',
    fact: 'Los materiales con mucho hidrógeno, como el agua, son buenos escudos contra la radiación.',
  },
  { id: 'repair', name: 'Kit de reparación', emoji: '🧰', mass: 2, desc: 'Arregla una avería sin gastar energía.' },
  { id: 'medkit', name: 'Kit médico', emoji: '⛑️', mass: 2, desc: 'Cura a la tripulación una vez.' },
  { id: 'science', name: 'Instrumentos científicos', emoji: '🔬', mass: 3, desc: 'Cada ⚡ en Ciencia da el doble de puntos.' },
]

// Valores base de la base marciana
export const BASE = {
  panels: 3,
  chipsPerPanel: 2,
  o2: 50,
  food: 40,
  health: 100,
  batteryCap: 1, // sin batería solo se guarda 1 ⚡
  batteryCapWithItem: 4,
  o2PerChip: 10,
  o2PerChipMoxie: 15,
  o2Use: 20, // la tripulación respira 20 por sol → necesitás 2 ⚡ en Soporte vital
  foodPerChip: 7,
  foodUse: 10,
  // Desde los 10 años (modo normal) la base gasta más: hay que pensar el reparto de verdad
  o2UseHard: 27,
  foodUseHard: 13,
  scienceGoal: 14, // para la estrella de ciencia hay que aprovechar obras, misiones y expediciones
  maxChipsPerSystem: 4,
  // Radiación (mSv). Dosis base real medida por el instrumento RAD de Curiosity: ~0.64 mSv por día.
  baseDose: 0.64,
  stormDose: { 1: 2, 2: 5, 3: 10 }, // dosis extra simulada sin escudo
  shieldPerChip: 0.3,
  waterShieldBonus: 0.3,
  maxShield: 0.9,
  doseLimit: 25, // límite de la misión (regla del juego)
}

export const SYSTEMS = [
  { id: 'life', name: 'Soporte vital', emoji: '🫁', color: '#5ad1ff', help: 'Hace oxígeno para respirar. Con poca ⚡ el aire baja: mirá el papel.' },
  { id: 'greenhouse', name: 'Invernadero', emoji: '🌱', color: '#7be07b', help: 'Hidroponía: los plantines crecen con luz y agua, sin tierra. Cada ⚡ da comida.' },
  { id: 'shield', name: 'Escudo', emoji: '🛡️', color: '#c49bff', help: 'Protege de la radiación. Cada ⚡ bloquea 30%.' },
  { id: 'science', name: 'Ciencia', emoji: '🔬', color: '#ffd166', help: 'Experimentos. ¡Para eso vinimos a Marte!' },
]

export const GLOSSARY = {
  sol: 'Un "sol" es un día en Marte. Dura 24 horas y 39 minutos, un poquito más que un día en la Tierra.',
  cme: 'Eyección de masa coronal (CME): una nube gigante de partículas que lanza el Sol. Si llega a Marte, sube la radiación.',
  radiacion: 'Radiación: energía invisible que viene del espacio. Mucha cantidad daña el cuerpo. Marte no tiene un campo magnético como la Tierra, por eso llega más.',
  msv: 'mSv (milisievert): la unidad para medir cuánta radiación recibe una persona.',
  donki: 'DONKI es la base de datos de la NASA que registra tormentas solares de verdad.',
  eva: 'EVA: "actividad extravehicular", o sea, salir afuera con el traje espacial.',
  delay: 'Retraso de comunicación: los mensajes de radio viajan a la velocidad de la luz, pero Marte está tan lejos que tardan varios minutos en llegar.',
  sep: 'SEP: partículas energéticas solares. Son las más peligrosas porque llegan rapidísimo y atraviesan casi todo.',
}

/*
 * EVENTOS. Cada evento pasa en 3 pasos:
 *   1) "incident": la cámara muestra el problema en la base (scene = dónde mirar)
 *   2) "decision": corte al interior de la nave, la tripulación elige
 *   3) "outcome": paneo por la base mostrando la consecuencia (fx) + caption
 * effects:
 *  o2, food, health, science, dose  → suman/restan ya
 *  chipsPenalty                      → ⚡ que perdés este sol
 *  dust: { level, sols }             → tormenta de polvo (baja la energía solar)
 * task: 'id' (en una opción)          → después de elegir, el comandante lo hace a mano en la base (ver tasks.js)
 *  blockScience                      → hoy no se puede hacer ciencia
 *  useItem                           → consume un objeto
 *  leak / breakPanel                 → daño que QUEDA en la base hasta repararlo (castigo)
 *  iceMine / sample                  → mejora que QUEDA en la base (premio)
 *  chance + success/fail             → resultado al azar
 */
export const EVENTS = [
  {
    id: 'leak', emoji: '☄️', title: '¡Un meteorito perforó el domo!', scene: 'dome', incident: 'meteor',
    text: 'Una piedrita del espacio hizo un agujero. ¡Se escapa el aire!',
    fact: 'Las piedritas del espacio viajan tan rápido que hasta una del tamaño de un grano de arena puede agujerear una pared.',
    choices: [
      { label: 'Usar el kit de reparación', requires: 'repair', hint: '🧰', task: 'seal', effects: { useItem: 'repair' }, fx: 'patched', outcome: '🧰 ✅ ¡Agujero sellado!' },
      { label: 'Parchar con lo que hay', hint: '−2 ⚡ · −5 🫁', task: 'seal', effects: { chipsPenalty: 2, o2: -5 }, fx: 'patched', outcome: '🩹 Parche puesto. Costó energía.' },
      { label: 'Ignorarlo por ahora', hint: '−10 🫁 · la fuga sigue', effects: { o2: -10, leak: true }, fx: 'leaking', outcome: '💨 La fuga sigue: −5 🫁 cada sol hasta repararla.' },
    ],
  },
  {
    id: 'dust', emoji: '🌪️', title: 'Tormenta de polvo', scene: 'panels', incident: 'dustwall',
    text: 'El polvo tapa el cielo y ensucia los paneles solares.',
    fact: 'En 2018 una tormenta de polvo cubrió todo Marte y el rover Opportunity se quedó sin energía para siempre.',
    choices: [
      { label: 'Salir a limpiar los paneles', hint: '−8 🫁 · más ⚡', task: 'clean', effects: { o2: -8, dose: 0.2, dust: { level: 0.25, sols: 2 } }, fx: 'cleaned', outcome: '🧹✨ Paneles limpios. Gastaste aire, pero tenés más energía.' },
      { label: 'Quedarse adentro', hint: 'Menos ⚡ por 3 soles', effects: { dust: { level: 0.5, sols: 3 } }, fx: 'dusty', outcome: '🟫 Los paneles quedan sucios: menos ⚡ por 3 soles.' },
    ],
  },
  {
    id: 'ice', emoji: '🧊', title: '¡El rover encontró hielo!', scene: 'rover', incident: 'drill',
    text: 'Bajo la arena hay hielo de agua. Con electricidad se puede sacar oxígeno.',
    fact: 'Hay mucho hielo de agua enterrado en Marte. Es clave para futuras bases.',
    choices: [
      { label: 'Construir una mina de hielo', hint: '−2 ⚡ hoy · +5 🫁 cada sol', effects: { chipsPenalty: 2, o2: 10, iceMine: true }, fx: 'icemine', outcome: '⛏️🧊 ¡Mina de hielo lista! +5 🫁 todos los soles.' },
      { label: 'Solo estudiarlo', hint: '+3 🔬', effects: { science: 3 }, fx: 'study', outcome: '🔬 Datos enviados a la Tierra (+3 ciencia).' },
    ],
  },
  {
    id: 'blight', emoji: '🥀', title: 'Plantas enfermas', requires: 'seeds', scene: 'greenhouse', incident: 'sickplants',
    text: 'Las papas se ponen amarillas. Hay un hongo en el invernadero.',
    fact: 'Cultivar comida en el espacio es difícil: las plantas también sufren con poca luz y poca gravedad.',
    choices: [
      { label: 'Sacar las plantas enfermas', hint: '−10 🥔', task: 'plants', effects: { food: -10 }, fx: 'fewerplants', outcome: '🥀➡️🌱 Menos plantas, pero el resto está sano.' },
      { label: 'Desinfectar con luz UV', hint: '−2 ⚡', effects: { chipsPenalty: 2 }, fx: 'uv', outcome: '💜 La luz UV eliminó el hongo.' },
    ],
  },
  {
    id: 'sick', emoji: '🤒', title: 'Alguien se siente mal', scene: 'dome', incident: 'alarm',
    text: 'Fiebre y cansancio. En el espacio el sistema inmune funciona distinto.',
    fact: 'Estudios de la NASA (repositorio OSDR) muestran que los vuelos espaciales cambian el sistema inmune.',
    choices: [
      { label: 'Usar el kit médico', requires: 'medkit', hint: '⛑️', effects: { useItem: 'medkit', health: 5 }, fx: 'healed', outcome: '⛑️💚 ¡Recuperado!' },
      { label: 'Que descanse hoy', hint: 'Sin 🔬 hoy', effects: { blockScience: true }, fx: 'rest', outcome: '😴 Descansó. Hoy no hay ciencia.' },
      { label: 'Seguir trabajando', hint: '−15 ❤️', effects: { health: -15 }, fx: 'worse', outcome: '🤒⬇️ Empeoró. La salud del equipo bajó.' },
    ],
  },
  {
    id: 'bones', emoji: '🦴', title: 'Huesos más débiles', scene: 'dome', incident: 'alarm',
    text: 'En Marte la gravedad es solo el 38% de la de la Tierra. Los huesos y músculos se debilitan.',
    fact: 'En el espacio los astronautas pueden perder cerca de 1% de su masa ósea por mes. Por eso hacen ejercicio todos los días.',
    choices: [
      { label: 'Ejercicio en la bici', hint: '−1 ⚡ · +5 ❤️', effects: { chipsPenalty: 1, health: 5 }, fx: 'healed', outcome: '🚴💪 ¡Huesos fuertes!' },
      { label: 'Saltear el ejercicio', hint: '−8 ❤️', effects: { health: -8 }, fx: 'worse', outcome: '🦴⬇️ El cuerpo lo siente.' },
    ],
  },
  {
    id: 'message', emoji: '📡', title: 'Falla en la computadora', scene: 'antenna', incident: 'signal', delayFact: true,
    text: 'La computadora muestra un error raro. ¿Le preguntamos a la Tierra?',
    choices: [
      { label: 'Esperar a la Tierra', hint: '−1 ⚡ (tiempo)', effects: { chipsPenalty: 1 }, fx: 'reply', outcome: '📡✅ La respuesta llegó. ¡Arreglado!' },
      {
        label: 'Resolverlo nosotros', hint: '🎲 50%',
        effects: { chance: 0.5, success: { science: 2 }, fail: { o2: -12 } },
        fx: { success: 'fixed', fail: 'worse' },
        outcome: { success: '🧠✅ ¡Lo resolvieron solos! +2 🔬', fail: '⚠️ El arreglo apagó el soporte vital un rato (−12 🫁).' },
      },
    ],
  },
  {
    id: 'panelbreak', emoji: '⚡', title: 'Se rompió un panel solar', scene: 'panels', incident: 'gust',
    text: 'Una ráfaga de arena golpeó un panel y dejó de funcionar.',
    choices: [
      { label: 'Usar el kit de reparación', requires: 'repair', hint: '🧰', task: 'circuit', effects: { useItem: 'repair' }, fx: 'panelfixed', outcome: '🧰⚡ Panel como nuevo.' },
      { label: 'Arreglarlo afuera (EVA)', hint: '−10 🫁 · −2 ⚡', task: 'circuit', effects: { o2: -10, chipsPenalty: 2, dose: 0.2 }, fx: 'panelfixed', outcome: '👩‍🚀⚡ Arreglado con el traje puesto.' },
      { label: 'Dejarlo roto', hint: '−2 ⚡ cada sol', effects: { breakPanel: true }, fx: 'panelbroken', outcome: '💥 Panel roto: menos ⚡ cada sol. Podés repararlo después.' },
    ],
  },
  {
    id: 'rock', emoji: '🪨', title: 'Una roca muy rara', scene: 'rover', incident: 'drill',
    text: 'Una roca con capas, como si hubiera estado bajo el agua hace millones de años.',
    fact: 'Curiosity y Perseverance encontraron rocas que se formaron en lagos y ríos de Marte hace miles de millones de años.',
    choices: [
      { label: 'Ir a buscarla (EVA)', hint: '−8 🫁 · +4 🔬', effects: { o2: -8, science: 4, dose: 0.2, sample: true }, fx: 'sample', outcome: '🪨📦 ¡Muestra guardada en la base!' },
      { label: 'Sacarle fotos', hint: '+1 🔬', effects: { science: 1 }, fx: 'study', outcome: '📸 Algo es algo.' },
    ],
  },
  {
    id: 'sunset', emoji: '🌅', title: 'Atardecer azul', scene: 'sky', incident: 'sunset',
    text: 'En Marte el atardecer es ¡azul! Todos salen a mirar.',
    fact: 'Las partículas de polvo de Marte desvían la luz azul hacia adelante: al atardecer el cielo alrededor del Sol se ve azul.',
    choices: [{ label: '¡Qué lindo!', hint: '+5 ❤️', effects: { health: 5 }, fx: 'sunset', outcome: '🌅💙 La tripulación está feliz.' }],
  },
]

/**
 * 🙋 PEDIDOS DE AYUDA: un compañero necesita una mano. No pasan por la computadora (direct):
 * hay que salir, ir a hablarle y hacer el trabajo con él. Están mezclados con los demás eventos.
 * La primera opción se hace a mano (task); la segunda es "ahora no" (o lo que pasa si se lo deja a la tripulación).
 */
export const HELP_EVENTS = [
  {
    id: 'help_water', direct: true, good: true, crew: 'botanist', requires: 'seeds', emoji: '💧', title: 'El botánico pide ayuda', scene: 'greenhouse', incident: 'help',
    text: 'Se desajustó el riego del invernadero hidropónico.',
    ask: '¡Comandante! ¿Me ayudás con el riego?',
    talk: 'Cada bandeja necesita la cantidad justa de agua: que llegue a la franja verde. Si te pasás, se rebalsa y las raíces se ahogan. ¿Me das una mano?',
    fact: 'En hidroponía las plantas crecen sin tierra: las raíces toman el agua y los nutrientes de un líquido. Así se ahorra agua, algo muy valioso en Marte.',
    choices: [
      { label: '¡Dale, te ayudo!', task: 'water', effects: {}, fx: 'watered', outcome: '💧🌱 ¡Riego ajustado!' },
      { label: 'Ahora no', effects: { food: 2 }, fx: 'rest', outcome: '🌱 Lo arregló solo, más despacio (+2 🥔).' },
    ],
  },
  {
    id: 'help_antenna', direct: true, good: true, crew: 'engineer', emoji: '📡', title: 'La ingeniera pide ayuda', scene: 'antenna', incident: 'help',
    text: 'La antena perdió la señal con la Tierra.',
    ask: '¡Comandante! Perdimos la señal con la Tierra',
    talk: 'Hay que volver a apuntar la antena. Girala despacio hasta que la señal llegue al máximo y quedate ahí. ¿Me ayudás?',
    fact: 'La NASA habla con sus naves con la Red de Espacio Profundo: antenas gigantes en California, España y Australia. Como la Tierra gira, siempre hay una mirando hacia Marte.',
    choices: [
      { label: '¡Dale, te ayudo!', task: 'aim', effects: {}, fx: 'reply', outcome: '📡✅ ¡Señal con la Tierra!' },
      { label: 'Ahora no', effects: { science: 1 }, fx: 'rest', outcome: '📡 La ingeniera la apuntó sola; tardó toda la tarde (+1 🔬).' },
    ],
  },
]

/**
 * 📦 Evento especial de mitad de misión: no sale al azar, llega siempre en el sol MID_SOL.
 * Es distinto a los demás: no hay un problema, hay un premio… pero solo se puede elegir una caja.
 */
export const MID_SOL = 6
export const SUPPLY_EVENT = {
  id: 'supply', special: true, good: true, emoji: '📦', title: '¡Llegó una cápsula de la Tierra!', scene: 'supply', incident: 'supply',
  text: 'Mitad de la misión: la Tierra mandó carga. El rover solo puede traer UNA caja antes de la noche. ¿Cuál?',
  fact: 'La carga para Marte se manda con mucha anticipación: solo se puede despegar cada 26 meses, cuando la Tierra y Marte quedan cerca.',
  choices: [
    { label: 'La caja de oxígeno', hint: '+20 🫁', effects: { o2: 20 }, fx: 'supply', outcome: '🧪 ¡Aire fresco para la base! +20 🫁' },
    { label: 'La caja de comida', hint: '+20 🥔', effects: { food: 20 }, fx: 'supply', outcome: '🥫 ¡Comida de casa! +20 🥔' },
    { label: 'La caja de instrumentos', hint: '+3 🔬', effects: { science: 3 }, fx: 'supply', outcome: '🔬 ¡Instrumentos nuevos! +3 de ciencia' },
  ],
}

/**
 * 🏗️ OBRAS: mejoras que se construyen de a poco, poniendo ⚡ en "Construir" durante varios soles.
 * Cuando se junta el costo, la obra queda para siempre en la base (y se ve en 3D).
 *   cost     → ⚡ que hay que juntar
 *   requires → objeto que hace falta haber traído
 * El efecto de cada una está en BUILD_FX y se aplica en store.js.
 */
export const BUILD_FROM_SOL = 2 // el sol 1 es para aprender lo básico
export const BUILDS = [
  {
    id: 'panel', emoji: '🔆', name: 'Panel solar nuevo', cost: 5, gain: '+2 ⚡ cada sol',
    fact: 'En Marte el Sol llega con menos de la mitad de la fuerza que en la Tierra: por eso una base necesita muchos paneles.',
  },
  {
    id: 'shelter', emoji: '🧱', name: 'Refugio de regolito', cost: 6, gain: '🛡️ frena 30% siempre',
    fact: 'El regolito es el polvo y las piedras del suelo de Marte. Tapar la base con regolito frena la radiación sin gastar energía.',
  },
  {
    id: 'farm', emoji: '🌿', name: 'Invernadero grande', cost: 5, gain: 'cada ⚡ da +3 🥔 más', requires: 'seeds',
    fact: 'En la Estación Espacial ya se cultivaron lechuga, rabanitos y ajíes. En Marte habrá que cultivar mucho más.',
  },
  {
    id: 'lab', emoji: '🌡️', name: 'Estación meteorológica', cost: 4, gain: '+1 🔬 sola, cada sol',
    fact: 'El rover Perseverance lleva una estación meteorológica (MEDA) que mide el viento, la temperatura y el polvo de Marte.',
  },
]
export const BUILD_FX = { shelterShield: 0.3, farmFood: 3, labScience: 1 }

/**
 * 🎯 MISIÓN DEL DÍA: un objetivo chico distinto cada sol. Si se cumple al terminar el sol,
 * da una medalla 🏅 y +1 ⚡ para el sol siguiente. Las condiciones están en store.js (missionMet).
 */
export const MISSION_FROM_SOL = 2
export const MISSION_BONUS = 1
export const MISSIONS = [
  { id: 'shield', emoji: '🛡️', text: 'Frená casi toda la tormenta (85% o más)' },
  { id: 'fix', emoji: '🔧', text: 'Arreglá hoy algo roto de la base' },
  { id: 'air', emoji: '🫁', text: 'Terminá el sol con 10 más de aire' },
  { id: 'food', emoji: '🥔', text: 'Terminá el sol con 5 más de comida' },
  { id: 'science', emoji: '🔬', text: 'Sumá 3 puntos de ciencia hoy' },
  { id: 'save', emoji: '🔋', text: 'Guardá ⚡ para mañana (2 si tenés batería)' },
  { id: 'build', emoji: '🏗️', text: 'Poné 2 ⚡ en la obra' },
]

/**
 * 🚙 EXPEDICIONES: en un día sin tormenta solar, el rover puede salir a explorar.
 * Se ofrecen 2 lugares (de los que todavía no se visitaron) + quedarse en la base.
 * Es un evento más (mismas reglas de effects/fx/outcome), pero cada opción tiene su propio "fact"
 * y "site" dice a qué lugar del mapa va el rover.
 */
export const EXPEDITION_FROM_SOL = 3
export const EXPEDITION_MAX = 3
export const EXPEDITION_EVENT = {
  id: 'expedition', expedition: true, good: true, emoji: '🚙', title: 'Día tranquilo: ¿salimos a explorar?', scene: 'rover', incident: 'expedition',
  text: 'Hoy no hay tormenta solar, así que se puede salir. Explorar gasta aire y puede salir mal. ¿A dónde mandamos el rover?',
  choices: [
    {
      task: 'drive', site: 'crater', label: '🧊 Al cráter con hielo', hint: 'cerca · 80%',
      effects: { chance: 0.8, success: { o2: 14 }, fail: { o2: -6 } },
      fx: { success: 'found', fail: 'nothing' },
      outcome: { success: '🧊 ¡Trajeron hielo! Derretido da agua y aire: +14 🫁', fail: 'El hielo estaba muy hondo. Se gastó aire: −6 🫁' },
      fact: 'En Marte hay hielo de agua bajo el suelo y en los polos. Con agua se puede hacer oxígeno para respirar y combustible para volver.',
    },
    {
      task: 'drive', site: 'cave', label: '🕳️ A la cueva de lava', hint: 'media · 70%',
      effects: { chance: 0.7, success: { science: 3, o2: -6 }, fail: { o2: -6, health: -6 } },
      fx: { success: 'found', fail: 'nothing' },
      outcome: { success: '🕳️ ¡Una cueva enorme! +3 de ciencia (−6 🫁)', fail: 'El rover se trabó en la entrada. −6 🫁 y −6 ❤️ por el esfuerzo' },
      fact: 'Los tubos de lava son cuevas que dejaron los volcanes de Marte. Adentro la roca tapa la radiación: podrían servir de casa para astronautas.',
    },
    {
      task: 'drive', site: 'oldrover', label: '🤖 Al rover viejo', hint: 'lejos · 65%',
      effects: { chance: 0.65, success: { bonusNext: 3, o2: -8 }, fail: { o2: -8 } },
      fx: { success: 'found', fail: 'nothing' },
      outcome: { success: '🔋 ¡Sus baterías todavía sirven! +3 ⚡ mañana (−8 🫁)', fail: 'Estaba tapado de polvo y no se pudo sacar nada. −8 🫁' },
      fact: 'El rover Opportunity estaba pensado para trabajar 90 días y anduvo más de 14 años en Marte.',
    },
    {
      task: 'drive', site: 'hill', label: '⛰️ Al cerro mirador', hint: 'cerca · seguro',
      effects: { science: 2, o2: -5 }, fx: 'found',
      outcome: '📸 ¡Qué vista! Fotos y mediciones: +2 de ciencia (−5 🫁)',
      fact: 'En Marte está el Monte Olimpo, el volcán más alto del sistema solar: unas dos veces y media el Everest.',
    },
    {
      label: '🏠 Quedarnos en la base', hint: 'sin riesgo',
      effects: { health: 4 }, fx: 'rest',
      outcome: '😴 La tripulación descansó: +4 ❤️',
    },
  ],
}

// Reparaciones que se pueden pagar con energía en el plan del sol
export const REPAIRS = {
  leak: { label: 'Parchar la fuga', emoji: '🩹', cost: 2 },
  panel: { label: 'Arreglar panel', emoji: '🔧', cost: 2 },
}
export const LEAK_O2 = 5 // oxígeno que se pierde por sol con una fuga abierta
export const ICE_MINE_O2 = 5 // oxígeno extra por sol con la mina de hielo

export const STORM_TEXT = {
  1: { title: 'Tormenta solar débil', emoji: '☀️' },
  2: { title: 'Tormenta solar fuerte', emoji: '🔥' },
  3: { title: '¡Tormenta solar EXTREMA!', emoji: '☢️' },
}
