import { kindOf } from './cards'
import { MAX_HEALTH } from './constants'
import { remainingEnemies } from './rules'
import type { GameState } from './types'

/**
 * - Derrota: 0 menos el valor de todos los enemigos que quedaron (negativo).
 * - Victoria: vida restante; si terminaste con 20 de vida y la última carta fue
 *   una poción, 20 más el valor de esa poción.
 * Devuelve null mientras la partida sigue en curso.
 */
export function computeScore(state: GameState): number | null {
  if (state.status === 'playing') return null
  if (state.status === 'lost') {
    return state.health - remainingEnemies(state).reduce((sum, card) => sum + card.rank, 0)
  }
  const last = state.lastResolved
  if (state.health === MAX_HEALTH && last && kindOf(last) === 'potion') {
    return MAX_HEALTH + last.rank
  }
  return state.health
}
