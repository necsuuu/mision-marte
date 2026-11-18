import { lazy, Suspense, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGame } from './game/store'
import LaunchUI from './ui/LaunchUI'
import CharacterSelect from './ui/CharacterSelect'
import ModeSelect from './ui/ModeSelect'
import LandingUI from './ui/LandingUI'
import Tutorial from './ui/Tutorial'
import Title from './ui/Title'
import Loading from './ui/Loading'
import SolScreen from './ui/SolScreen'
import End from './ui/End'
import DataPanel from './ui/DataPanel'
import PauseMenu from './ui/PauseMenu'
import { Toolbar, RotateHint } from './ui/common'
import charBg from './assets/title/char_bg.webp'

// El motor 3D (three.js y las escenas) se descarga aparte: el título aparece enseguida y el 3D llega mientras tanto.
const Stage = lazy(() => import('./three/Stage'))

export default function App() {
  const screen = useGame((s) => s.screen)
  const [dataOpen, setDataOpen] = useState(false)
  const lang = useGame((s) => s.lang)
  useEffect(() => {
    document.title = lang === 'en' ? 'Surviving on Mars · Junior Astronaut Mission Trainer' : 'Sobreviviendo en Marte · Entrenador de Astronautas Junior'
    document.documentElement.lang = lang
    document.documentElement.setAttribute('translate', 'no') // el idioma se cambia con el botón ES / EN, no con el traductor del navegador
  }, [lang])
  return (
    <div className="app">
      <div className="canvas-wrap">
        <Suspense fallback={null}><Stage /></Suspense>
      </div>

      {/* Fondo fijo de la selección de personaje y de modos: queda quieto mientras las pantallas
          se desvanecen, así no se ve lo que hay detrás en el cambio */}
      {(screen === 'character' || screen === 'mode') && <div className="char-backdrop" style={{ '--char-bg': `url(${charBg})` }} />}

      <div className="ui">
        <AnimatePresence mode="wait">
          {screen === 'title' && <Title key="title" onData={() => setDataOpen(true)} />}
          {screen === 'character' && <CharacterSelect key="character" />}
          {screen === 'mode' && <ModeSelect key="mode" />}
          {screen === 'launch' && <LaunchUI key="launch" />}
          {screen === 'tutorial' && <Tutorial key="tutorial" />}
          {screen === 'landing' && <LandingUI key="landing" />}
          {screen === 'loading' && <Loading key="loading" />}
          {screen === 'sol' && <SolScreen key="sol" onData={() => setDataOpen(true)} />}
          {screen === 'end' && <End key="end" onData={() => setDataOpen(true)} />}
        </AnimatePresence>
      </div>

      {screen !== 'title' && <Toolbar />}
      {['launch', 'tutorial', 'loading', 'landing', 'sol', 'end'].includes(screen) && <RotateHint />}
      <PauseMenu />
      <AnimatePresence>{dataOpen && <DataPanel onClose={() => setDataOpen(false)} />}</AnimatePresence>
    </div>
  )
}
