import { useCallback } from 'react'
import { useGame } from '../game/store'
import { t } from './core'

export const useLang = () => useGame((s) => s.lang)

/** Hook para textos de interfaz: const T = useT(); T('play') */
export function useT() {
  const lang = useLang()
  return useCallback((key, vars) => t(lang, key, vars), [lang])
}
