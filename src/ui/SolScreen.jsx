import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/store'
import { BASE, SOLS, LEAK_O2, ICE_MINE_O2 } from '../game/content'
import { fmtDate } from '../data/donki'
import { getCharacter } from '../game/characters'
import { locEvent, outcomeText, noteText } from '../i18n/core'
import { useT } from '../i18n/useT'
import { Bar, Delta, Term, fade } from './common'
import DayTerminal from './DayTerminal'
import TaskUI from './TaskUI'
import Console from './Console'
import { useSpeak } from '../game/voice'

const DAWN_MS = 2300
const INCIDENT_MS = 3300

export default function SolScreen({ onData }) {
  const s = useGame()
  const card = s.cards[0]
  return (
    <motion.div className={'screen sol-screen phase-' + s.phase} {...fade}>
      <Hud s={s} onData={onData} />
      <div className="sol-main">
        <AnimatePresence mode="wait">
          {s.phase === 'dawn' && <Dawn key={'d' + s.sol} s={s} />}
          {s.phase === 'incident' && card && <Incident key={'i' + s.sol} s={s} />}
          {s.phase === 'outcome' && card && <Outcome key={'o' + s.sol} s={s} />}
        </AnimatePresence>
      </div>
      {s.phase === 'task' && <TaskUI />}
      <AnimatePresence>
        {((s.phase === 'event' && card) || (s.phase === 'decision' && card) || s.phase === 'plan') && <DayTerminal key={'term' + s.sol} s={s} />}
      </AnimatePresence>
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
  const paused = useGame((st) => st.paused)
  useEffect(() => {
    if (paused) return
    const tm = setTimeout(afterDawn, DAWN_MS)
    return () => clearTimeout(tm)
  }, [afterDawn, paused])
  return (
    <motion.div className="dawn-card" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} transition={{ duration: 0.5 }}>
      <span>🌅</span>
      <b>SOL {s.sol}</b>
      {s.base.leak && <small>{T('dawn.leak')}</small>}
    </motion.div>
  )
}

// ---------- 1) El problema se ve en la base ----------
function Incident({ s }) {
  const ev = locEvent(s.lang, s.cards[0].event)
  const toDecision = useGame((st) => st.toDecision)
  const paused = useGame((st) => st.paused)
  useEffect(() => {
    if (paused) return
    const tm = setTimeout(toDecision, INCIDENT_MS)
    return () => clearTimeout(tm)
  }, [toDecision, paused])
  return (
    <motion.div className={'incident-caption' + (ev.good ? ' good' : '')} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      {!ev.good && <span className="pulse-dot" />} {ev.emoji} {ev.title}
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
  const fact = ev.choices[r.choiceIdx]?.fact || ev.fact
  useSpeak(outcomeText(s.lang, raw, r) + '. ' + (r.taskLine ? noteText(s.lang, r.taskLine[0], r.taskLine[1]) + '. ' : '') + (fact || ''))
  useEffect(() => {
    const tm = setTimeout(() => setReady(true), 2200)
    return () => clearTimeout(tm)
  }, [])
  return (
    <motion.div className={'panel card outcome ' + (r.good ? 'good' : 'bad')} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.8 } }} exit={{ opacity: 0 }}>
      <div className="kicker">{r.good ? T('out.good') : T('out.bad')}</div>
      <h2 className="outcome-text">{outcomeText(s.lang, raw, r)}</h2>
      {r.taskLine && <div className="task-line">{noteText(s.lang, r.taskLine[0], r.taskLine[1])}</div>}
      {fact && <div className="fact">💡 {fact}</div>}
      <button className="btn primary" disabled={!ready} onClick={nextCard}>{ready ? T('continue') : '🎥 …'}</button>
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
          {r.notes.map(([k, v], i) => <div key={'n' + i} className={k === 'n.built' || k === 'n.missionOk' ? 'ok' : ''}>{noteText(s.lang, k, v)}</div>)}
        </div>
      </Console>
    </motion.div>
  )
}
