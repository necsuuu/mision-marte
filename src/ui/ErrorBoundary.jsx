// 🛟 Red de seguridad: si algo falla al dibujar, el juego no queda en negro.
// Repara la partida (termina la tarea en curso o saltea la tarjeta rota) y sigue; el progreso no se pierde
// porque el estado del juego vive fuera de React.
import { Component, Fragment } from 'react'
import { useGame } from '../game/store'
import { t } from '../i18n/core'

/** Guarda el último error para poder investigarlo (window.__lastCrash y localStorage 'mm-crash'). */
export function recordCrash(where, error, info) {
  try {
    const s = useGame.getState()
    const crash = {
      where,
      when: new Date().toISOString(),
      msg: String(error?.message || error).slice(0, 300),
      stack: String(error?.stack || '').slice(0, 1200),
      comp: String(info?.componentStack || '').slice(0, 600),
      state: { screen: s.screen, phase: s.phase, sol: s.sol, lang: s.lang, task: s.task && { id: s.task.id, mini: s.task.mini }, card: s.cards?.[0]?.event?.id || s.cards?.[0]?.type || null },
    }
    window.__lastCrash = crash
    console.error('[juego] error recuperado en ' + where, error, info?.componentStack)
    try { localStorage.setItem('mm-crash', JSON.stringify(crash)) } catch { /* sin almacenamiento */ }
  } catch { /* que guardar el error nunca rompa nada */ }
}

/**
 * Envuelve todo el juego. Ante un error: la primera vez repara y vuelve a montar sola;
 * si vuelve a fallar enseguida, muestra una pantalla con botones para seguir o reiniciar.
 */
export class AppBoundary extends Component {
  state = { error: null, manual: false, key: 0 }
  last = 0
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) {
    recordCrash('app', error, info)
    const now = Date.now()
    const again = now - this.last < 10000
    this.last = now
    if (again) return this.setState({ manual: true })
    try { useGame.getState().recover(false) } catch { /* se intenta igual */ }
    this.setState((st) => ({ error: null, manual: false, key: st.key + 1 }))
  }
  go = (hard) => {
    try {
      if (hard) useGame.getState().goTitle()
      else useGame.getState().recover(true)
    } catch { /* se intenta igual */ }
    this.last = 0
    this.setState((st) => ({ error: null, manual: false, key: st.key + 1 }))
  }
  render() {
    const { error, manual, key } = this.state
    if (!error) return <Fragment key={key}>{this.props.children}</Fragment>
    if (!manual) return <div className="crash-screen" />
    let lang = 'en'
    try { lang = useGame.getState().lang } catch { /* por defecto */ }
    return (
      <div className="crash-screen">
        <div className="crash-card">
          <div className="crash-icon">🛠️</div>
          <h2>{t(lang, 'crash.title')}</h2>
          <p>{t(lang, 'crash.text')}</p>
          <div className="crash-btns">
            <button className="btn primary" onClick={() => this.go(false)}>▶ {t(lang, 'crash.continue')}</button>
            <button className="btn ghost" onClick={() => this.go(true)}>🏠 {t(lang, 'crash.menu')}</button>
          </div>
          <small className="crash-detail">{String(error?.message || error).slice(0, 160)}</small>
        </div>
      </div>
    )
  }
}

/**
 * Envuelve una parte del juego (la interfaz de la tarea, la tarea en 3D). Si falla, no se dibuja esa parte,
 * se avisa con onError (por ejemplo: que la tarea la termine la tripulación) y el resto sigue andando.
 * Se usa con key=… para que en la tarea siguiente vuelva a intentarlo.
 */
export class PartBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error, info) {
    recordCrash(this.props.name || 'parte', error, info)
    try { this.props.onError?.() } catch { /* se sigue igual */ }
  }
  render() { return this.state.failed ? null : this.props.children }
}
