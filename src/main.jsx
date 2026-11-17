import './domGuard' // primero: que un traductor del navegador no pueda romper la página
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'
import { useGame } from './game/store'
import { AppBoundary } from './ui/ErrorBoundary'
import { preloadAssets } from './preload'
import { initSound } from './game/sfx'
import * as content from './game/content'

// Para depurar desde la consola del navegador: __game.getState()
window.__game = useGame
window.__content = content // para pruebas: forzar un evento desde la consola

// 🎬 Demo para el jurado: abrir la página con ?demo salta directo al Sol 1 (tormenta real de mayo 2024)
if (new URLSearchParams(location.search).has('demo')) {
  const g = useGame.getState()
  g.setPlayer({ name: 'Demo', age: 11, character: 'woman' })
  g.quickStart('may2024')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppBoundary>
      <App />
    </AppBoundary>
  </StrictMode>
)

preloadAssets()
initSound()
