import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'
import { useGame } from './game/store'

// Para depurar desde la consola del navegador: __game.getState()
window.__game = useGame

// 🎬 Demo para el jurado: abrir la página con ?demo salta directo al Sol 1 (tormenta real de mayo 2024)
if (new URLSearchParams(location.search).has('demo')) {
  const g = useGame.getState()
  g.setPlayer({ name: 'Demo', age: 11, character: 'woman' })
  g.quickStart('may2024')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
