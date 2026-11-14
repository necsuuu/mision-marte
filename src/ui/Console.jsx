// Consola verde con pantalla ámbar: reporte de cada noche y del final de la misión.
// Pantalla grande: datos. Pantallita: sol / estrellas. Botón ✓: continuar. Teléfono: "llamar a la Tierra" (datos NASA).
import consoleImg from '../assets/ui/console.webp'

const MAIN = { left: '38.6%', top: '15%', width: '45.4%', height: '54.5%' }
const MINI = { left: '87.52%', top: '61.9%', width: '8.3%', height: '12.46%' }
const OK = { left: '89.48%', top: '78.29%', width: '6.39%', height: '5.18%' }
const PHONE = { left: '0%', top: '83.7%', width: '12.2%', height: '16.1%' }
const BULB = { left: '44.5%', top: '0%', width: '9%', height: '9%' }

export default function Console({ children, mini, onOk, okLabel, onPhone, phoneLabel, alarm }) {
  return (
    <div className="console-wrap">
      <img className="console-img" src={consoleImg} alt="" draggable={false} />
      <div className={'bulb' + (alarm ? ' alarm' : '')} style={BULB} />
      <div className="amber" style={MAIN}>
        <div className="amber-inner">{children}</div>
        <div className="scanlines" />
      </div>
      <div className="mini-screen" style={MINI}>{mini}</div>
      <button className="console-ok" style={OK} onClick={onOk} aria-label={okLabel} />
      {okLabel && <button className="console-ok-label" onClick={onOk}>{okLabel} ✓</button>}
      {onPhone && <button className="console-phone" style={PHONE} onClick={onPhone} title={phoneLabel} aria-label={phoneLabel} />}
    </div>
  )
}
