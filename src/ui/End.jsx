import { useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { BASE, SOLS, ICE_MINE_O2, LEAK_O2 } from '../game/content'
import { fmtDate } from '../data/donki'
import { t, locEvent, locStorm, outcomeText } from '../i18n/core'
import { useT } from '../i18n/useT'
import Console from './Console'
import Quiz from './Quiz'
import { QUIZ, quizScore, SKILLS } from '../game/quiz'

export default function End({ onData }) {
  const s = useGame()
  const T = useT()
  const [tab, setTab] = useState('summary')
  const win = s.outcome === 'win'
  const stars = win ? 1 + (s.science >= BASE.scienceGoal ? 1 : 0) + (s.dose <= BASE.doseLimit * 0.6 ? 1 : 0) : 0
  const storms = s.log.filter((l) => l.storm?.level > 0)
  const good = s.decisions.filter((d) => d.good).length
  const bad = s.decisions.length - good
  const facts = s.learned.filter((f) => f !== 'storm').map((f) => {
    // traducir el dato si el evento tiene versión en inglés
    const d = s.decisions.find((x) => x.ev.fact === f)
    return d ? locEvent(s.lang, d.ev).fact : f
  })
  const b = s.base
  // Al terminar: 4 preguntas para repasar (se puede saltear)
  if (!s.quiz.post) return <Quiz onDone={s.finishQuizPost} onSkip={() => s.finishQuizPost([])} />

  return (
    <motion.div className="screen center end-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="console-overlay end-console" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.3, type: 'spring', damping: 18 } }}>
        <Console
          onOk={s.goModes}
          okLabel={T('end.again')}
          onPhone={onData}
          phoneLabel={T('rep.call')}
          alarm={!win}
          mini={<div className="mini-stars">{[0, 1, 2].map((i) => <span key={i} className={i < stars ? 'on' : ''}>★</span>)}</div>}
        >
          <div className="amber-head">{win ? T('end.kickerWin') : T('end.kickerLose', { n: s.sol })}</div>
          <div className={'amber-title' + (win ? '' : ' alert')}>
            {win ? T('end.win', { name: s.player.name }) : '🚨 ' + T('lose.' + s.loseReason)}
          </div>
          <div className="amber-tabs">
            {['summary', 'log', 'learned'].map((k) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{T('end.tab.' + k)}</button>
            ))}
          </div>

          <div className="amber-scroll">
            {tab === 'summary' && (
              <>
                {!win && <p className="amber-p">{T('lose.' + s.loseReason + '.d')}</p>}
                <div className="amber-stats">
                  <div><b>{Math.min(s.sol, SOLS)}</b><span>{T('end.sols')}</span></div>
                  <div><b>{storms.length}</b><span>{T('end.storms')}</span></div>
                  <div><b>{s.dose.toFixed(1)}</b><span>{T('end.dose')}</span></div>
                  <div><b>{s.science}</b><span>{T('end.science')}</span></div>
                  <div className="ok"><b>{good}</b><span>{T('end.good')}</span></div>
                  <div className="ko"><b>{bad}</b><span>{T('end.bad')}</span></div>
                </div>
                {s.quiz.post?.length > 0 && (
                  <div className="amber-quiz">🧠 {T('end.quiz', { b: quizScore(s.quiz.post), n: QUIZ.length })}</div>
                )}
                <div className="amber-sub">{T('end.base')}</div>
                <div className="amber-base">
                  {b.iceMine && <span className="ok">⛏️🧊 +{ICE_MINE_O2} 🫁/sol</span>}
                  {b.samples > 0 && <span className="ok">🪨 ×{b.samples}</span>}
                  {b.patches > 0 && <span>🩹 ×{b.patches}</span>}
                  {b.leak && <span className="ko">💨 −{LEAK_O2} 🫁/sol</span>}
                  {b.brokenPanels > 0 && <span className="ko">💥 ×{b.brokenPanels}</span>}
                  {!b.iceMine && !b.samples && !b.patches && !b.leak && !b.brokenPanels && <span>{T('end.baseNone')}</span>}
                </div>
                {win && <p className="amber-small">{T('end.stars', { sci: BASE.scienceGoal, dose: BASE.doseLimit * 0.6 })}</p>}
              </>
            )}

            {tab === 'log' && (
              <div className="logbook">
                {Array.from({ length: Math.min(s.sol, SOLS) }).map((_, i) => {
                  const sol = i + 1
                  const l = s.log.find((x) => x.sol === sol)
                  const decs = s.decisions.filter((d) => d.sol === sol)
                  const lines = []
                  if (l?.storm?.level > 0) {
                    const st = locStorm(s.lang, l.storm.level)
                    lines.push({ txt: t(s.lang, 'log.storm', { emoji: st.emoji, title: st.title, speed: l.storm.speed, date: fmtDate(l.storm.date, s.lang), pct: Math.round(l.blocked * 100) }), cls: l.blocked >= 0.6 ? 'ok' : 'ko' })
                  }
                  decs.forEach((d) => {
                    const ev = locEvent(s.lang, d.ev)
                    lines.push({ txt: `${ev.emoji} ${ev.title} → «${ev.choices[d.choiceIdx].label}» → ${outcomeText(s.lang, d.ev, d)}`, cls: d.good ? 'ok' : 'ko' })
                  })
                  if (l?.fixedLeak) lines.push({ txt: t(s.lang, 'log.fixedLeak'), cls: 'ok' })
                  if (l?.fixedPanel) lines.push({ txt: t(s.lang, 'log.fixedPanel'), cls: 'ok' })
                  if (!lines.length) lines.push({ txt: t(s.lang, 'log.calm'), cls: '' })
                  return (
                    <div key={sol} className="log-sol">
                      <b>SOL {sol}</b>
                      <div>{lines.map((ln, j) => <div key={j} className={ln.cls}>{ln.txt}</div>)}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {tab === 'learned' && (
              <>
              <div className="amber-sub">{T('end.skills')}</div>
              <ul className="amber-skills">
                {(SKILLS[s.lang] || SKILLS.es).map(([e, name, d]) => <li key={name}><span>{e}</span><b>{name}</b><small>{d}</small></li>)}
              </ul>
              <div className="amber-sub">{T('end.facts')}</div>
              <ul className="amber-list">
                <li>{T('learn.1')}</li>
                {storms.length > 0 && <li>{T('learn.2')}</li>}
                <li>{T('learn.3')}</li>
                {facts.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              </>
            )}
          </div>
        </Console>
      </motion.div>
    </motion.div>
  )
}
