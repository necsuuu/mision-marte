// Todo el día pasa por la computadora de la nave:
//  · informe del día (bienvenida, tormenta solar real, estado de la base)
//  · decisiones de los eventos
//  · plan de energía
// En el papel de la derecha se imprime cómo quedarían los recursos con cada decisión.
import { useEffect, useMemo, useState } from 'react'
import { useSpeak } from '../game/voice'
import { motion, useIsPresent } from 'framer-motion'
import { view } from '../game/clocks'
import { useGame, forecast, forecastChoice, chipsAvailable, shieldFraction, project, recommendChoice } from '../game/store'
import { BASE, SYSTEMS, ITEMS, LEAK_O2, ICE_MINE_O2 } from '../game/content'
import { fmtDate } from '../data/donki'
import { earthMarsDistance } from '../data/marsDistance'
import { getCharacter } from '../game/characters'
import { t, locEvent, locSystem, locStorm, locRepair } from '../i18n/core'
import { useT } from '../i18n/useT'
import { Term, Tx } from './common'
import TerminalFrame from './Terminal'

// ---------- Papel: filas "antes → después" ----------
function Row({ emoji, from, to, unit = '', invert = false, dec = 0 }) {
  const d = to - from
  const good = invert ? d < 0 : d > 0
  const cls = Math.abs(d) < 0.05 ? 'same' : good ? 'up' : 'down'
  const f = (v) => (dec ? v.toFixed(dec) : Math.round(v))
  return (
    <div className={'p-row ' + cls}>
      <span>{emoji}</span>
      <span>{f(from)}</span>
      <span className="arrow">→</span>
      <b>{f(to)}{unit}</b>
    </div>
  )
}

function Rows({ s, after, onlyChanged = false }) {
  const rows = [
    ['🫁', s.o2, after.o2], ['🥔', s.food, after.food], ['❤️', s.health, after.health],
    ['☢️', s.dose, after.dose, true, 1], ['🔬', s.science, after.science],
  ].filter(([, a, b]) => !onlyChanged || Math.abs(a - b) > 0.05)
  return rows.map(([e, a, b, inv, dec]) => <Row key={e} emoji={e} from={a} to={b} invert={inv} dec={dec} />)
}

function Tags({ f, lang }) {
  const tags = []
  if (f.chips) tags.push(['ko', t(lang, 'tag.chips', { n: f.chips })])
  if (f.leak) tags.push(['ko', t(lang, 'tag.leak', { n: LEAK_O2 })])
  if (f.panel) tags.push(['ko', t(lang, 'tag.panel')])
  if (f.dust) tags.push([f.dust.level > 0.3 ? 'ko' : '', t(lang, 'tag.dust', { pct: Math.round((1 - f.dust.level) * 100), n: f.dust.sols })])
  if (f.noSci) tags.push(['ko', t(lang, 'tag.noSci')])
  if (f.mine) tags.push(['ok', t(lang, 'tag.mine', { n: ICE_MINE_O2 })])
  if (f.sample) tags.push(['ok', t(lang, 'tag.sample')])
  if (f.item) tags.push(['', t(lang, 'tag.item', { emoji: ITEMS.find((i) => i.id === f.item)?.emoji })])
  return tags.map(([c, txt], i) => <div key={i} className={'p-tag ' + c}>{txt}</div>)
}

// ---------- 1) Informe del día ----------
function Briefing({ s, card }) {
  const T = useT()
  const ch = getCharacter(s.player.character)
  const st = card.storm
  const lang = s.lang
  useSpeak([
    T('brief.header', { n: s.sol }),
    card.intro ? T('brief.intro') : '',
    st ? locStorm(lang, st.level).title : T('brief.calm'),
    card.warn ? T('warn.big', { n: card.warn.in, speed: card.warn.speed }) : '',
  ].join('. '))
  return (
    <>
      <div className="crt-header"><span className="blink">■</span> {T('brief.header', { n: s.sol })}</div>
      {card.intro && (
        <>
          <div className="crt-title">{T(ch.female ? 'intro.welcomeF' : 'intro.welcomeM', { name: s.player.name }).toUpperCase()}</div>
          <p className="crt-text">{T('brief.intro')}</p>
          <div className="crt-systems">
            {SYSTEMS.map((x) => {
              const ls = locSystem(lang, x)
              return <div key={x.id} title={ls.help}><span>{x.emoji}</span><b>{ls.name}</b><small>{ls.help}</small></div>
            })}
          </div>
          {s.easy && <div className="crt-extra">{T('intro.cadet')}</div>}
        </>
      )}
      {st ? (
        <div className={'crt-storm lvl' + st.level}>
          <div className="crt-storm-title">{locStorm(lang, st.level).emoji} {locStorm(lang, st.level).title.toUpperCase()}</div>
          <p className="crt-text">
            <Tx k="storm.launched" vars={{ date: fmtDate(st.date, lang) }} /> <Term k="cme">{T('storm.cme')}</Term> {T('storm.at')} <b>{st.speed.toLocaleString(lang === 'en' ? 'en-US' : 'es-AR')} km/s</b>
            {st.sep ? <> {T('storm.sep')} <Term k="sep">{T('storm.sepWord')}</Term></> : null}.
          </p>
          {st.rad ? <Tx as="p" className="crt-text" k="storm.rad" /> : st.arrival && <Tx as="p" className="crt-text" k="storm.arrival" vars={{ date: fmtDate(st.arrival.slice(0, 10), lang) }} />}
          <div className="crt-real">{T('storm.real')} · <Term k="donki">DONKI</Term></div>
          {st.big && <Tx as="div" className="crt-extra" k="storm.big" />}
          {st.drill && <Tx as="div" className="crt-extra" k="storm.drill" />}
          {st.date?.startsWith('2024-05-20') && <Tx as="div" className="crt-extra" k="storm.may20" />}
          {st.level < 3 && <Tx as="div" className="crt-note" k="storm.exag" />}
          <Tx as="div" className="crt-tip" k="storm.tip" />
        </div>
      ) : (
        <>
          <p className="crt-text calm">{T('brief.calm')}</p>
          {card.miss && <Tx as="p" className="crt-text" k="brief.miss" vars={{ speed: card.miss.speed.toLocaleString(lang === 'en' ? 'en-US' : 'es-AR') }} />}
        </>
      )}
      {card.warn && (
        <div className="crt-warn">
          <Tx k="warn.big" vars={{ n: card.warn.in, speed: card.warn.speed.toLocaleString(lang === 'en' ? 'en-US' : 'es-AR') }} />
          {card.warn.drill && <small> {T('warn.drill')}</small>}
        </div>
      )}
      {(s.base.leak || s.base.brokenPanels > 0 || s.base.iceMine) && (
        <div className="crt-base">
          {s.base.leak && <span className="ko">💨 {T('tag.leak', { n: LEAK_O2 })}</span>}
          {s.base.brokenPanels > 0 && <span className="ko">💥 {T('tag.panel')}</span>}
          {s.base.iceMine && <span className="ok">{T('tag.mine', { n: ICE_MINE_O2 })}</span>}
        </div>
      )}
    </>
  )
}

function BriefPaper({ s, card }) {
  const T = useT()
  const shieldNeeded = card.storm ? BASE.stormDose[card.storm.level] : 0
  return (
    <>
      <div className="ticket-head">*** {T('paper.status')} ***</div>
      <div className="p-now">
        <div><span>🫁</span><b>{Math.round(s.o2)}</b></div>
        <div><span>🥔</span><b>{Math.round(s.food)}</b></div>
        <div><span>❤️</span><b>{Math.round(s.health)}</b></div>
        <div><span>☢️</span><b>{s.dose.toFixed(1)}</b></div>
        <div><span>🔬</span><b>{s.science}/{BASE.scienceGoal}</b></div>
        <div><span>⚡</span><b>{chipsAvailable(s)}</b></div>
      </div>
      <div className="ticket-sep">- - - - - - - - - -</div>
      <div className="ticket-cost">{T('paper.forecastTitle')}</div>
      <div className="p-tag">{card.storm ? T('paper.stormRisk', { n: shieldNeeded }) : T('paper.calm')}</div>
      {card.warn && <div className="p-tag ko">{T('warn.bigPaper', { n: card.warn.in })}</div>}
    </>
  )
}

// ---------- 2) Decisión de un evento ----------
function Decision({ s, sel, setSel, options }) {
  const T = useT()
  const ev = locEvent(s.lang, s.cards[0].event)
  const d = earthMarsDistance(new Date())
  // ⭐ Pista: solo para cadetes (9 años o menos); los más grandes deciden solos
  const hint = s.easy
  const best = useMemo(() => recommendChoice(s, options.map((o) => o.value)), [s, options])
  useSpeak(ev.title + '. ' + ev.text + '. ' + options.map((o, i) => `${i + 1}: ${o.label}`).join('. '))
  return (
    <>
      <div className="crt-header"><span className="blink">■</span> {T(ev.special ? 'term.mid' : 'term.alert', { n: s.sol })} · {ev.emoji}</div>
      <TypeTitle text={ev.title.toUpperCase()} />
      <p className="crt-text">{T('term.ask', { name: s.player.name.toUpperCase() })} {ev.text}</p>
      {ev.delayFact && <div className="crt-extra">{T('term.delay', { km: Math.round(d.km / 1e6), min: Math.round(d.minutes) })}</div>}
      <div className="crt-options">
        {options.map((o, i) => (
          <button key={i} className={'crt-opt' + (sel === i ? ' on' : '') + (hint && best === i ? ' hint' : '')} onClick={() => setSel(i)}>
            <span className="crt-num">{sel === i ? '▶' : i + 1}</span>
            <span>{o.label}</span>
            {hint && best === i && <span className="crt-star">⭐ {T('hint.crew')}</span>}
          </button>
        ))}
      </div>
      <div className="crt-foot">
        <span>{T('term.keys')}</span>
      </div>
    </>
  )
}

function ChoicePaper({ s, option }) {
  const T = useT()
  if (!option) return <div className="paper-wait">{T('term.pick')}</div>
  const f = forecastChoice(s, option.value)
  return (
    <>
      <div className="ticket-head">*** {option.label.toUpperCase()} ***</div>
      <div className="ticket-cost">{T('paper.ifChoose')}</div>
      {f.chance !== undefined ? (
        <>
          <div className="p-tag">{T('tag.chance', { pct: Math.round(f.chance * 100) })}</div>
          <div className="p-sub ok">{T('tag.ok')}</div>
          <Rows s={s} after={f.success} onlyChanged />
          <Tags f={f.success} lang={s.lang} />
          <div className="p-sub ko">{T('tag.ko')}</div>
          <Rows s={s} after={f.fail} onlyChanged />
          <Tags f={f.fail} lang={s.lang} />
        </>
      ) : (
        <>
          <Rows s={s} after={f} />
          <Tags f={f} lang={s.lang} />
        </>
      )}
    </>
  )
}

// ---------- 3) Plan de energía ----------
function Chips({ value, max, color, onSet, disabledFrom }) {
  return (
    <div className="crt-chips">
      {Array.from({ length: max }).map((_, i) => {
        const on = i < value
        const dis = !on && i >= disabledFrom
        return (
          <button key={i} className={'crt-chip' + (on ? ' on' : '')} style={on ? { background: color, boxShadow: `0 0 0.8cqw ${color}` } : null}
            disabled={dis} onClick={() => onSet(on && i === value - 1 ? i : i + 1)} aria-label={`${i + 1} ⚡`}>⚡</button>
        )
      })}
    </div>
  )
}

function Plan({ s }) {
  const T = useT()
  const { setAlloc, autoPlan } = useGame.getState()
  useSpeak(s.helpReasons ? T('help.title') + ' ' + s.helpReasons.map(([k, v]) => T(k, v)).join('. ') : T('plan.q'))
  const avail = chipsAvailable(s)
  const p = project(s)
  const free = avail - p.used
  const storm = s.plan[s.sol - 1]
  const repairs = []
  if (s.base.leak) repairs.push({ key: 'fixLeak', ...locRepair(s.lang, 'leak'), on: s.alloc.fixLeak, why: T('plan.leakWhy', { n: LEAK_O2 }) })
  if (s.base.brokenPanels > 0) repairs.push({ key: 'fixPanel', ...locRepair(s.lang, 'panel'), on: s.alloc.fixPanel, why: T('plan.panelWhy') })
  const notes = []
  if (storm?.level) notes.push(T('plan.storm'))
  if (s.dust.sols > 0) notes.push(T('plan.dust', { pct: Math.round((1 - s.dust.level) * 100), n: s.dust.sols }))
  if (s.today.chipsPenalty) notes.push(T('plan.penalty', { n: s.today.chipsPenalty }))
  if (s.battery) notes.push(T('plan.battery', { n: s.battery }))
  return (
    <>
      <div className="crt-header"><span className="blink">■</span> {T('plan.kicker', { n: s.sol }).toUpperCase()}</div>
      <div className="crt-plan-top">
        <div className="crt-title small">{T('plan.q').toUpperCase()}</div>
        <div className="crt-pool">
          {Array.from({ length: avail }).map((_, i) => <span key={i} className={i < p.used ? 'used' : ''}>⚡</span>)}
          <small>{avail === 0 ? T('plan.none') : free === 1 ? T('plan.free1') : T('plan.free', { n: free })}</small>
        </div>
        {s.easy && <button className={'crt-help big' + (!s.helpReasons && p.used === 0 ? ' pulse' : '')} onClick={autoPlan}>🤖 {T('help.btn')}</button>}
      </div>
      {s.helpReasons && (
        <div className="crt-helpbox">
          <b>🤖 {T('help.title')}</b>
          {s.helpReasons.map(([k, v], i) => <span key={i}>{T(k, v)}</span>)}
        </div>
      )}
      {notes.length > 0 && <div className="crt-notes">{notes.map((n, i) => <span key={i}>{n}</span>)}</div>}
      {repairs.length > 0 && (
        <div className="crt-repairs">
          {repairs.map((r) => (
            <button key={r.key} className={'crt-repair' + (r.on ? ' on' : '')} disabled={!r.on && free < r.cost} onClick={() => setAlloc(r.key, !r.on)}>
              <span>{r.emoji}</span><b>{r.label}</b><small>{r.why}</small><em>{'⚡'.repeat(r.cost)}</em>
            </button>
          ))}
        </div>
      )}
      <div className="crt-systems-plan">
        {SYSTEMS.map((sys) => {
          const ls = locSystem(s.lang, sys)
          const extra = sys.id === 'shield' ? `${Math.round(shieldFraction(s, s.alloc.shield) * 100)}%` : sys.id === 'greenhouse' && !s.inventory.seeds ? T('plan.noSeeds') : sys.id === 'science' && s.today.blockScience ? '😴' : ''
          return (
            <div key={sys.id} className="crt-sys" title={ls.help}>
              <span className="crt-sys-emoji">{sys.emoji}</span>
              <b>{ls.name}</b>
              <small>{extra}</small>
              <Chips value={s.alloc[sys.id]} max={BASE.maxChipsPerSystem} color={sys.color} onSet={(v) => setAlloc(sys.id, v)} disabledFrom={s.alloc[sys.id] + free} />
            </div>
          )
        })}
      </div>
    </>
  )
}

function PlanPaper({ s }) {
  const T = useT()
  const f = forecast(s)
  return (
    <>
      <div className="ticket-head">*** {T('paper.endOfSol')} ***</div>
      <Rows s={s} after={f} />
      <div className="p-row same"><span>🔋</span><span /><span className="arrow">→</span><b>{f.battery} ⚡</b></div>
      <div className="ticket-sep">- - - - - - - - - -</div>
      {f.p.storm?.level > 0 && <div className={'p-tag ' + (f.stormHit ? 'ko' : 'ok')}>{f.stormHit ? T('paper.storm', { n: f.stormHit }) : T('paper.stormBlocked')}</div>}
      {f.p.leakLoss > 0 && <div className="p-tag ko">💨 −{f.p.leakLoss} 🫁</div>}
      {f.p.mine > 0 && <div className="p-tag ok">⛏️ +{f.p.mine} 🫁</div>}
      {f.p.wasted > 0 && <div className="p-tag ko">{T('plan.wasted', { n: f.p.wasted })}</div>}
      {f.warn.map((w) => <div key={w} className="p-tag ko big">{T('warn.' + w)}</div>)}
    </>
  )
}

function TypeTitle({ text }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (n >= text.length) return
    const tm = setTimeout(() => setN((k) => k + 1), 25)
    return () => clearTimeout(tm)
  }, [n, text])
  return <div className="crt-title">{text.slice(0, n)}<span className="cursor">█</span></div>
}

// ---------- Contenedor: corte al interior de la nave con la computadora ----------
export default function DayTerminal({ s }) {
  const T = useT()
  const ch = getCharacter(s.player.character)
  const card = s.cards[0]
  const mode = s.phase === 'decision' ? 'decision' : s.phase === 'plan' ? 'plan' : 'briefing'
  const { choose, nextCard, endSol } = useGame.getState()
  const [sel, setSel] = useState(null)
  // Mientras la computadora tapa todo, la escena 3D de atrás no se dibuja; apenas empieza a cerrarse, vuelve.
  const present = useIsPresent()
  useEffect(() => { if (!present) view.covered = false }, [present])
  useEffect(() => () => { view.covered = false }, [])

  const options = useMemo(() => {
    if (mode !== 'decision') return []
    const raw = card.event
    const ev = locEvent(s.lang, raw)
    return raw.choices
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => !c.requires || s.inventory[c.requires])
      .map(({ c, i }) => ({ value: c, label: ev.choices[i].label }))
  }, [mode, card, s.lang, s.inventory])

  useEffect(() => { setSel(null) }, [mode, card])

  // teclado: números/flechas para elegir, Enter para confirmar
  useEffect(() => {
    const onKey = (e) => {
      if (useGame.getState().paused) return
      if (mode === 'decision') {
        const n = parseInt(e.key, 10)
        if (n >= 1 && n <= options.length) setSel(n - 1)
        if (e.key === 'ArrowDown') setSel((v) => (v === null ? 0 : Math.min(options.length - 1, v + 1)))
        if (e.key === 'ArrowUp') setSel((v) => (v === null ? 0 : Math.max(0, v - 1)))
        if (e.key === 'Enter' && sel !== null) choose(options[sel].value)
      } else if (mode === 'briefing' && e.key === 'Enter') nextCard()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, options, sel, choose, nextCard])

  let screen, paper, onOk, okReady = true, okLabel, paperKey
  if (mode === 'briefing') {
    screen = <Briefing s={s} card={card} />
    paper = <BriefPaper s={s} card={card} />
    onOk = nextCard
    okLabel = T('brief.continue')
    paperKey = 'brief' + s.sol
  } else if (mode === 'decision') {
    screen = <Decision s={s} sel={sel} setSel={setSel} options={options} />
    paper = <ChoicePaper s={s} option={sel !== null ? options[sel] : null} />
    onOk = () => sel !== null && choose(options[sel].value)
    okReady = sel !== null
    okLabel = T('term.confirm')
    paperKey = 'dec' + sel
  } else {
    screen = <Plan s={s} />
    paper = <PlanPaper s={s} />
    onOk = endSol
    okLabel = T('plan.end', { n: s.sol })
    paperKey = 'plan' + s.sol
  }

  return (
    <motion.div
      className="decision"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)', transition: { duration: 0.7, ease: 'easeInOut' } }}
      exit={{ clipPath: 'circle(0% at 50% 45%)', transition: { duration: 0.6, ease: 'easeInOut' } }}
      onAnimationComplete={() => { if (present) view.covered = true }}
    >
      <motion.img className="decision-bg" src={ch.interior} alt="" initial={{ scale: 1.12 }} animate={{ scale: 1.02, transition: { duration: 8, ease: 'easeOut' } }} />
      <div className="decision-shade dark" />
      <motion.div className="decision-terminal" initial={{ y: 80, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1, transition: { delay: 0.45, type: 'spring', damping: 18 } }}>
        <TerminalFrame screen={screen} paper={paper} paperKey={paperKey} onOk={onOk} okReady={okReady} okLabel={okLabel} />
      </motion.div>
    </motion.div>
  )
}
