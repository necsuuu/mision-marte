import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame, cargoMass, MAX_CARRY, capacityFor, loadSecondsFor } from '../game/store'
import { ITEMS } from '../game/content'
import { getCharacter } from '../game/characters'
import { SECTORS, slotById, FURN } from '../game/shipLayout'
import { locItem } from '../i18n/core'
import { useT } from '../i18n/useT'
import { fade } from './common'

const byId = (id) => ITEMS.find((i) => i.id === id)

// Mini mapa: los 3 módulos, dónde está el comandante y cuántos objetos quedan en cada uno
function MiniMap() {
  const T = useT()
  const x = useGame((s) => s.roomPlayerX)
  const roomItems = useGame((s) => s.roomItems)
  const layout = useGame((s) => s.layout)
  const left = (id) => roomItems.filter((r) => r.state === 'shelf' && (() => { const f = FURN[slotById(layout[r.key])?.furn]; return f && f.pos[0] >= SECTORS.find((s) => s.id === id).x0 && f.pos[0] < SECTORS.find((s) => s.id === id).x1 })()).length
  const pct = ((x + 34) / 68) * 100
  return (
    <div className="minimap" aria-label="mapa">
      {SECTORS.map((s) => (
        <div key={s.id} className="mm-sector" style={{ '--c': s.color }}>
          <span>{s.emoji}</span>
          <small>{T('sector.' + s.id)}</small>
          <b>{'•'.repeat(left(s.id)) || '✓'}</b>
        </div>
      ))}
      <motion.div className="mm-dot" animate={{ left: pct + '%' }} transition={{ type: 'tween', duration: 0.25 }} />
    </div>
  )
}

export default function Loading() {
  const { cargo, launch, weatherLoading, goModes, roomItems, carrying, unload, player, lang, easy } = useGame()
  const CAPACITY = capacityFor({ easy })
  const LOAD_SECONDS = loadSecondsFor({ easy })
  const T = useT()
  const [left, setLeft] = useState(LOAD_SECONDS)
  const [started, setStarted] = useState(false)
  const mass = cargoMass(cargo)
  const carriedMass = carrying.reduce((m, k) => m + byId(roomItems.find((r) => r.key === k).id).mass, 0)
  const ch = getCharacter(player.character)

  useEffect(() => {
    useGame.setState({ roomLeft: started ? left : null })
  }, [left, started])

  useEffect(() => {
    if (!started) return
    if (left <= 0) {
      if (!weatherLoading) launch()
      return
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left, started, weatherLoading, launch])

  const loaded = roomItems.filter((r) => r.state === 'loaded')
  const urgent = left <= 10

  return (
    <motion.div className="screen room-screen" {...fade}>
      <AnimatePresence>
        {!started && (
          <motion.div className="room-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.05 }}>
            <div className="panel intro-card">
              <div className="storm-warn">{T('room.storm')}</div>
              <img className="avatar-lg" src={ch.sprite} alt="" />
              <div className="how">
                <div><span>❓</span><small>{T('room.open')}</small></div>
                <div className="arrow">→</div>
                <div><span>✋✋</span><small>{T('room.carry', { n: MAX_CARRY })}</small></div>
                <div className="arrow">→</div>
                <div><span>🏠</span><small>{T('room.toBase')}</small></div>
              </div>
              <div className="how-limits">
                <span>⏱️ {LOAD_SECONDS}s</span>
                <span>⚖️ {T('room.max', { n: CAPACITY })}</span>
                {easy && <span className="cadet-badge">{T('room.cadet')}</span>}
                <span>{T('room.controls')}</span>
              </div>
              <div className="row center-row">
                <button className="btn ghost" onClick={goModes}>←</button>
                <motion.button className="btn primary play-btn" onClick={() => setStarted(true)} whileTap={{ scale: 0.95 }}>{T('room.go')}</motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {started && (
        <>
          <div className="room-top">
            <div className={'timer' + (urgent ? ' urgent' : '')}>
              <span>{String(Math.max(0, left)).padStart(2, '0')}</span>
            </div>
            <div className="mass">
              <div className="mass-head">
                <span>⚖️</span>
                <b>{mass}{carriedMass ? ` (+${carriedMass})` : ''} / {CAPACITY}</b>
              </div>
              <div className="mass-track">
                <motion.div className="mass-fill" animate={{ width: (mass / CAPACITY) * 100 + '%' }} style={{ background: mass >= CAPACITY ? '#ff6b6b' : 'linear-gradient(90deg,#4fd1c5,#ffd166)' }} />
                <motion.div className="mass-carry" animate={{ left: (mass / CAPACITY) * 100 + '%', width: (carriedMass / CAPACITY) * 100 + '%' }} />
              </div>
            </div>
            <motion.button className="btn primary launch" disabled={weatherLoading} onClick={launch} whileTap={{ scale: 0.95 }}>
              {weatherLoading ? '📡…' : T('room.close')}
            </motion.button>
          </div>

          <MiniMap />

          <div className="room-bottom">
            <div className="hands">
              {Array.from({ length: MAX_CARRY }).map((_, i) => {
                const k = carrying[i]
                const it = k && byId(roomItems.find((r) => r.key === k).id)
                return <div key={i} className={'hand' + (it ? ' full' : '')}>{it ? it.emoji : '✋'}</div>
              })}
            </div>
            <div className="tray">
              <span className="tray-label">🏠</span>
              <AnimatePresence>
                {loaded.map((r) => {
                  const it = locItem(lang, byId(r.id))
                  return (
                    <motion.button key={r.key} className="tray-item" onClick={() => unload(r.key)} title={`${it.name} (${T('b.unload')})`}
                      initial={{ scale: 0, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0 }} whileHover={{ y: -4 }}>
                      {it.emoji}
                      <small>{it.mass}</small>
                    </motion.button>
                  )
                })}
              </AnimatePresence>
              {!loaded.length && <span className="tray-empty">· · ·</span>}
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}
