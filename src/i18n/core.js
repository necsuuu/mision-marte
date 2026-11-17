// Traducciones: helpers puros (sin React) para textos de interfaz y de contenido.
import { UI } from './ui'
import { CONTENT_EN } from './content_en'
import { GLOSSARY, STORM_TEXT, REPAIRS, BUILDS, MISSIONS } from '../game/content'
import { isTouch } from '../game/device'

export const LANGS = ['es', 'en']

export function t(lang, key, vars) {
  // En pantallas táctiles, si existe la versión "clave@touch" se usa esa (habla de tocar, no de clic ni teclas)
  const k = isTouch && UI.es[key + '@touch'] !== undefined ? key + '@touch' : key
  let s = UI[lang]?.[k] ?? UI.es[k] ?? key
  if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k])
  return s
}

const pick = (base, over) => (over ? { ...base, ...Object.fromEntries(Object.entries(over).filter(([, v]) => v !== undefined)) } : base)

export const locItem = (lang, it) => (lang === 'en' ? pick(it, CONTENT_EN.items[it.id]) : it)
export const locSystem = (lang, sys) => (lang === 'en' ? pick(sys, CONTENT_EN.systems[sys.id]) : sys)
export const locGlossary = (lang, k) => (lang === 'en' ? CONTENT_EN.glossary[k] : GLOSSARY[k])
export const locStorm = (lang, level) => ({ ...STORM_TEXT[level], ...(lang === 'en' ? CONTENT_EN.storms[level] : {}) })
export const locRepair = (lang, k) => ({ ...REPAIRS[k], ...(lang === 'en' ? CONTENT_EN.repairs[k] : {}) })
export const locBuild = (lang, id) => { const b = BUILDS.find((x) => x.id === id); return b && lang === 'en' ? pick(b, CONTENT_EN.builds[id]) : b }
export const locMission = (lang, id) => { const m = MISSIONS.find((x) => x.id === id); return m && lang === 'en' ? { ...m, text: CONTENT_EN.missions[id] || m.text } : m }

export function locEvent(lang, ev) {
  if (!ev || lang !== 'en') return ev
  const o = CONTENT_EN.events[ev.id]
  if (!o) return ev
  return {
    ...pick(ev, { title: o.title, text: o.text, fact: o.fact, ask: o.ask, talk: o.talk }),
    choices: ev.choices.map((c, i) => pick(c, o.choices?.[i])), // label, hint, outcome y fact de cada opción
  }
}

/** Nota del reporte de la noche: completa el nombre de la obra o el texto de la misión. */
export function noteText(lang, key, vars) {
  const v = { ...vars }
  if (v.build) { const b = locBuild(lang, v.build); if (b) { v.name = `${b.emoji} ${b.name}`; v.gain = b.gain } }
  if (v.mission) v.text = locMission(lang, v.mission)?.text || ''
  return t(lang, key, v)
}

/** Dato aprendido guardado en la partida → texto en el idioma actual. */
export function factText(lang, key, decisions = []) {
  if (key.startsWith('build:')) return locBuild(lang, key.slice(6))?.fact
  if (key.startsWith('exp:')) { const d = decisions.find((x) => x.ev.expedition); return d ? locEvent(lang, d.ev).choices[Number(key.slice(4))]?.fact : null }
  const d = decisions.find((x) => x.ev.fact === key)
  return d ? locEvent(lang, d.ev).fact : key
}

/** Texto del resultado de una elección ya tomada. */
export function outcomeText(lang, ev, result) {
  if (!ev || !result) return ''
  const c = locEvent(lang, ev).choices[result.choiceIdx]
  if (!c) return ''
  const out = c.outcome
  return typeof out === 'object' ? (result.ok ? out.success : out.fail) : out
}

export const locale = (lang) => (lang === 'en' ? 'en-US' : 'es-AR')
