import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AnimatePresence } from 'framer-motion'
import { useGame } from './game/store'
import Planet from './three/Planet'
import MarsBase from './three/MarsBase'
import Room from './three/Room'
import Launch from './three/Launch'
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
import Quiz from './ui/Quiz'
import Quality from './three/Quality'
import PauseClock from './three/PauseClock'
import PauseMenu from './ui/PauseMenu'
import { Toolbar } from './ui/common'

export default function App() {
  const screen = useGame((s) => s.screen)
  const [dataOpen, setDataOpen] = useState(false)
  const onBase = screen === 'sol' || screen === 'end' || screen === 'landing'
  const finishLanding = useGame((s) => s.finishLanding)
  const finishLaunch = useGame((s) => s.finishLaunch)
  const finishQuizPre = useGame((s) => s.finishQuizPre)
  const paused = useGame((s) => s.paused)
  const inRoom = screen === 'loading' || screen === 'tutorial'
  const planetOffset = screen === 'title' ? [2.4, -0.2, 0] : screen === 'character' ? [4.6, -2.2, -4] : [3.6, -1.6, -3]

  return (
    <div className="app">
      <div className="canvas-wrap">
        <Canvas
          shadows
          frameloop={paused ? 'never' : 'always'}
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 8], fov: 45 }}
        >
          <Quality />
          <PauseClock />
          <Suspense fallback={null}>{screen === 'launch' ? <Launch onDone={finishLaunch} /> : onBase ? <MarsBase key={screen === 'landing' ? 'cine' : 'base'} cinematic={screen === 'landing'} onCineDone={finishLanding} /> : inRoom ? <Room /> : <Planet offset={planetOffset} />}</Suspense>
        </Canvas>
      </div>

      <div className="ui">
        <AnimatePresence mode="wait">
          {screen === 'title' && <Title key="title" onData={() => setDataOpen(true)} />}
          {screen === 'character' && <CharacterSelect key="character" />}
          {screen === 'mode' && <ModeSelect key="mode" />}
          {screen === 'quiz' && <Quiz key="quiz" phase="pre" onDone={finishQuizPre} onSkip={() => finishQuizPre(null)} />}
          {screen === 'launch' && <LaunchUI key="launch" />}
          {screen === 'tutorial' && <Tutorial key="tutorial" />}
          {screen === 'landing' && <LandingUI key="landing" />}
          {screen === 'loading' && <Loading key="loading" />}
          {screen === 'sol' && <SolScreen key="sol" onData={() => setDataOpen(true)} />}
          {screen === 'end' && <End key="end" onData={() => setDataOpen(true)} />}
        </AnimatePresence>
      </div>

      {screen !== 'title' && <Toolbar />}
      <PauseMenu />
      <AnimatePresence>{dataOpen && <DataPanel onClose={() => setDataOpen(false)} />}</AnimatePresence>
    </div>
  )
}
