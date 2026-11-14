import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.jsx'
import { useGame } from './game/store'

// Para depurar desde la consola del navegador: __game.getState()
window.__game = useGame

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
