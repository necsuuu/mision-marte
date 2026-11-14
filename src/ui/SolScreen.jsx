import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame, chipsAvailable, project, shieldFraction } from '../game/store'
import { BASE, SOLS, SYSTEMS, STORM_TEXT, REPAIRS, LEAK_O2, ICE_MINE_O2 } from '../game/content'
import { fmtDate } from '../data/donki'
import { earthMarsDistance } from '../data/marsDistance'
import { Bar, Delta, Term, fade } from './common'
import { getCharacter } from '../game/characters'

const DAWN_MS = 2300
const INCIDENT_MS = 3300

export default function SolScreen({ onData }) {
  const s = useGame()
  const card = s.cards[0]
  return (
    <motion.div className="screen sol-screen" {...fade}>
      <Hud s={s} onData={onData} />
      <div className="sol-main">
        <AnimatePresence mode="wait">
          {s.phase === 'dawn' && <Dawn key={'d' + s.sol} s={s} />}
          {s.phase === 'event' && card && <InfoCard key={'c' + s.sol + s.cards.length} s={s} />}
          {s.phase === 'incident' && card && <Incident key={'i' + s.sol} ev={card.event} />}
          {s.phase === 'outcome' && card && <Outcome key={'o' + s.sol} s={s} />}
          {s.phase === 'plan' && <Planner key={'p' + s.sol} s={s} />}
          {s.phase === 'report' && <Report key={'r' + s.sol} s={s} />}
        </AnimatePresence>
      </div>
      <AnimatePresence>{s.phase === 'decision' && card && <Decision key={'dec' + s.sol} s={s} />}</AnimatePresence>
    </motion.div>
  )
}

// ---------- HUD ----------
function Hud({ s, onData }) {
  const src = s.weather?.source
  const b = s.base
  return (
    <div className="hud">
      <div className="hud-left">
        <div className="hud-avatar" title={s.player.name}>
          <img src={getCharacter(s.player.character).sprite} alt="" />
          <span>{s.player.name}</span>
        </div>
        <div className="sol-badge">
          <small><Term k="sol">SOL</Term></small>
          <b>{s.sol}</b>
          <small>de {SOLS}</small>
        </div>
        <div className="timeline">
          {Array.from({ length: SOLS }).map((_, i) => {
            const past = i < s.sol - 1
            const now = i === s.sol - 1
            const stormed = (past || now) && s.plan[i]?.level > 0
            return <span key={i} className={'tl' + (past ? ' past' : '') + (now ? ' now' : '') + (stormed ? ' storm' : '')}>{stormed ? '☀️' : past ? '✓' : ''}</span>
          })}
        </div>
      </div>
      <div className="hud-bars">
        <Bar emoji="🫁" label="Oxígeno" value={s.o2} color="linear-gradient(90deg,#3aa8d8,#7fe9ff)" />
        <Bar emoji="🥔" label="Comida" value={s.food} color="linear-gradient(90deg,#6bbf59,#c4f07a)" />
        <Bar emoji="❤️" label="Salud" value={s.health} color="linear-gradient(90deg,#e0475f,#ff8fa3)" warn={40} />
        <Bar emoji="☢️" label="Radiación" value={s.dose} max={BASE.doseLimit} color="linear-gradient(90deg,#9b6bff,#e3a6ff)" warn={-1} suffix=" mSv" />
        <Bar emoji="🔬" label="Ciencia" value={s.science} max={BASE.scienceGoal} color="linear-gradient(90deg,#f0b429,#ffe08a)" warn={-1} suffix={`/${BASE.scienceGoal}`} />
      </div>
      <div className="hud-right">
        {/* Estado de la base: castigos y premios que quedan */}
        <div className="base-status">
          {b.leak && <span className="bad" title={`Fuga: −${LEAK_O2} 🫁 por sol`}>💨</span>}
          {b.brokenPanels > 0 && <span className="bad" title="Panel roto">💥{b.brokenPanels > 1 ? b.brokenPanels : ''}</span>}
          {b.iceMine && <span className="good" title={`Mina de hielo: +${ICE_MINE_O2} 🫁 por sol`}>⛏️🧊</span>}
          {b.samples > 0 && <span className="good" title="Muestras guardadas">🪨{b.samples}</span>}
          {b.patches > 0 && <span className="neutral" title="Parches en el domo">🩹{b.patches}</span>}
        </div>
        <button className={'data-chip ' + src} onClick={onData} title="Ver fuentes de datos">
          <span className="dot" />
          {src === 'live' ? 'DONKI en vivo' : src === 'archive' ? 'DONKI 2024' : `DONKI ${s.weather?.savedAt ? fmtDate(s.weather.savedAt) : ''}`}
        </button>
      </div>
    </div>
  )
}

// ---------- Amanecer: pasa un día ----------
function Dawn({ s }) {
  const afterDawn = useGame((st) => st.afterDawn)
  useEffect(() => {
    const t = setTimeout(afterDawn, DAWN_MS)
    return () => clearTimeout(t)
  }, [afterDawn])
  return (
    <motion.div className="dawn-card" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} transition={{ duration: 0.5 }}>
      <span>🌅</span>
      <b>SOL {s.sol}</b>
      {s.base.leak && <small>💨 La fuga sigue…</small>}
    </motion.div>
  )
}

// ---------- Tarjetas informativas (intro / tormenta) ----------
function StormBody({ storm }) {
  const dose = BASE.stormDose[storm.level]
  const isMay20 = storm.date?.startsWith('2024-05-20')
  return (
    <>
      <p>
        El <b>{fmtDate(storm.date)}</b> el Sol lanzó una <Term k="cme">eyección de masa coronal</Term> a <b>{storm.speed.toLocaleString('es-AR')} km/s</b>
        {storm.sep ? <> y se detectaron <Term k="sep">partículas energéticas</Term></> : null}.
      </p>
      <div className="real-tag">📡 Dato real de la NASA (<Term k="donki">DONKI</Term>)</div>
      {isMay20 && (
        <div className="callout">
          🛰️ <b>¡Esto pasó de verdad en Marte!</b> El 20 de mayo de 2024 el rover Curiosity midió su mayor subida de <Term k="radiacion">radiación</Term>: como <b>30 radiografías de tórax</b> de golpe.
        </div>
      )}
      <p className="muted">Sin escudo: <b>+{dose} <Term k="msv">mSv</Term></b> ☢️ · <small>(en el juego imaginamos que viaja hacia Marte)</small></p>
      <p className="tip">👉 ⚡ al <b>🛡️ Escudo</b></p>
    </>
  )
}

function InfoCard({ s }) {
  const card = s.cards[0]
  const { nextCard } = useGame.getState()
  if (card.type === 'intro') {
    return (
      <motion.div className="panel card" {...fade}>
        <div className="kicker">🏠 Día 1 en la base</div>
        <h2>¡{getCharacter(s.player.character).welcome} a Marte, {s.player.name}!</h2>
        <div className="intro-flow">
          <div className="big">☀️ → ⚡⚡⚡</div>
          <div className="sys-tiles">
            {SYSTEMS.map((x) => (
              <div key={x.id} className="sys-tile" style={{ '--c': x.color }} title={x.help}>
                <span>{x.emoji}</span>
                <b>{x.name}</b>
              </div>
            ))}
          </div>
          <p className="muted center-text">⚡ nunca alcanza para todo · tus decisiones cambian la base 🏗️</p>
          {s.easy && <div className="real-tag">⭐ Modo cadete: empezás con más 🫁 y 🥔</div>}
        </div>
        <button className="btn primary" onClick={nextCard}>¡A trabajar! ▶</button>
      </motion.div>
    )
  }
  const st = STORM_TEXT[card.storm.level]
  return (
    <motion.div className={'panel card storm-card lvl' + card.storm.level} {...fade}>
      <div className="kicker">⚠️ Alerta de clima espacial</div>
      <h2>{st.emoji} {st.title}</h2>
      <StormBody storm={card.storm} />
      <button className="btn primary" onClick={nextCard}>Prepararse ▶</button>
    </motion.div>
  )
}

// ---------- 1) El problema se ve en la base ----------
function Incident({ ev }) {
  const toDecision = useGame((st) => st.toDecision)
  useEffect(() => {
    const t = setTimeout(toDecision, INCIDENT_MS)
    return () => clearTimeout(t)
  }, [toDecision])
  return (
    <motion.div className="incident-caption" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <span className="pulse-dot" /> {ev.emoji} {ev.title}
    </motion.div>
  )
}

// ---------- 2) Corte al interior de la nave: la tripulación decide ----------
function DelayFact() {
  const d = earthMarsDistance(new Date())
  return (
    <div className="callout small">
      📡 Hoy la Tierra está a <b>{Math.round(d.km / 1e6)} millones de km</b>: un mensaje tarda <b>~{Math.round(d.minutes)} min</b> en llegar y otros {Math.round(d.minutes)} en volver. <Term k="delay">¿Por qué?</Term>
    </div>
  )
}

function Decision({ s }) {
  const ev = s.cards[0].event
  const ch = getCharacter(s.player.character)
  const { choose } = useGame.getState()
  const choices = ev.choices.filter((c) => !c.requires || s.inventory[c.requires])
  return (
    <motion.div
      className="decision"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)', transition: { duration: 0.7, ease: 'easeInOut' } }}
      exit={{ clipPath: 'circle(0% at 50% 45%)', transition: { duration: 0.6, ease: 'easeInOut' } }}
    >
      <motion.img className="decision-bg" src={ch.interior} alt="" initial={{ scale: 1.12 }} animate={{ scale: 1.02, transition: { duration: 8, ease: 'easeOut' } }} />
      <div className="decision-shade" />
      <motion.div className="decision-alert" initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.5 } }}>
        🚨 {ev.emoji} {ev.title}
      </motion.div>
      <motion.div className="panel decision-card" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.6 } }}>
        <div className="decision-who">
          <img src={ch.sprite} alt="" />
          <div>
            <div className="kicker">Comandante {s.player.name}, ¿qué hacemos?</div>
            <p>{ev.text}</p>
          </div>
        </div>
        {ev.delayFact && <DelayFact />}
        <div className="choices">
          {choices.map((c, i) => (
            <motion.button key={i} className="choice" onClick={() => choose(c)} whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
              <span>{c.label}</span>
              <small>{c.hint}</small>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------- 3) Paneo por la base: la consecuencia ----------
function Outcome({ s }) {
  const ev = s.cards[0].event
  const r = s.cardResult
  const { nextCard } = useGame.getState()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2200)
    return () => clearTimeout(t)
  }, [])
  const good = !['leaking', 'dusty', 'worse', 'panelbroken'].includes(r.fx)
  return (
    <motion.div className={'panel card outcome ' + (good ? 'good' : 'bad')} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.8 } }} exit={{ opacity: 0 }}>
      <div className="kicker">{good ? '✅ Resultado' : '⚠️ Consecuencia'}</div>
      <h2 className="outcome-text">{r.text}</h2>
      {ev.fact && <div className="fact">💡 {ev.fact}</div>}
      <button className="btn primary" disabled={!ready} onClick={nextCard}>{ready ? 'Continuar ▶' : '🎥 …'}</button>
    </motion.div>
  )
}

// ---------- Plan de energía ----------
function Chips({ value, max, color, onSet, disabledFrom }) {
  return (
    <div className="chips">
      {Array.from({ length: max }).map((_, i) => {
        const on = i < value
        const dis = !on && i >= disabledFrom
        return (
          <button
            key={i}
            className={'chip' + (on ? ' on' : '')}
            style={on ? { background: color, boxShadow: `0 0 12px ${color}` } : null}
            disabled={dis}
            onClick={() => onSet(on && i === value - 1 ? i : i + 1)}
            aria-label={`${i + 1} de energía`}
          >⚡</button>
        )
      })}
    </div>
  )
}

function Planner({ s }) {
  const { setAlloc, endSol } = useGame.getState()
  const avail = chipsAvailable(s)
  const p = project(s)
  const free = avail - p.used
  const storm = s.plan[s.sol - 1]
  const effects = {
    life: <><Delta v={p.dO2} /> 🫁 {p.leakLoss ? <em className="warn">💨−{p.leakLoss}</em> : null}{p.mine ? <em className="good-tag">⛏️+{p.mine}</em> : null}</>,
    greenhouse: s.inventory.seeds ? <><Delta v={p.dFood} /> 🥔</> : <em className="warn">Sin semillas 😢</em>,
    shield: <>🛡️ <b>{Math.round(shieldFraction(s, s.alloc.shield) * 100)}%</b> {storm?.level ? <em className="warn">☀️ ¡tormenta!</em> : null}</>,
    science: s.today.blockScience ? <em className="warn">😴</em> : <><Delta v={p.dSci} /> 🔬</>,
  }
  const repairs = []
  if (s.base.leak) repairs.push({ key: 'fixLeak', ...REPAIRS.leak, on: s.alloc.fixLeak, why: `💨 −${LEAK_O2} 🫁/sol` })
  if (s.base.brokenPanels > 0) repairs.push({ key: 'fixPanel', ...REPAIRS.panel, on: s.alloc.fixPanel, why: '💥 −2 ⚡/sol' })
  const notes = []
  if (s.dust.sols > 0) notes.push(`🌪️ ${Math.round((1 - s.dust.level) * 100)}% ⚡ · ${s.dust.sols} soles`)
  if (s.today.chipsPenalty) notes.push(`⚠️ −${s.today.chipsPenalty} ⚡ hoy`)
  if (s.battery) notes.push(`🔋 +${s.battery} ⚡`)

  return (
    <motion.div className="panel planner" {...fade}>
      <div className="planner-head">
        <div>
          <div className="kicker">Plan de energía · Sol {s.sol}</div>
          <h2>¿Dónde va la ⚡?</h2>
        </div>
        <div className="energy-pool">
          {Array.from({ length: avail }).map((_, i) => <span key={i} className={'pool-chip' + (i < p.used ? ' used' : '')}>⚡</span>)}
          {avail === 0 && <span className="muted">Sin energía…</span>}
          <small>{free} libre{free === 1 ? '' : 's'}</small>
        </div>
      </div>
      {notes.length > 0 && <div className="note-row">{notes.map((n, i) => <span key={i} className="note-pill">{n}</span>)}</div>}

      {repairs.length > 0 && (
        <div className="repairs">
          {repairs.map((r) => {
            const can = r.on || free >= r.cost
            return (
              <button key={r.key} className={'repair' + (r.on ? ' on' : '')} disabled={!can} onClick={() => setAlloc(r.key, !r.on)}>
                <span className="r-emoji">{r.emoji}</span>
                <span><b>{r.label}</b><small>{r.why}</small></span>
                <span className="r-cost">{'⚡'.repeat(r.cost)}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="systems">
        {SYSTEMS.map((sys) => (
          <div key={sys.id} className="sys-row" title={sys.help}>
            <div className="sys-name">
              <span className="sys-emoji">{sys.emoji}</span>
              <div>
                <b>{sys.name}</b>
                <div className="sys-effect">{effects[sys.id]}</div>
              </div>
            </div>
            <Chips value={s.alloc[sys.id]} max={BASE.maxChipsPerSystem} color={sys.color} onSet={(v) => setAlloc(sys.id, v)} disabledFrom={s.alloc[sys.id] + free} />
          </div>
        ))}
      </div>

      <div className="planner-foot">
        <div className="muted small">
          {free > 0 ? (p.wasted > 0 ? `⚠️ ${p.wasted} ⚡ se pierden` : `🔋 ${p.saved} ⚡ → mañana`) : '✓'}
          {' '}· ☢️ <b>{p.dose.toFixed(1)} mSv</b>
        </div>
        <motion.button className="btn primary" onClick={endSol} whileTap={{ scale: 0.97 }}>🌙 Terminar sol {s.sol}</motion.button>
      </div>
    </motion.div>
  )
}

// ---------- Reporte (de noche) ----------
function Report({ s }) {
  const r = s.report
  const { nextSol } = useGame.getState()
  const dead = s.health <= 0
  const last = s.sol >= SOLS
  return (
    <motion.div className="panel card report" {...fade}>
      <div className="kicker">🌙 Noche del sol {s.sol}</div>
      <h2>{dead ? '🚨 La tripulación está en peligro' : r.storm?.level ? (r.blocked >= 0.6 ? '🛡️ ¡El escudo aguantó!' : '☢️ La tormenta pasó') : '😴 A dormir'}</h2>
      <div className="report-grid">
        <div><span>🫁</span><Delta v={s.o2 - r.o2Before} /></div>
        <div><span>🥔</span><Delta v={s.food - r.foodBefore} /></div>
        <div><span>❤️</span><Delta v={s.health - r.healthBefore} /></div>
        <div><span>☢️</span><Delta v={r.dose} unit=" mSv" /></div>
        <div><span>🔬</span><Delta v={r.dSci} /></div>
        <div><span>🔋</span><b>{r.saved} ⚡</b></div>
      </div>
      {r.notes.map((n, i) => <div key={i} className="note">{n}</div>)}
      {r.storm?.level > 0 && (
        <div className="fact">💡 Tu escudo bloqueó el <b>{Math.round(r.blocked * 100)}%</b>. En una misión real se refugiarían detrás de agua, comida o roca.</div>
      )}
      <button className="btn primary" onClick={nextSol}>{dead ? 'Ver qué pasó ▶' : last ? '🏁 Terminar misión' : `🌅 Sol ${s.sol + 1}`}</button>
    </motion.div>
  )
}
