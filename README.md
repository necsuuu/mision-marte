# 🚀 Misión Marte: Entrenador de Astronautas Junior

> Proyecto del equipo **Código Cuántico** (Santiago del Estero, Argentina) para el **NASA Space Apps Challenge 2026**, desafío [*Build a Junior Astronaut Mission Trainer*](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/).

Juego web en 3D para **chicos de 7 a 12 años** donde manejás la primera base humana en Marte. Inspirado en *60 Seconds*: primero juntás los suministros a contrarreloj y después tenés que sobrevivir **12 soles** (días marcianos) repartiendo una energía que **nunca alcanza para todo**.

Las **tormentas solares del juego son reales**: salen de la base de datos **DONKI** de la NASA. Y la base **cambia según tus decisiones**: si ignorás una fuga, el agujero queda ahí; si construís una mina de hielo, la mina queda y te da oxígeno todos los días.

---

## 📑 Índice

1. [El problema que resolvemos](#-el-problema-que-resolvemos)
2. [Cómo se juega](#-cómo-se-juega)
3. [La mecánica de compromiso (trade-offs)](#%EF%B8%8F-la-mecánica-de-compromiso-trade-offs)
4. [Decisiones con consecuencias](#-decisiones-con-consecuencias)
5. [Datos reales de la NASA](#-datos-reales-de-la-nasa)
6. [Tecnologías](#%EF%B8%8F-tecnologías)
7. [Cómo correrlo en tu computadora](#-cómo-correrlo-en-tu-computadora)
8. [Estructura del proyecto](#-estructura-del-proyecto)
9. [Cómo modificar el juego](#%EF%B8%8F-cómo-modificar-el-juego)
10. [Notas técnicas de las APIs](#-notas-técnicas-de-las-apis)
11. [Simplificaciones honestas](#-simplificaciones-honestas)
12. [Créditos](#-créditos)

---

## 🎯 El problema que resolvemos

El contenido espacial para chicos suele ser **demasiado abstracto** (pósters, datos sueltos) o **demasiado técnico**. Casi nunca muestra lo más importante de una misión real: **cada decisión tiene un costo**. Proteger a la tripulación de la radiación gasta energía que no va al oxígeno; salir a reparar algo gasta aire; esperar instrucciones de la Tierra hace perder tiempo.

*Misión Marte* convierte esas restricciones reales en un juego: **ninguna opción es gratis**, y el jugador ve en la base qué pasó con lo que eligió.

---

## 🎮 Cómo se juega

```
Selección del comandante → Elegir misión → Cinemática de aterrizaje → Interior de la nave (60 s) → 12 soles en Marte → Resultado
```

### 1. Elegí tu comandante
Dos comandantes para elegir. Se escribe el **nombre** y se toca la **edad** (6 a 13+). Si el jugador tiene 8 años o menos, se activa el **modo cadete**: empieza con más oxígeno y comida, y las tormentas hacen menos daño.

> El nombre y la edad **solo viven en la memoria del navegador** mientras se juega: no se guardan ni se envían a ningún lado.

### 2. Elegí la misión
| Modo | Qué tiene |
|---|---|
| 🛰️ **Misión real** | Las tormentas solares de los **últimos 60 días**, consultadas en vivo a la NASA |
| ☢️ **Tormenta 2024** (difícil) | Mayo de 2024: la tormenta solar que llegó a Marte y le dio al rover Curiosity el **mayor pico de radiación** desde que aterrizó |
| 🎲 **Sorpresa** | Tormentas reales elegidas al azar: cada partida es distinta |

### 3. Cinemática de aterrizaje
La cápsula entra con **paracaídas**, enciende los **retrocohetes**, levanta polvo y aterriza. Después se **despliega la base**: se infla el domo, sale el invernadero, se abren los paneles solares uno por uno, sube la antena, el rover sale de la nave y aparece la tripulación. Se puede saltear.

### 4. Interior de la nave: 60 segundos
¡Se acerca una tormenta de polvo! Hay que pasar los suministros de la nave a la base.

- **Hacé clic en el piso** para caminar y **en un objeto** para agarrarlo.
- Algunos objetos están **dentro de muebles** marcados con ❓ (armario médico, casilleros, cajones, cajón de semillas, vitrina). Hay que abrirlos primero. Uno de los casilleros está vacío. 🕸️
- Se llevan **2 objetos a la vez** ✋✋ y hay que volver a la compuerta 🏠 para dejarlos.
- El depósito de la base aguanta **18 unidades de masa**, y todo junto pesa casi el doble: hay que elegir.
- La **tripulación de fondo** da pistas con globitos (🥔 → 📦🟩). Por la escotilla se ve la tormenta acercándose, en los últimos segundos suena la alarma y la nave tiembla.

| Objeto | Masa | Para qué sirve |
|---|---|---|
| 🔆 Panel solar extra | 4 | +1 panel → más energía cada sol |
| 🔋 Batería | 3 | Guarda hasta 4 ⚡ que sobren para el día siguiente |
| 🫧 Generador MOXIE | 4 | Cada ⚡ en soporte vital rinde 50% más (MOXIE existe: fabricó oxígeno en Marte con el rover Perseverance) |
| 🥫 Raciones (×2) | 3 c/u | +30 de comida al empezar |
| 🧪 Tanque de oxígeno | 3 | +30 de oxígeno al empezar |
| 🥔 Semillas de papa | 1 | ¡Sin semillas el invernadero no produce! |
| 💧 Tanques de agua | 4 | El agua frena la radiación: +30% de escudo |
| 🧰 Kit de reparación | 2 | Arregla una avería sin gastar energía |
| ⛑️ Kit médico | 2 | Cura a la tripulación una vez |
| 🔬 Instrumentos científicos | 3 | Duplica los puntos de ciencia |

### 5. Los 12 soles
Cada sol tiene este ciclo:

1. 🌅 **Amanecer**: aparece "SOL N".
2. ☀️ **Alerta de tormenta solar** (si la hubo ese día, según DONKI).
3. 🚨 **Evento**: algo pasa en la base (ver [Decisiones con consecuencias](#-decisiones-con-consecuencias)).
4. ⚡ **Plan de energía**: repartís la energía del día.
5. 🌙 **Noche**: reporte de lo que pasó, con la base iluminada de noche.

### 6. Final
Se gana sobreviviendo los 12 soles. Hay hasta **3 estrellas**: ★ sobrevivir, ★ llegar a 10 puntos de ciencia, ★ recibir poca radiación. Al final aparece **"Lo que aprendiste"** con los datos científicos que vio el jugador. Si se pierde (sin oxígeno, sin comida o demasiada radiación) se explica por qué, sin castigar: la idea es volver a intentar con otra estrategia.

---

## ⚖️ La mecánica de compromiso (trade-offs)

Cada sol los paneles solares producen fichas de energía ⚡ (2 por panel, menos si hay polvo). Se reparten entre:

| Sistema | Qué hace | Qué pasa si no le ponés energía |
|---|---|---|
| 🫁 **Soporte vital** | Fabrica oxígeno (10 por ⚡; la tripulación respira 20 por sol) | Se acaba el aire |
| 🌱 **Invernadero** | Cultiva papas (7 por ⚡; la tripulación come 10 por sol) | Hambre |
| 🛡️ **Escudo** | Bloquea 30% de la tormenta solar por ⚡ | Radiación |
| 🔬 **Ciencia** | Puntos de misión | La misión no sirve para nada |

Lo que sobra se guarda en la batería (1 ⚡ sin batería, 4 con batería) y el resto se pierde. **El panel muestra antes de confirmar qué va a pasar** con cada recurso, así el chico ve el efecto de su decisión.

---

## 🔁 Decisiones con consecuencias

Cada evento se cuenta en **3 momentos**:

1. **El problema en 3D**: la cámara va a donde pasa (por ejemplo, un meteorito cae y se ve el aire saliendo del domo).
2. **Corte al interior de la nave**: transición a la ilustración de la cabina (según el comandante elegido) con la tripulación, y la tarjeta de decisión.
3. **Paneo por la base**: la cámara recorre el lugar mostrando el resultado, con brillos **verdes** si salió bien o **rojos** si salió mal.

| Evento | Opciones | Lo que queda en la base |
|---|---|---|
| ☄️ Meteorito perfora el domo | Kit de reparación · parchar (−2 ⚡) · ignorar | Si se ignora: **el agujero queda y pierde 5 de oxígeno por sol** hasta repararlo |
| 🌪️ Tormenta de polvo | Salir a limpiar paneles (gasta aire) · esperar | Paneles sucios: menos energía por varios soles |
| 🧊 El rover encuentra hielo | Construir una mina · solo estudiarlo | **Mina de hielo**: +5 de oxígeno todos los soles |
| 🥀 Plantas enfermas | Sacarlas (−comida) · luz UV (−energía) | Menos plantas en el invernadero |
| 🤒 Alguien se enferma | Kit médico · descansar · seguir trabajando | Baja la salud |
| 🦴 Huesos débiles | Ejercicio · saltearlo | Baja la salud |
| 📡 Falla en la computadora | Esperar a la Tierra (retraso real de radio) · resolverlo solos (50%) | — |
| ⚡ Se rompe un panel | Kit · arreglarlo afuera · dejarlo roto | Si queda roto: **panel caído echando chispas, −2 ⚡ por sol** hasta repararlo |
| 🪨 Roca rara | Ir a buscarla · sacarle fotos | Cajas de **muestras** guardadas junto a la base |
| 🌅 Atardecer azul | — | +ánimo |

Los daños que quedan (fuga, panel roto) se pueden **reparar más tarde** desde el plan de energía, pagando ⚡. Así una mala decisión no es el fin del juego, pero tiene un costo que se arrastra. Arriba a la derecha siempre se ve el estado de la base: 💨 fuga · 💥 panel roto · ⛏️🧊 mina · 🪨 muestras · 🩹 parches.

Además hay **alarma roja** en el domo cuando el oxígeno o la salud están bajos, y **ciclo día/noche** entre soles.

---

## 🛰️ Datos reales de la NASA

| Dato | Cómo se usa en el juego | Fuente |
|---|---|---|
| **DONKI: eyecciones de masa coronal (CME)** | Cada tormenta solar del juego es una CME real, con su **fecha y velocidad**. La velocidad define el nivel: 900+ km/s débil, 1200+ fuerte, 1800+ extrema | [api.nasa.gov](https://api.nasa.gov) · [DONKI](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) |
| **DONKI: partículas energéticas solares (SEP)** | Si ese día hubo SEP, la tormenta sube de nivel | [api.nasa.gov](https://api.nasa.gov) |
| **Curiosity: instrumento RAD** | Dosis base en la superficie de Marte ≈ **0,64 mSv por día** (Hassler et al., *Science*, 2014). El modo 2024 cuenta el pico del **20/05/2024** (≈ 30 radiografías de tórax) | [Misión Curiosity](https://science.nasa.gov/mission/msl-curiosity/) |
| **OSDR (Open Science Data Repository)** | Base de los eventos de salud: huesos, sistema inmune | [osdr.nasa.gov](https://osdr.nasa.gov/bio/) |
| **Órbitas de la Tierra y Marte** | Se calcula la **distancia real del día** para el retraso de radio (por ejemplo, ~198 millones de km ≈ 11 minutos) | Elementos orbitales J2000 (`src/data/marsDistance.js`) |
| **Agencia Espacial Canadiense (CSA)** | *Food production on the Moon and in remote areas*: inspiración del invernadero | [asc-csa.gc.ca](https://www.asc-csa.gc.ca) |

Las fuentes también se muestran **dentro del juego** (botón "🔎 Datos reales de la NASA" y el indicador de datos en la barra de arriba).

**¿En vivo o guardado?** El juego intenta consultar DONKI en vivo. Si no puede (sin internet o sin API key), usa una **copia de datos reales descargada el 14/11/2026** (`src/data/snapshot.js`) y lo dice en pantalla. Nunca muestra datos guardados como si fueran en vivo.

---

## 🛠️ Tecnologías

- **React 19** + **Vite**
- **three.js** + **@react-three/fiber** + **@react-three/drei**: todo el 3D (planeta, cinemática, nave, base)
- **zustand**: estado del juego
- **framer-motion**: animaciones y transiciones de la interfaz
- Texturas generadas por código (terreno, Marte, ventanas): no hay imágenes externas salvo los personajes y las ilustraciones de la cabina.

---

## 💻 Cómo correrlo en tu computadora

**Requisitos:** [Node.js](https://nodejs.org) 20.19 o más nuevo, y git.

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/mision-marte.git
cd mision-marte

# 2. Instalar dependencias
npm install

# 3. Configurar la API key de la NASA (gratis en https://api.nasa.gov)
cp .env.example .env.local
# abrí .env.local y pegá tu key:  VITE_NASA_API_KEY=tu_key

# 4. Arrancar
npm run dev
```

Abrí **http://localhost:5173** en el navegador.

| Comando | Para qué |
|---|---|
| `npm run dev` | Modo desarrollo (se recarga solo al guardar) |
| `npm run dev -- --host` | Igual, pero accesible desde el celular en la misma red Wi-Fi |
| `npm run build` | Genera la versión final en `dist/` |
| `npm run preview` | Muestra la versión final en http://localhost:4173 |

> Sin API key el juego funciona igual, con los datos guardados.

---

## 📁 Estructura del proyecto

```
src/
├── App.jsx                 Pantallas y escena 3D según el momento del juego
├── main.jsx
├── styles.css
├── assets/
│   ├── characters/         Comandantes y tripulación (recortados, fondo transparente)
│   └── scenes/             Ilustraciones de la cabina (una por comandante)
├── data/
│   ├── donki.js            API DONKI en vivo + reparto de tormentas por sol
│   ├── snapshot.js         Datos reales guardados (respaldo + mayo 2024)
│   └── marsDistance.js     Distancia Tierra–Marte del día → retraso de radio
├── game/
│   ├── content.js          ⭐ TODOS los textos, objetos, eventos y números de balance
│   ├── characters.js       Comandantes, tripulación e ilustraciones
│   └── store.js            Lógica: energía, recursos, radiación, eventos, estado de la base
├── three/
│   ├── Planet.jsx          Marte girando (pantallas de inicio)
│   ├── MarsBase.jsx        Escena de la base: cielo, día/noche, director de cámara, cinemática
│   ├── baseParts.jsx       Domo, invernadero, paneles, antena, rover, nave, mina, tripulación
│   ├── effects.jsx         Partículas: polvo, tormenta solar, fuga de aire, meteorito, alarma, fuego
│   ├── cine.jsx            Reloj de la cinemática y animación de despliegue
│   ├── Room.jsx            Interior de la nave: muebles, objetos, jugador y tripulación
│   ├── items3d.jsx         Modelos 3D de los objetos
│   ├── CharacterSprite.jsx Personajes 2D dentro del mundo 3D
│   ├── terrain.jsx         Terreno y rocas de Marte
│   └── noise.js            Ruido para generar terreno y texturas
└── ui/                     Pantallas: inicio, selección, modo, cinemática, sol, final, panel de datos
```

---

## ✏️ Cómo modificar el juego

- **Dificultad y balance:** `src/game/content.js` → objeto `BASE` (oxígeno inicial, cuánto rinde cada ⚡, dosis de radiación, etc.), `CAPACITY` (masa máxima) y `SOLS` (duración).
- **Agregar un evento:** sumarlo al array `EVENTS` en `content.js`. Cada evento tiene `scene` (a dónde mira la cámara), `incident` (qué animación muestra) y `choices` con `effects`, `fx` y `outcome`.
- **Traducir al inglés:** casi todo el texto está en `content.js` y en los archivos de `src/ui/`.
- **Cambiar quién maneja el jugador:** `src/game/characters.js` (campo `sprite` de cada comandante).
- **Depurar:** en la consola del navegador, `__game.getState()` muestra todo el estado del juego.

---

## 🧪 Notas técnicas de las APIs

Probado el 14/11/2026:

- ✅ `DONKI/CME` y `DONKI/SEP` funcionan. **Máximo 60 días por consulta.**
- ❌ `DONKI/FLR` (fulguraciones) devuelve 404 del lado de la NASA → no se usa.
- ❌ `mars-photos` (fotos de rovers) está caída ("No such app") → no se usa.
- ⚠️ OSDR bloquea llamadas desde el navegador (CORS) → usamos sus hallazgos como datos curiosos; para usarlo en vivo hace falta un backend.
- ⚠️ `DEMO_KEY` se queda sin cupo enseguida → usar una key propia.

---

## 🤝 Simplificaciones honestas

También se explican dentro del juego:

- Asumimos que cada tormenta solar grande **viaja hacia Marte**. En la realidad muchas van en otra dirección.
- Las **dosis extra** de las tormentas, la energía y los recursos son **números de juego**, pensados para que las decisiones se sientan como las reales. La dosis base (0,64 mSv/día) sí es real.
- La distancia Tierra–Marte usa órbitas simplificadas (error de unos pocos %).
- Este proyecto **no es un producto oficial de la NASA** y no usa logos ni elementos de marca de la NASA.

---

## 👥 Créditos

**Equipo Código Cuántico**, NASA Space Apps Challenge 2026, Santiago del Estero, Argentina.

Datos: NASA DONKI, NASA OSDR, Curiosity RAD (NASA/JPL-Caltech/SwRI), Agencia Espacial Canadiense.
