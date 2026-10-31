import { getLegalActions, isDamaging, kindOf, previewDamage, previewHeal } from '../engine'
import type { Card, GameAction, GameState } from '../engine'

/** Igual que los botones del tablero: play = empuñar, tomar o enfrentar. */
export type MoveMode = 'play' | 'weapon' | 'hand' | 'flee' | 'recall'

export interface MoveInfo {
  readonly action: GameAction
  readonly mode: MoveMode
  readonly card: Card | null
  /** Daño que recibirías con esta jugada (0 si no aplica). */
  readonly damage: number
  /** Vida que recuperarías. */
  readonly heal: number
  readonly healthAfter: number
  /** true si el daño te dejaría en 0 o menos. */
  readonly lethal: boolean
}

/**
 * Las jugadas legales del estado, cada una con su vista previa y sin repetidos. Usa el mismo
 * motor que la interfaz, así que lo que aquí se ve es lo que realmente pasaría.
 */
export function describeMoves(state: GameState): MoveInfo[] {
  const actions = getLegalActions(state).filter((action) => {
    // El motor acepta "con arma" en cualquier carta, pero solo cambia algo contra monstruos.
    // Quitamos esa variante en remedios, armas y maldiciones para no repetir jugadas idénticas.
    if (action.type !== 'PLAY_CARD' || !action.useWeapon) return true
    const card = state.zone.find((candidate) => candidate.id === action.cardId)
    return card !== undefined && isDamaging(card)
  })

  return actions.map((action): MoveInfo => {
    if (action.type !== 'PLAY_CARD') {
      const mode = action.type === 'FLEE' ? 'flee' : 'recall'
      return { action, mode, card: null, damage: 0, heal: 0, healthAfter: state.health, lethal: false }
    }
    const card = state.zone.find((candidate) => candidate.id === action.cardId) as Card
    const damaging = isDamaging(card)
    const damage = damaging ? previewDamage(state, card, action.useWeapon) : 0
    const heal = kindOf(card) === 'potion' ? previewHeal(state, card) : 0
    const mode: MoveMode = damaging ? (action.useWeapon ? 'weapon' : 'hand') : 'play'
    return {
      action,
      mode,
      card,
      damage,
      heal,
      healthAfter: Math.max(0, state.health - damage) + heal,
      lethal: damaging && damage >= state.health,
    }
  })
}
