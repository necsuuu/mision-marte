import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame, cargoMass, MAX_CARRY, capacityFor } from '../game/store'
import { ITEMS, ITEM_USE } from '../game/content'
import { getCharacter } from '../game/characters'
import { locItem } from '../i18n/core'
import { useT } from '../i18n/useT'

const byId = (id) => ITEMS.find((i) => i.id === id)
const USE_ICON = { energy: '⚡', air: '🫁', food: '🍽️', shield: '🛡️', repair: '🔧', health: '❤️', science: '🔬' }

/**
 * Ficha del objeto: el comandante "cuenta" qué es lo que estás mirando (con el mouse o al acercarte con el teclado):
 * para qué sirve, cuánto pesa, si entra en la cápsula y cómo agarrarlo. Al agarrarlo festeja.
 */
export default function ItemCard() {
  const T = useT()
  const lang = useGame((s) => s.lang)
  const player = useGame((s) => s.player)
  const inspect = useGame((s) => s.roomInspect)
  const focus = useGame((s) => s.roomFocus)
  const roomItems = useGame((s) => s.roomItems)
  const carrying = useGame((s) => s.carrying)
  const cargo = useGame((s) => s.cargo)
  const easy = useGame((s) => s.easy)
  const msg = useGame((s) => s.roomMsg)
  const ch = getCharacter(player.character)

  // festejo al agarrar algo
  const [cheer, setCheer] = useState(null)
  useEffect(() => {
    if (msg?.type !== 'picked') return
    setCheer(msg.id)
    const tm = setTimeout(() => setCheer(null), 1600)
    return () => clearTimeout(tm)
  }, [msg])

  const key = inspect || (focus?.startsWith('pick:') ? focus.slice(5) : null)
  const entry = key && roomItems.find((r) => r.key === key && r.state === 'shelf')
  const shownId = cheer || entry?.id
  if (!shownId) return null

  const item = locItem(lang, byId(shownId))
  const use = ITEM_USE[shownId]
  const cap = capacityFor({ easy })
  const carriedMass = carrying.reduce((m, k) => m + byId(roomItems.find((r) => r.key === k).id).mass, 0)
  const free = cap - cargoMass(cargo) - carriedMass
  const fits = item.mass <= free
  const handsFull = carrying.length >= MAX_CARRY
  const status = cheer ? 'got' : handsFull ? 'hands' : !fits ? 'heavy' : focus === 'pick:' + key ? 'pressE' : 'click'

  return (
    <AnimatePresence>
      <motion.div
        key={shownId + (cheer ? '-cheer' : '')}
        className={'item-card' + (cheer ? ' cheer' : '')}
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      >
        <motion.div className="ic-commander" animate={cheer ? { y: [0, -14, 0], rotate: [0, -6, 0] } : { y: 0 }} transition={{ duration: 0.45 }}>
          <img src={ch.portrait} alt="" draggable={false} />
          <span>⭐ {player.name || T('room.cmd')}</span>
        </motion.div>
        <div className="ic-bubble">
          <div className="ic-head">
            <motion.div className="ic-icon" animate={cheer ? { scale: [1, 1.35, 1], rotate: [0, 12, 0] } : {}} transition={{ duration: 0.5 }}>
              {item.emoji}
            </motion.div>
            <div>
              <b className="ic-name">{item.name}</b>
              <span className={'ic-use use-' + use}>{USE_ICON[use]} {T('use.' + use)}</span>
            </div>
          </div>
          {cheer ? (
            <p className="ic-say">{T('ic.got', { item: item.name })}</p>
          ) : (
            <>
              <p className="ic-desc">{item.desc}</p>
              {item.fact && <p className="ic-fact">💡 {item.fact}</p>}
              <div className="ic-weight">
                <span>⚖️ {T('ic.weight', { n: item.mass })}</span>
                <span className="ic-blocks" aria-hidden>
                  {Array.from({ length: item.mass }).map((_, i) => <i key={i} className={fits ? '' : 'over'} />)}
                </span>
                <small>{T('ic.free', { n: Math.max(0, free) })}</small>
              </div>
            </>
          )}
          {!cheer && <div className={'ic-status st-' + status}>{T('ic.' + status)}</div>}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
