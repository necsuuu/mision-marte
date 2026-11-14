import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../game/store'
import { QUIZ, quizScore } from '../game/quiz'
import { useT } from '../i18n/useT'
import { speak } from '../game/voice'

/**
 * Quiz rápido. phase 'pre' = antes de la misión (sin corregir, para no dar las respuestas);
 * phase 'post' = al final (muestra si estuvo bien y por qué).
 */
export default function Quiz({ phase, onDone, onSkip }) {
  const lang = useGame((s) => s.lang)
  const pre = useGame((s) => s.quiz.pre)
  const T = useT()
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState([])
  const [picked, setPicked] = useState(null)
  // orden de las opciones mezclado, fijo por pregunta
  const orders = useMemo(() => QUIZ.map(() => [0, 1, 2].sort(() => Math.random() - 0.5)), [])
  const q = QUIZ[i]?.[lang] || QUIZ[i]?.es
  const done = i >= QUIZ.length

  const pick = (opt) => {
    if (picked !== null) return
    const next = [...answers, opt]
    if (phase === 'pre') {
      setAnswers(next)
      if (i + 1 >= QUIZ.length) onDone(next)
      else setI(i + 1)
      return
    }
    setPicked(opt)
    setAnswers(next)
    speak(opt === 0 ? T('quiz.right') + ' ' + q.why : T('quiz.wrong') + ' ' + q.why)
  }
  const next = () => {
    setPicked(null)
    if (i + 1 >= QUIZ.length) setI(QUIZ.length)
    else setI(i + 1)
  }

  return (
    <motion.div className="screen center quiz-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="quiz-card">
        <div className="kicker">{T(phase === 'pre' ? 'quiz.preKicker' : 'quiz.postKicker')} · {Math.min(i + 1, QUIZ.length)}/{QUIZ.length}</div>
        <AnimatePresence mode="wait">
          {!done ? (
            <motion.div key={i} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
              <h2 className="quiz-q" onClick={() => speak(q.q)}>{q.q}</h2>
              <div className="quiz-opts">
                {orders[i].map((o) => (
                  <button
                    key={o}
                    className={'quiz-opt' + (picked !== null && o === 0 ? ' right' : '') + (picked === o && o !== 0 ? ' wrong' : '')}
                    onClick={() => pick(o)}
                  >
                    {q.a[o]}
                  </button>
                ))}
              </div>
              {picked !== null && (
                <motion.div className="quiz-why" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <b>{picked === 0 ? T('quiz.right') : T('quiz.wrong')}</b> {q.why}
                  <button className="btn primary" onClick={next}>{T('quiz.next')} ▶</button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div key="res" className="quiz-result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <h2>{T('quiz.result', { a: quizScore(pre), b: quizScore(answers), n: QUIZ.length })}</h2>
              <p>{quizScore(answers) > quizScore(pre) ? T('quiz.better') : T('quiz.keep')}</p>
              <button className="btn primary big" onClick={() => onDone(answers)}>{T('quiz.toReport')} ▶</button>
            </motion.div>
          )}
        </AnimatePresence>
        {phase === 'pre' && <button className="link-btn" onClick={onSkip}>{T('quiz.skip')}</button>}
      </div>
    </motion.div>
  )
}
