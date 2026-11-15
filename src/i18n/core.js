// Traducciones: helpers puros (sin React) para textos de interfaz y de contenido.
import { UI } from './ui'
import { CONTENT_EN } from './content_en'
import { GLOSSARY, STORM_TEXT, REPAIRS } from '../game/content'
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

export function locEvent(lang, ev) {
  if (!ev || lang !== 'en') return ev
  const o = CONTENT_EN.events[ev.id]
  if (!o) return ev
  return {
    ...pick(ev, { title: o.title, text: o.text, fact: o.fact }),
    choices: ev.choices.map((c, i) => pick(c, o.choices?.[i])),
  }
}

/** Texto del resultado de una elección ya tomada. */
export function outcomeText(lang, ev, result) {
  if (!ev || !result) return ''
  const c = locEvent(lang, ev).choices[result.choiceIdx]
  const out = c.outcome
  return typeof out === 'object' ? (result.ok ? out.success : out.fail) : out
}

export const locale = (lang) => (lang === 'en' ? 'en-US' : 'es-AR')
