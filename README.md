# 🚀 Sobreviviendo en Marte (*Surviving on Mars*)

**Entrenador de Astronautas Junior**

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
12. [Uso de inteligencia artificial](#-uso-de-inteligencia-artificial)
13. [Créditos](#-créditos)

---

## 🎯 El problema que resolvemos

El contenido espacial para chicos suele ser **demasiado abstracto** (pósters, datos sueltos) o **demasiado técnico**. Casi nunca muestra lo más importante de una misión real: **cada decisión tiene un costo**. Proteger a la tripulación de la radiación gasta energía que no va al oxígeno; salir a reparar algo gasta aire; esperar instrucciones de la Tierra hace perder tiempo.

*Sobreviviendo en Marte* convierte esas restricciones reales en un juego: **ninguna opción es gratis**, y el jugador ve en la base qué pasó con lo que eligió.

---

## 🎮 Cómo se juega

```
Comandante → Misión → 🚀 Despegue → Tutorial → 📦 Carga en la nave (60 s) → 🪂 Aterrizaje en Marte → 12 soles → 🧠 Preguntas de repaso → Resultado
```

### Pantalla de inicio
La ilustración de la tripulación en Marte con el logo **Sobreviviendo en Marte** (o **Surviving on Mars** si el juego está en inglés). El fondo se extendió a los costados y hacia arriba para que entre en cualquier pantalla sin tapar a los personajes, y el logo se recoloreó en tonos crema y óxido para que resalte sobre el cielo rojo.

### 1. Elegí tu comandante
Dos comandantes para elegir. Se escribe el **nombre** y se toca la **edad** (6 a 13+). Si el jugador tiene **9 años o menos**, se activa el **⭐ modo cadete**, pensado para los más chicos:

- 90 segundos en vez de 60 para cargar la nave, y lugar para 22 unidades de masa en vez de 18.
- Empieza con más oxígeno y comida, hay menos eventos y las tormentas hacen la mitad de daño.
- En cada decisión aparece sola la **⭐ opción que elegiría la tripulación**.
- El botón **🤖 Ayudame** del plan de energía brilla para que lo usen.

Estas ayudas son **solo para el modo cadete**: los jugadores de 10 años o más deciden sin pistas. El ayudante reparte la energía y explica por qué con frases cortas: primero el aire, después el escudo si hay tormenta, la comida, las reparaciones, y lo que sobra va a ciencia.

Desde los **10 años** la base consume más aire y comida (27 y 13 por sol, contra 20 y 10 de los cadetes): la energía no alcanza para todo y hay que pensar el reparto. Lo probamos con partidas simuladas: una estrategia fija ("siempre 2⚡ a cada cosa") ya no saca 3 estrellas y, si la carga fue mala, pierde; con buen reparto se gana con 3 estrellas.

**Accesibilidad**
- 🗣️ **Lectura en voz alta** (voz del navegador, sin internet): se prende sola en modo cadete y se puede prender o apagar en cualquier momento con el botón de abajo a la izquierda. Lee los avisos, las decisiones, el plan, los resultados y las preguntas de repaso.
- 🔊 **Sonido:** efectos (agarrar, guardar, alarma, despegue, resultado bueno o malo) y ambiente (zumbido de la nave, viento de Marte). No hay archivos de audio: todo se genera con código (Web Audio). Se apaga con el botón 🔊 y se frena con la pausa.
- ✋ **Botón de acción en pantalla** (igual que la tecla E) para jugar en tablets o con un solo dedo.
- ✨/🐢 **Gráficos livianos** para compus viejas: sin sombras y con menos resolución. Además, si el juego anda lento, baja la resolución solo.
- Textos grandes en todo el juego.
- **Texturas realistas:** el suelo de Marte tiene relieve, ondas de arena y piedritas; los metales están cepillados y rayados; la pintura tiene mugre, chorreaduras y saltaduras; el domo y el paracaídas tienen trama de tela. Todo se calcula en la placa de video, sin descargar imágenes. En modo liviano 🐢 se apagan.
- **Se adapta a cualquier pantalla:** compu, tablet o celular acostado. El tamaño de todo se calcula según la pantalla y los textos de la computadora del juego nunca quedan ilegibles. Si el celular está parado, el juego se pausa y pide girarlo.
- **Celulares (iPhone y Android):**
  - En un celular acostado queda muy poco alto (Safari en un iPhone deja unos 280 a 340 px; Android, entre 300 y 410), así que la pantalla se reacomoda sola: los botones fijos van en columna a la izquierda, la barra de la nave y el mapa entran en una fila, el tutorial pone el video al lado del texto, y la computadora y la consola se muestran sin el dibujo del gabinete para usar todo el ancho. En tablets y compus se ve el diseño completo.
  - **Pantalla grande:** en Android y iPad el botón pone el juego en pantalla completa. El iPhone no deja que una página se ponga en pantalla completa, así que ahí el botón explica cómo agregar el juego a la pantalla de inicio (Compartir → «Agregar a inicio»): abierto desde ese ícono se ve sin las barras de Safari.
  - En pantallas táctiles el tutorial y las ayudas hablan de **tocar** (no de clic, W A S D ni la tecla E), y si un texto de la computadora no entra aparece una flechita ▼ para deslizar.

> El nombre y la edad **solo viven en la memoria del navegador** mientras se juega: no se guardan ni se envían a ningún lado.

### 2. Elegí la misión
| Modo | Qué tiene |
|---|---|
| 🛰️ **Misión real** | Las tormentas solares de los **últimos 60 días**, consultadas en vivo a la NASA |
| ☢️ **Tormenta 2024** (difícil) | Mayo de 2024: la tormenta solar que llegó a Marte y le dio al rover Curiosity el **mayor pico de radiación** desde que aterrizó |
| 🎲 **Sorpresa** | Tormentas reales elegidas al azar: cada partida es distinta |
| 🎬 **Demo rápida** | Salta directo al Sol 1 con una carga lista. También se abre con `?demo` al final de la dirección. Pensado para mostrarle el juego al jurado |

### 3. Despegue desde la Tierra
Cuenta regresiva 3, 2, 1: el cohete se enciende y despega entre el humo, atraviesa las nubes, el cielo se pone negro y aparecen las estrellas. Desde el espacio se ve la Tierra y el camino hacia Marte (el viaje dura unos 7 meses). Se puede saltear. **La carga de suministros empieza recién cuando termina el despegue** y un tutorial corto, que también se puede saltear.

> **Volver a jugar es más rápido:** el despegue y el tutorial se ven la primera vez. Si el mismo comandante juega de nuevo, va directo a la nave (el tutorial sigue disponible con el botón 🎬). Si se elige otro comandante, se vuelve a mostrar todo.

### 4. Interior de la nave: 60 segundos
¡Ya casi llegamos a Marte! Hay que cargar la cápsula de aterrizaje con lo que va a necesitar la base.

La nave tiene **3 módulos** conectados por puertas: 🏥 **Módulo médico** · 🛰️ **Cabina** · 🔧 **Ingeniería**. La cámara sigue al comandante y un **mini mapa** muestra en qué módulo está y cuántos objetos quedan en cada uno.

- **Controles:** 🖱️ clic en el piso para caminar y clic en un objeto para agarrarlo, o ⌨️ **WASD / flechas** para moverse y **E** (o Espacio) para abrir / agarrar / dejar.
- **⏸️ Pausa:** con **Esc** (o el botón ⏸️ de abajo a la izquierda) se frena todo el juego: la escena, la cuenta regresiva y la voz. Desde ahí se puede seguir, **reiniciar la misión desde cero** o **salir al menú principal** (las dos últimas piden confirmación). Funciona en el despegue, el tutorial, la nave, el aterrizaje y los soles.
- El astronauta **rodea los muebles** (búsqueda de caminos A*), no los atraviesa, y tiene **animación de caminata**.
- **Los objetos aparecen en lugares distintos en cada partida.** Hay 16 lugares posibles (casilleros, heladera, vitrina, cajonera, cajones, estantes, mesas) para 11 objetos, así que algunos muebles están vacíos. 🕸️
- Los muebles cerrados tienen ❓ y hay que abrirlos primero.
- **Ficha del objeto:** al pasar el mouse por un objeto (o acercarse con el teclado) aparece abajo a la izquierda el **retrato del comandante** contando qué es: nombre, para qué sirve en la base (aire, comida, energía, radiación…), cuánto pesa y cuánto lugar queda, y si se puede agarrar (manos llenas, no entra). Al agarrarlo, el comandante festeja y el objeto queda en sus manos.
- El área de clic de cada objeto se calcula con el tamaño real del modelo 3D, y las etiquetas flotantes no tapan los clics: se agarra tocándolo en cualquier parte, desde cualquier ángulo.
- Se llevan **2 objetos a la vez** ✋✋ y hay que volver a la compuerta 🏠 (en la cabina) para dejarlos.
- El depósito de la base aguanta **18 unidades de masa**, y todo junto pesa casi el doble: hay que elegir.
- La **tripulación de fondo** da pistas según dónde quedaron los objetos en esta partida (🥔 → 🏥📦). Por las escotillas se ve la tormenta acercándose; en los últimos segundos suena la alarma y la nave tiembla.

| Objeto | Masa | Para qué sirve |
|---|---|---|
| 🔆 Panel solar extra | 4 | +1 panel → más energía cada sol |
| 🔋 Batería | 3 | Guarda hasta 4 ⚡ que sobren para el día siguiente |
| 🫧 Generador MOXIE | 4 | Cada ⚡ en soporte vital rinde 50% más (MOXIE existe: fabricó oxígeno en Marte con el rover Perseverance) |
| 🥫 Raciones (×2) | 3 c/u | +30 de comida al empezar |
| 🧪 Tanque de oxígeno | 3 | +30 de oxígeno al empezar |
| 🥔 Plantines de papa | 1 | Brotes para el invernadero hidropónico. ¡Sin plantines no hay comida nueva! |
| 💧 Tanques de agua | 4 | El agua frena la radiación: +30% de escudo |
| 🧰 Kit de reparación | 2 | Arregla una avería sin gastar energía |
| ⛑️ Kit médico | 2 | Cura a la tripulación una vez |
| 🔬 Instrumentos científicos | 3 | Duplica los puntos de ciencia |

### 5. Aterrizaje en Marte
La cápsula entra con **paracaídas**, enciende los **retrocohetes**, levanta polvo y aterriza. Después se **despliega la base**: se infla el domo, sale el invernadero, se abren los paneles solares uno por uno, sube la antena, el rover sale de la nave y aparece la tripulación. Se puede saltear.

### 6. Los 12 soles
Cada sol tiene este ciclo:

1. 🌅 **Amanecer**: aparece "SOL N".
2. ☀️ **Alerta de tormenta solar**: solo si DONKI predijo que una CME **llegaba a Marte** ese día. Si salió una CME rápida que no viene hacia Marte, el juego lo cuenta ("¡hoy zafamos!").
3. 🚨 **Evento**: algo pasa en la base (ver [Decisiones con consecuencias](#-decisiones-con-consecuencias)).
4. ⚡ **Plan de energía**: repartís la energía del día.
5. 🌙 **Noche**: la **consola de reporte** (pantalla ámbar) muestra cómo cambiaron los recursos, la radiación, cuánto bloqueó el escudo y qué consecuencia tuvo la decisión del día. El **teléfono** de la consola abre los datos de la NASA y el **botón ✓** pasa al sol siguiente.

**Giro a mitad de misión:** dos soles antes de la tormenta más fuerte llega un **aviso de pronóstico** ("en 2 soles llega una GRAN TORMENTA"), como hace la oficina de clima espacial de la NASA para las misiones a la Luna y Marte. Hay que guardar energía en la batería y preparar el escudo. Si los datos reales no traen ninguna tormenta fuerte, se hace un **simulacro de entrenamiento** con la tormenta real del 14/05/2024, y el juego avisa que es un simulacro.

**📦 Cápsula de carga (sol 6):** justo a mitad de la misión baja con paracaídas una cápsula que mandó la Tierra. No es un problema sino un premio, pero el rover solo puede traer **una** de las tres cajas (oxígeno, comida o instrumentos de ciencia): hay que elegir según lo que más falta. La cápsula queda al lado de la base. Corta la rutina de los soles del medio y enseña un dato real: a Marte solo se puede despegar cada 26 meses.

**Para que cada sol sea distinto** (los tres sistemas se suman al plan de energía de siempre):

- **🏗️ Construir (desde el sol 2):** en el plan hay una fila más, "Construir". Se elige una obra y se le va poniendo ⚡ durante varios soles; cuando se junta el costo queda para siempre en la base y se ve en 3D (mientras tanto se ve la obra a medio hacer). Se puede cambiar de obra sin perder lo avanzado.

  | Obra | Costo | Qué da |
  |---|---|---|
  | 🔆 Panel solar nuevo | 5 ⚡ | +2 ⚡ cada sol |
  | 🧱 Refugio de regolito | 6 ⚡ | El escudo frena 30% siempre, sin gastar energía |
  | 🌿 Invernadero grande (necesita plantines) | 5 ⚡ | Cada ⚡ del invernadero da 3 de comida más |
  | 🌡️ Estación meteorológica | 4 ⚡ | +1 de ciencia cada sol, sola |

  Es la decisión de fondo del juego: gastar hoy en lo urgente o invertir para estar mejor después.
- **🎯 Misión del día (desde el sol 2):** cada sol trae un objetivo chico (por ejemplo "terminá el sol con 10 más de aire", "sumá 3 de ciencia", "poné 2 ⚡ en la obra", o frenar casi toda la tormenta si ese día hay una fuerte). En el plan se pone en verde apenas el reparto la cumple. Premio: una medalla 🏅 y +1 ⚡ para el sol siguiente. Los números están puestos para que no se cumplan solas: hay que cambiar el reparto de siempre.
- **🚙 Expediciones (desde el sol 3):** en días **sin tormenta solar** se puede mandar el rover a explorar. Se ofrecen dos lugares de los cuatro que se ven alrededor de la base (cráter con hielo, cueva de lava, un rover viejo, cerro mirador) o quedarse a descansar. Salir gasta aire y puede salir mal; si sale bien da aire, ciencia o energía para mañana. Cada lugar enseña un dato real y, una vez visitado, queda con una banderita. Hay hasta 3 por misión.

### 7. Informe final
Se gana sobreviviendo los 12 soles. Hay hasta **3 estrellas**: ★ sobrevivir, ★ llegar a 14 puntos de ciencia (para eso conviene aprovechar obras, misiones y expediciones), ★ recibir poca radiación. El informe aparece en la consola con 3 pestañas:

- **Resumen:** soles, tormentas reales enfrentadas, radiación, ciencia, cuántas decisiones salieron bien y cuántas tuvieron costo, misiones del día cumplidas, obras construidas, y el **estado final de la base** (mina, muestras, parches, fugas, paneles rotos).
- **Bitácora:** sol por sol, cada tormenta (con fecha y velocidad real de la CME y cuánto bloqueó el escudo), cada evento con la opción elegida y su consecuencia, y las reparaciones.
- **Aprendiste:** las **habilidades de astronauta** que practicó (administrar recursos, leer pronósticos, protegerse de la radiación, decidir en emergencias, trabajar con minutos de retraso) y los datos científicos que vio.

Antes del informe hay **4 preguntas de repaso** (radiación, hacia dónde van las tormentas, qué cuidar primero, retraso de los mensajes), cada una con su explicación. El resumen muestra cuántas acertó. Se pueden saltear y las respuestas no se guardan. Si se pierde (sin oxígeno, sin comida o demasiada radiación) se explica por qué, sin castigar: la idea es volver a intentar con otra estrategia.

**📤 Compartir:** el informe tiene un botón que arma una imagen con el logo, las estrellas y los números de la misión, para mandársela a alguien. En celulares abre el menú de compartir; en compus la descarga. La imagen se dibuja en el navegador, no se sube a ningún lado y **no lleva el nombre del jugador**.

### 🌐 Idiomas
Botón **ES / EN** en la pantalla de inicio, en la selección de personaje y en el panel de datos. Todo el juego está traducido (interfaz, objetos, eventos, glosario) y la elección se recuerda.

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
2. **Corte al interior de la nave**: transición a la ilustración de la cabina (según el comandante elegido) y aparece la **terminal "Expedición a Marte"**: la pantalla verde muestra la situación y las opciones, la **impresora** saca un ticket con el costo de la opción elegida y el **botón ✓** confirma (también con teclas 1-3 y Enter).
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
| **DONKI: eyecciones de masa coronal (CME)** | Cada tormenta del juego es una CME real, con su **fecha y velocidad**. **Solo cuentan las que la simulación WSA-ENLIL de la NASA predijo que llegaban a Marte** (`cmeAnalyses[].enlilList[].impactList[]` con `location: "Mars"`), y caen el **día que llegan** a Marte. Nivel según la velocidad: hasta 999 km/s débil, 1000+ fuerte, 1500+ extrema | [api.nasa.gov](https://api.nasa.gov) · [DONKI](https://kauai.ccmc.gsfc.nasa.gov/DONKI/) |
| **Partículas medidas en Marte** | El 20/05/2024 el rover Curiosity midió su mayor pico de radiación (≈ 8.100 microgray en un día). Ese evento entra como tormenta extrema en el modo 2024 | [api.nasa.gov](https://api.nasa.gov) |
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
git clone https://github.com/necsuuu/mision-marte.git
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

## ⚡ Rendimiento

- **El título carga rápido:** el motor 3D (three.js y las escenas) va en un archivo aparte que se descarga mientras se ve el título, y las imágenes del resto del juego se precargan en segundo plano. La primera carga pasó de 2,4 MB a unos 0,5 MB.
- **No se dibuja lo que no se ve:** cuando la computadora del juego tapa toda la pantalla, la escena 3D de atrás casi no se dibuja (las animaciones siguen corriendo, así que al volver todo está en su lugar).
- **Texturas más baratas:** el ruido de las superficies se lee de una textura 3D chiquita generada una sola vez, en vez de calcularse píxel por píxel; y de lejos, el detalle fino no se calcula.
- **Caché:** `vercel.json` marca los archivos de `assets/` como permanentes, así la segunda visita no descarga nada.
- `npm run build` genera la versión para hosting. `npm run build:single` genera una versión con todo en un solo archivo JS (carpeta `dist-single`).

## 📁 Estructura del proyecto

```
src/
├── App.jsx                 Pantallas y escena 3D según el momento del juego
├── main.jsx
├── styles.css
├── assets/
│   ├── characters/         Comandantes y tripulación (recortados, fondo transparente)
│   │   └── walk/           Fotogramas de caminata (quieto / pierna izq. / pierna der.)
│   ├── scenes/             Ilustraciones de la cabina (una por comandante)
│   └── ui/                 Terminal de decisiones y consola de reporte
├── data/
│   ├── donki.js            API DONKI en vivo + reparto de tormentas por sol
│   ├── snapshot.js         Datos reales guardados (respaldo + mayo 2024)
│   └── marsDistance.js     Distancia Tierra–Marte del día → retraso de radio
├── game/
│   ├── content.js          ⭐ TODOS los textos, objetos, eventos y números de balance
│   ├── characters.js       Comandantes, tripulación, fotogramas e ilustraciones
│   ├── shipLayout.js       Plano de la nave: módulos, muebles, lugares para objetos, obstáculos
│   ├── pathfinding.js      Grilla + A*: el astronauta rodea los muebles
│   ├── quiz.js             Preguntas de repaso y habilidades de astronauta
│   ├── voice.js            Lectura en voz alta (Web Speech API)
│   ├── sfx.js              Sonido: efectos y ambiente generados por código (Web Audio)
│   ├── shareCard.js        Imagen para compartir el resultado (se dibuja en el navegador)
│   ├── device.js           Detecta pantalla táctil, iPhone y si se puede usar pantalla completa
│   └── store.js            Lógica: energía, recursos, radiación, eventos, estado de la base, bitácora
├── i18n/
│   ├── ui.js               Textos de la interfaz (es / en)
│   ├── content_en.js       Objetos, eventos y glosario en inglés
│   └── core.js, useT.js    Funciones para traducir
├── three/
│   ├── Planet.jsx          Marte girando (pantallas de inicio)
│   ├── surfaces.js         Texturas reales sin imágenes: grano, relieve, desgaste y manchas para metal, pintura, roca y tela
│   ├── Reflections.jsx     Entorno de reflejos para que los metales no se vean de plástico
│   ├── Launch.jsx          Cinemática de despegue: plataforma, cuenta regresiva, nubes, espacio y la Tierra
│   ├── MarsBase.jsx        Escena de la base: cielo, día/noche, director de cámara, cinemática
│   ├── baseParts.jsx       Domo, invernadero, paneles, antena, rover, nave, mina, tripulación
│   ├── builds.jsx          Obras que construye el jugador y lugares de expedición
│   ├── effects.jsx         Partículas: polvo, tormenta solar, fuga de aire, meteorito, alarma, fuego
│   ├── cine.jsx            Reloj de la cinemática y animación de despliegue
│   ├── Room.jsx            Nave de 3 módulos: muebles, objetos, jugador (click/WASD), cámara que sigue, tripulación
│   ├── items3d.jsx         Modelos 3D de los objetos
│   ├── CharacterSprite.jsx Personajes 2D dentro del mundo 3D
│   ├── terrain.jsx         Terreno y rocas de Marte
│   └── noise.js            Ruido para generar terreno y texturas
└── ui/                     Pantallas: inicio, selección, modo, cinemática, sol, final, panel de datos
    ├── LaunchUI.jsx        Cuenta regresiva y textos del despegue
    ├── Quiz.jsx            Preguntas de repaso al final de la misión
    ├── ItemCard.jsx        Ficha del objeto con el retrato del comandante
    ├── Terminal.jsx        Terminal CRT de decisiones (pantalla + impresora + botón ✓)
    └── Console.jsx         Consola ámbar del reporte nocturno y final
public/
├── manifest.webmanifest    Para abrir el juego como app desde la pantalla de inicio del celular
└── icon-*.png, favicon.png Ícono del juego (el casco de astronauta)
tools/
├── generar_fotogramas.py   Genera los fotogramas de caminata a partir de los dibujos originales
├── armar_icono.py          Arma el ícono del juego a partir del dibujo del casco
└── armar_fondo_personajes.py  Arma el fondo borroso de la selección de personaje
```

---

## ✏️ Cómo modificar el juego

- **Dificultad y balance:** `src/game/content.js` → objeto `BASE` (oxígeno inicial, cuánto rinde cada ⚡, dosis de radiación, etc.), `CAPACITY` (masa máxima) y `SOLS` (duración).
- **Agregar un evento:** sumarlo al array `EVENTS` en `content.js`. Cada evento tiene `scene` (a dónde mira la cámara), `incident` (qué animación muestra) y `choices` con `effects`, `fx` y `outcome`.
- **Obras, misiones del día y expediciones:** `BUILDS`, `MISSIONS` y `EXPEDITION_EVENT` en `content.js` (costos, premios y textos). Las condiciones de cada misión están en `missionMet`, en `src/game/store.js`.
- **Textos y traducciones:** interfaz en `src/i18n/ui.js` (es/en); contenido en español en `content.js` y en inglés en `src/i18n/content_en.js`.
- **Mover muebles o agregar lugares para objetos:** `src/game/shipLayout.js` (`FURN`, `SLOTS`, `OBSTACLES`).
- **Fotogramas de caminata dibujados a mano:** reemplazar los archivos de `src/assets/characters/walk/` (mismo tamaño) o regenerarlos con `python3 tools/generar_fotogramas.py` (necesita Pillow, numpy y scipy).
- **Cambiar quién maneja el jugador:** `src/game/characters.js` (campo `sprite` de cada comandante).
- **Depurar:** en la consola del navegador, `__game.getState()` muestra todo el estado del juego y `__content` el contenido (sirve para forzar un evento).

---

## 🧪 Notas técnicas de las APIs

Probado el 14/11/2026:

- ✅ `DONKI/CME` y `DONKI/SEP` funcionan. **Máximo 60 días por consulta.**
- ❌ `DONKI/FLR` (fulguraciones) devuelve 404 del lado de la NASA → no se usa.
- ❌ `mars-photos` (fotos de rovers) está caída ("No such app") → no se usa.
- ⚠️ OSDR bloquea llamadas desde el navegador (CORS) → usamos sus hallazgos como datos curiosos; para usarlo en vivo hace falta un backend.
- ⚠️ `DEMO_KEY` se queda sin cupo enseguida → usar una key propia.
- ✅ Las CME de DONKI traen las simulaciones **WSA-ENLIL** con la lista de lugares a los que llega cada una (Tierra, Marte, sondas). El juego usa eso para saber si una tormenta llega a Marte, tanto en vivo como en los datos guardados.

---

## 🤝 Simplificaciones honestas

También se explican dentro del juego:

- Solo cuentan las tormentas que la simulación de la NASA predijo que llegaban a Marte. La simulación es un pronóstico: puede no coincidir exactamente con lo que pasó.
- Las **tormentas chicas** tienen más efecto que en la realidad, para que se noten. Las grandes (como mayo 2024, ≈ 8 mGy en un día) son parecidas a lo real. La dosis base (0,64 mSv/día) sí es real. La energía y los recursos son **números de juego**.
- Los **plantines de papa** ya vienen germinados y crecen en hidroponía mucho más rápido que en la realidad.
- Si los datos no traen una tormenta fuerte, se usa un **simulacro** con la de mayo 2024, y el juego lo dice.
- Las **obras** se terminan en pocos soles y las **expediciones** duran un día y tienen resultados al azar: en la realidad construir un refugio o un invernadero lleva meses, y las salidas se planean con mucho más cuidado. Los lugares (hielo, tubos de lava, un rover viejo) existen en Marte, pero no están todos juntos al lado de una base.
- La distancia Tierra–Marte usa órbitas simplificadas (error de unos pocos %).
- Este proyecto **no es un producto oficial de la NASA** y no usa logos ni elementos de marca de la NASA.

---

## 🤖 Uso de inteligencia artificial

Declaramos dónde usamos herramientas de IA en este proyecto:

- **Código y textos del juego:** se escribieron con ayuda de un asistente de IA generativa. El equipo puso la idea y las mecánicas, lo hizo probar a mucha gente y fue pidiendo y revisando cada cambio.
- **Texturas y sonidos:** no salen de modelos de imagen ni de audio: los calcula el código del juego.
- **Ilustraciones (personajes, cabina, computadoras, portada, logos, fondo de la selección de personaje y casco del ícono):** _(completar: quién las hizo y con qué herramienta)_.
- **Datos:** las tormentas solares y la radiación vienen de la NASA (DONKI y Curiosity RAD). La IA no generó datos.
- No se generó ni modificó ningún elemento de marca de la NASA.

---

## 👥 Créditos

**Equipo Código Cuántico**, NASA Space Apps Challenge 2026, Santiago del Estero, Argentina.

Datos: NASA DONKI, NASA OSDR, Curiosity RAD (NASA/JPL-Caltech/SwRI), Agencia Espacial Canadiense.
