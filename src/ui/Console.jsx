// Consola verde con pantalla ámbar: reporte de cada noche y del final de la misión.
// Pantalla grande: datos. Pantallita: sol / estrellas. Botón ✓: continuar. Teléfono: "llamar a la Tierra" (datos NASA).
import consoleImg from '../assets/ui/console.webp'
import { ScrollArea } from './common'

// Posiciones sobre console.webp (1600 × 1250, armada con tools/armar_consola.py)
const MAIN = { left: '38.66%', top: '23.48%', width: '45.04%', height: '48.56%' }
const MINI = { left: '87.19%', top: '65.28%', width: '8.25%', height: '11.03%' }
const OK = { left: '89.35%', top: '79.85%', width: '6%', height: '4.5%' }
const PHONE = { left: '0%', top: '84%', width: '15%', height: '15.5%' }
const BULB = { left: '42.9%', top: '0.5%', width: '13%', height: '16.6%' }

export default function Console({ children, mini, onOk, okLabel, onPhone, phoneLabel, alarm }) {
  return (
    <div className="console-wrap">
      <img className="console-img" src={consoleImg} alt="" draggable={false} />
      <div className={'bulb' + (alarm ? ' alarm' : '')} style={BULB} />
      <div className="amber" style={MAIN}>
        <ScrollArea className="amber-inner">{children}</ScrollArea>
        <div className="scanlines" />
      </div>
      <div className="mini-screen" style={MINI}>{mini}</div>
      <button className="console-ok" style={OK} onClick={onOk} aria-label={okLabel} />
      {okLabel && <button className="console-ok-label" onClick={onOk}>{okLabel} ✓</button>}
      {onPhone && <button className="console-phone" style={PHONE} onClick={onPhone} title={phoneLabel} aria-label={phoneLabel} />}
    </div>
  )
}
