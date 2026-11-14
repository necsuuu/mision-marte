import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame, chipsAvailable, project, shieldFraction } from '../game/store'
import { BASE, SOLS, SYSTEMS, LEAK_O2, ICE_MINE_O2 } from '../game/content'
import { fmtDate } from '../data/donki'
import { earthMarsDistance } from '../data/marsDistance'
import { getCharacter } from '../game/characters'
import { t, locEvent, locSystem, locStorm, locRepair, outcomeText } from '../i18n/core'
import { useT } from '../i18n/useT'
import { Bar, Delta, Term, Tx, fade } from './common'
import Terminal from './Terminal'
import Console from './Console'

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
          {s.phase === 'incident' && card && <Incident key={'i' + s.sol} s={s} />}
          {s.phase === 'outcome' && card && <Outcome key={'o' + s.sol} s={s} />}
          {s.phase === 'plan' && <Planner key={'p' + s.sol} s={s} />}
        </AnimatePresence>
      </div>
      <AnimatePresence>{s.phase === 'decision' && card && <Decision key={'dec' + s.sol} s={s} />}</AnimatePresence>
      <AnimatePresence>{s.phase === 'report' && <Report key={'r' + s.sol} s={s} onData={onData} />}</AnimatePresence>
    </motion.div>
  )
}

// ---------- HUD ----------
function Hud({ s, onData }) {
  const T = useT()
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
          <small>{T('hud.of', { n: SOLS })}</small>
        </div>
        <div className="timeline">
          {Array.from({ length: SOLS }).map((_, i) => {
            const past = i < s.sol - 1
            const now = i === s.sol - 1
            const stormed = (past || now) && s.plan[i]?.level > 0
            const dec = s.decisions.find((d) => d.sol === i + 1)
            return <span key={i} className={'tl' + (past ? ' past' : '') + (now ? ' now' : '') + (stormed ? ' storm' : '') + (dec ? (dec.good ? ' good' : ' bad') : '')}>{stormed ? '☀️' : past ? '✓' : ''}</span>
          })}
        </div>
      </div>
      <div className="hud-bars">
        <Bar emoji="🫁" label={T('hud.o2')} value={s.o2} color="linear-gradient(90deg,#3aa8d8,#7fe9ff)" />
        <Bar emoji="🥔" label={T('hud.food')} value={s.food} color="linear-gradient(90deg,#6bbf59,#c4f07a)" />
        <Bar emoji="❤️" label={T('hud.health')} value={s.health} color="linear-gradient(90deg,#e0475f,#ff8fa3)" warn={40} />
        <Bar emoji="☢️" label={T('hud.rad')} value={s.dose} max={BASE.doseLimit} color="linear-gradient(90deg,#9b6bff,#e3a6ff)" warn={-1} suffix=" mSv" />
        <Bar emoji="🔬" label={T('hud.sci')} value={s.science} max={BASE.scienceGoal} color="linear-gradient(90deg,#f0b429,#ffe08a)" warn={-1} suffix={`/${BASE.scienceGoal}`} />
      </div>
      <div className="hud-right">
        <div className="base-status">
          {b.leak && <span className="bad" title={T('hud.leak', { n: LEAK_O2 })}>💨</span>}
          {b.brokenPanels > 0 && <span className="bad" title={T('hud.panel')}>💥{b.brokenPanels > 1 ? b.brokenPanels : ''}</span>}
          {b.iceMine && <span className="good" title={T('hud.mine', { n: ICE_MINE_O2 })}>⛏️🧊</span>}
          {b.samples > 0 && <span className="good" title={T('hud.samples')}>🪨{b.samples}</span>}
          {b.patches > 0 && <span className="neutral" title={T('hud.patches')}>🩹{b.patches}</span>}
        </div>
        <button className={'data-chip ' + src} onClick={onData}>
          <span className="dot" />
          {src === 'live' ? T('hud.live') : src === 'archive' ? T('hud.archive') : T('hud.saved', { date: s.weather?.savedAt ? fmtDate(s.weather.savedAt, s.lang) : '' })}
        </button>
      </div>
    </div>
  )
}

// ---------- Amanecer ----------
function Dawn({ s }) {
  const T = useT()
  const afterDawn = useGame((st) => st.afterDawn)
  useEffect(() => {
    const tm = setTimeout(afterDawn, DAWN_MS)
    return () => clearTimeout(tm)
  }, [afterDawn])
  return (
    <motion.div className="dawn-card" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} transition={{ duration: 0.5 }}>
      <span>🌅</span>
      <b>SOL {s.sol}</b>
      {s.base.leak && <small>{T('dawn.leak')}</small>}
    </motion.div>
  )
}

// ---------- Tarjetas informativas (intro / tormenta) ----------
function StormBody({ storm, lang }) {
  const T = useT()
  const dose = BASE.stormDose[storm.level]
  const isMay20 = storm.date?.startsWith('2024-05-20')
  return (
    <>
      <p>
        <Tx k="storm.launched" vars={{ date: fmtDate(storm.date, lang) }} /> <Term k="cme">{T('storm.cme')}</Term> {T('storm.at')} <b>{storm.speed.toLocaleString(lang === 'en' ? 'en-US' : 'es-AR')} km/s</b>
        {storm.sep ? <> {T('storm.sep')} <Term k="sep">{T('storm.sepWord')}</Term></> : null}.
      </p>
      <div className="real-tag">{T('storm.real')} (<Term k="donki">DONKI</Term>)</div>
      {isMay20 && <Tx as="div" className="callout" k="storm.may20" />}
      <p className="muted"><Tx k="storm.noShield" vars={{ n: dose }} /> · <small>{T('storm.imagine')}</small></p>
      <Tx as="p" className="tip" k="storm.tip" />
    </>
  )
}

function InfoCard({ s }) {
  const T = useT()
  const card = s.cards[0]
  const { nextCard } = useGame.getState()
  if (card.type === 'intro') {
    const ch = getCharacter(s.player.character)
    return (
      <motion.div className="panel card" {...fade}>
        <div className="kicker">{T('intro.day1')}</div>
        <h2>{T(ch.female ? 'intro.welcomeF' : 'intro.welcomeM', { name: s.player.name })}</h2>
        <div className="intro-flow">
          <div className="big">☀️ → ⚡⚡⚡</div>
          <div className="sys-tiles">
            {SYSTEMS.map((x) => {
              const ls = locSystem(s.lang, x)
              return (
                <div key={x.id} className="sys-tile" style={{ '--c': x.color }} title={ls.help}>
                  <span>{x.emoji}</span>
                  <b>{ls.name}</b>
                </div>
              )
            })}
          </div>
          <p className="muted center-text">{T('intro.flow')}</p>
          {s.easy && <div className="real-tag">{T('intro.cadet')}</div>}
        </div>
        <button className="btn primary" onClick={nextCard}>{T('intro.go')}</button>
      </motion.div>
    )
  }
  const st = locStorm(s.lang, card.storm.level)
  return (
    <motion.div className={'panel card storm-card lvl' + card.storm.level} {...fade}>
      <div className="kicker">{T('storm.alert')}</div>
      <h2>{st.emoji} {st.title}</h2>
      <StormBody storm={card.storm} lang={s.lang} />
      <button className="btn primary" onClick={nextCard}>{T('storm.go')}</button>
    </motion.div>
  )
}

// ---------- 1) El problema se ve en la base ----------
function Incident({ s }) {
  const ev = locEvent(s.lang, s.cards[0].event)
  const toDecision = useGame((st) => st.toDecision)
  useEffect(() => {
    const tm = setTimeout(toDecision, INCIDENT_MS)
    return () => clearTimeout(tm)
  }, [toDecision])
  return (
    <motion.div className="incident-caption" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <span className="pulse-dot" /> {ev.emoji} {ev.title}
    </motion.div>
  )
}

// ---------- 2) Corte al interior de la nave: terminal de decisión ----------
function Decision({ s }) {
  const T = useT()
  const raw = s.cards[0].event
  const ev = locEvent(s.lang, raw)
  const ch = getCharacter(s.player.character)
  const { choose } = useGame.getState()
  const options = raw.choices
    .map((c, i) => ({ c, i }))
    .filter(({ c }) => !c.requires || s.inventory[c.requires])
    .map(({ c, i }) => ({ value: c, label: ev.choices[i].label, hint: ev.choices[i].hint }))
  const d = earthMarsDistance(new Date())
  return (
    <motion.div
      className="decision"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)', transition: { duration: 0.7, ease: 'easeInOut' } }}
      exit={{ clipPath: 'circle(0% at 50% 45%)', transition: { duration: 0.6, ease: 'easeInOut' } }}
    >
      <motion.img className="decision-bg" src={ch.interior} alt="" initial={{ scale: 1.12 }} animate={{ scale: 1.02, transition: { duration: 8, ease: 'easeOut' } }} />
      <div className="decision-shade dark" />
      <motion.div className="decision-terminal" initial={{ y: 80, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1, transition: { delay: 0.5, type: 'spring', damping: 18 } }}>
        <Terminal
          key={raw.id + s.sol}
          header={`${T('term.alert', { n: s.sol })} · ${ev.emoji}`}
          title={ev.title.toUpperCase()}
          text={`${T('term.ask', { name: s.player.name.toUpperCase() })} ${ev.text}`}
          extra={ev.delayFact ? <div className="crt-extra">{T('term.delay', { km: Math.round(d.km / 1e6), min: Math.round(d.minutes) })}</div> : null}
          options={options}
          onConfirm={choose}
        />
      </motion.div>
    </motion.div>
  )
}

// ---------- 3) Paneo por la base: la consecuencia ----------
function Outcome({ s }) {
  const T = useT()
  const raw = s.cards[0].event
  const ev = locEvent(s.lang, raw)
  const r = s.cardResult
  const { nextCard } = useGame.getState()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const tm = setTimeout(() => setReady(true), 2200)
    return () => clearTimeout(tm)
  }, [])
  return (
    <motion.div className={'panel card outcome ' + (r.good ? 'good' : 'bad')} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.8 } }} exit={{ opacity: 0 }}>
      <div className="kicker">{r.good ? T('out.good') : T('out.bad')}</div>
      <h2 className="outcome-text">{outcomeText(s.lang, raw, r)}</h2>
      {ev.fact && <div className="fact">💡 {ev.fact}</div>}
      <button className="btn primary" disabled={!ready} onClick={nextCard}>{ready ? T('continue') : '🎥 …'}</button>
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
          <button key={i} className={'chip' + (on ? ' on' : '')} style={on ? { background: color, boxShadow: `0 0 12px ${color}` } : null}
            disabled={dis} onClick={() => onSet(on && i === value - 1 ? i : i + 1)} aria-label={`${i + 1} ⚡`}>⚡</button>
        )
      })}
    </div>
  )
}

function Planner({ s }) {
  const T = useT()
  const { setAlloc, endSol } = useGame.getState()
  const avail = chipsAvailable(s)
  const p = project(s)
  const free = avail - p.used
  const storm = s.plan[s.sol - 1]
  const effects = {
    life: <><Delta v={p.dO2} /> 🫁 {p.leakLoss ? <em className="warn">💨−{p.leakLoss}</em> : null}{p.mine ? <em className="good-tag">⛏️+{p.mine}</em> : null}</>,
    greenhouse: s.inventory.seeds ? <><Delta v={p.dFood} /> 🥔</> : <em className="warn">{T('plan.noSeeds')}</em>,
    shield: <>🛡️ <b>{Math.round(shieldFraction(s, s.alloc.shield) * 100)}%</b> {storm?.level ? <em className="warn">{T('plan.storm')}</em> : null}</>,
    science: s.today.blockScience ? <em className="warn">😴</em> : <><Delta v={p.dSci} /> 🔬</>,
  }
  const repairs = []
  if (s.base.leak) repairs.push({ key: 'fixLeak', ...locRepair(s.lang, 'leak'), on: s.alloc.fixLeak, why: T('plan.leakWhy', { n: LEAK_O2 }) })
  if (s.base.brokenPanels > 0) repairs.push({ key: 'fixPanel', ...locRepair(s.lang, 'panel'), on: s.alloc.fixPanel, why: T('plan.panelWhy') })
  const notes = []
  if (s.dust.sols > 0) notes.push(T('plan.dust', { pct: Math.round((1 - s.dust.level) * 100), n: s.dust.sols }))
  if (s.today.chipsPenalty) notes.push(T('plan.penalty', { n: s.today.chipsPenalty }))
  if (s.battery) notes.push(T('plan.battery', { n: s.battery }))

  return (
    <motion.div className="panel planner" {...fade}>
      <div className="planner-head">
        <div>
          <div className="kicker">{T('plan.kicker', { n: s.sol })}</div>
          <h2>{T('plan.q')}</h2>
        </div>
        <div className="energy-pool">
          {Array.from({ length: avail }).map((_, i) => <span key={i} className={'pool-chip' + (i < p.used ? ' used' : '')}>⚡</span>)}
          {avail === 0 && <span className="muted">{T('plan.none')}</span>}
          <small>{free === 1 ? T('plan.free1') : T('plan.free', { n: free })}</small>
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
        {SYSTEMS.map((sys) => {
          const ls = locSystem(s.lang, sys)
          return (
            <div key={sys.id} className="sys-row" title={ls.help}>
              <div className="sys-name">
                <span className="sys-emoji">{sys.emoji}</span>
                <div>
                  <b>{ls.name}</b>
                  <div className="sys-effect">{effects[sys.id]}</div>
                </div>
              </div>
              <Chips value={s.alloc[sys.id]} max={BASE.maxChipsPerSystem} color={sys.color} onSet={(v) => setAlloc(sys.id, v)} disabledFrom={s.alloc[sys.id] + free} />
            </div>
          )
        })}
      </div>

      <div className="planner-foot">
        <div className="muted small">
          {free > 0 ? (p.wasted > 0 ? T('plan.wasted', { n: p.wasted }) : T('plan.saved', { n: p.saved })) : '✓'}
          {' '}· ☢️ <b>{p.dose.toFixed(1)} mSv</b>
        </div>
        <motion.button className="btn primary" onClick={endSol} whileTap={{ scale: 0.97 }}>{T('plan.end', { n: s.sol })}</motion.button>
      </div>
    </motion.div>
  )
}

// ---------- Reporte de la noche en la consola ----------
function Report({ s, onData }) {
  const T = useT()
  const r = s.report
  const { nextSol } = useGame.getState()
  const dead = s.health <= 0
  const last = s.sol >= SOLS
  const head = dead ? T('rep.danger') : r.storm?.level ? (r.blocked >= 0.6 ? T('rep.shieldOk') : T('rep.stormPassed')) : T('rep.sleep')
  const todays = s.decisions.filter((d) => d.sol === s.sol)
  const okLabel = dead ? T('rep.see') : last ? T('rep.finish') : T('rep.next', { n: s.sol + 1 })
  return (
    <motion.div className="console-overlay" initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.6, type: 'spring', damping: 18 } }} exit={{ opacity: 0, y: 40 }}>
      <Console
        onOk={nextSol}
        okLabel={okLabel}
        onPhone={onData}
        phoneLabel={T('rep.call')}
        alarm={dead || s.o2 < 25 || s.health < 40}
        mini={<div className="mini-sol"><span>🌙</span><b>{s.sol}</b></div>}
      >
        <div className="amber-head">{T('rep.night', { n: s.sol })}</div>
        <div className={'amber-title' + (dead ? ' alert' : '')}>{head}</div>
        <div className="amber-grid">
          <div><span>🫁</span><Delta v={s.o2 - r.o2Before} /><small>{Math.round(s.o2)}</small></div>
          <div><span>🥔</span><Delta v={s.food - r.foodBefore} /><small>{Math.round(s.food)}</small></div>
          <div><span>❤️</span><Delta v={s.health - r.healthBefore} /><small>{Math.round(s.health)}</small></div>
          <div><span>☢️</span><Delta v={r.dose} unit=" mSv" /><small>{s.dose.toFixed(1)}</small></div>
          <div><span>🔬</span><Delta v={r.dSci} /><small>{s.science}/{BASE.scienceGoal}</small></div>
          <div><span>🔋</span><b>{r.saved} ⚡</b></div>
        </div>
        <div className="amber-notes">
          {r.storm?.level > 0 && <div>{T('rep.blocked', { pct: Math.round(r.blocked * 100) })}</div>}
          {todays.map((d, i) => (
            <div key={i} className={d.good ? 'ok' : 'ko'}>{d.ev.emoji} {outcomeText(s.lang, d.ev, d)}</div>
          ))}
          {r.notes.map(([k, v], i) => <div key={'n' + i}>{t(s.lang, k, v)}</div>)}
        </div>
      </Console>
    </motion.div>
  )
}
