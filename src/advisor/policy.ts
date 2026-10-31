import {
  applyAction,
  getLegalActions,
  hasCurse,
  isDamaging,
  kindOf,
  MAX_MONSTER_RANK,
  previewDamage,
  weaponIssue,
  weaponLimit,
  ZONE_PICKS,
} from '../engine'
import type { Card, GameAction, GameState } from '../engine'
import { describeMoves } from './moves'

/** Una política decide qué jugada hacer. `rng` solo sirve para desempatar. */
export type Policy = (state: GameState, rng: () => number) => GameAction

/** Jugada legal al azar. Es el piso de comparación. */
export const randomPolicy: Policy = (state, rng) => {
  const legal = getLegalActions(state)
  const action = legal[Math.floor(rng() * legal.length)]
  if (!action) throw new Error('No hay jugadas legales')
  return action
}

/* -------------------------------------------------------------------------- */
/*  Política con reglas simples                                               */
/* -------------------------------------------------------------------------- */

/** Parámetros de la política de reglas. Se pueden ajustar con el simulador. */
export interface HeuristicParams {
  /** Cuánto pesa conservar un arma útil frente a la vida. */
  readonly weaponWeight: number
  /** Penalización por gastar un remedio sin aprovechar toda su curación. */
  readonly potionWaste: number
  /** Penalización por enfrentar una maldición (es mejor dejarla como la carta que sobra). */
  readonly cursePenalty: number
  /** Huir si el riesgo de la zona supera esta fracción de la vida (Infinity = nunca huir). */
  readonly escapeRiskRatio: number
  /** Regresar si la zona guardada es al menos este margen más segura que la actual. */
  readonly recallMargin: number
}

/** Valores encontrados con el simulador (búsqueda aleatoria validada en semillas distintas). */
export const DEFAULT_PARAMS: HeuristicParams = {
  weaponWeight: 1.34,
  potionWaste: 3.82,
  cursePenalty: 9.69,
  escapeRiskRatio: 0.88,
  recallMargin: 2.36,
}

/** Qué tan útil sigue siendo el arma: su valor, por la fracción de monstruos que aún puede vencer. */
function weaponValue(state: GameState): number {
  if (!state.weapon || hasCurse(state, 'pacto')) return 0
  const limit = weaponLimit(state) ?? MAX_MONSTER_RANK + 1
  const usable = Math.min(1, Math.max(0, (limit - 2) / 12))
  return state.weapon.card.rank * usable
}

function evaluate(state: GameState, weaponWeight: number): number {
  return state.health + weaponWeight * weaponValue(state)
}

/** Daño mínimo de resolver las 3 cartas menos peligrosas de un grupo, con la mejor opción de cada una. */
function zoneRisk(state: GameState, cards: readonly Card[]): number {
  const damages = cards.map((card) => {
    if (!isDamaging(card)) return 0
    const byHand = previewDamage(state, card, false)
    return weaponIssue(state, card) === null
      ? Math.min(byHand, previewDamage(state, card, true))
      : byHand
  })
  return damages
    .sort((a, b) => a - b)
    .slice(0, ZONE_PICKS)
    .reduce((sum, damage) => sum + damage, 0)
}

/**
 * Reglas, en orden: evita lo mortal, no desperdicia remedios, deja las maldiciones como la carta
 * que sobra, cuida la durabilidad del arma y huye o regresa cuando la zona es demasiado peligrosa.
 */
export function createHeuristicPolicy(params: HeuristicParams = DEFAULT_PARAMS): Policy {
  return (state, rng) => {
    const legal = getLegalActions(state)
    const flee = legal.find((action) => action.type === 'FLEE')
    const recall = legal.find((action) => action.type === 'RECALL')
    const untouched = state.interactions === 0

    if (untouched && recall && state.bookmark) {
      const saved = zoneRisk(state, state.bookmark)
      if (saved + params.recallMargin <= zoneRisk(state, state.zone)) return recall
    }
    if (untouched && flee && zoneRisk(state, state.zone) >= state.health * params.escapeRiskRatio) {
      return flee
    }

    let best: { action: GameAction; value: number } | null = null
    for (const move of describeMoves(state)) {
      if (move.action.type !== 'PLAY_CARD' || !move.card) continue
      const result = applyAction(state, move.action)
      if (!result.ok) continue

      let value = evaluate(result.state, params.weaponWeight) + rng() * 0.01
      if (move.lethal) value -= 1000
      const kind = kindOf(move.card)
      if (kind === 'potion') value -= params.potionWaste * (move.card.rank - move.heal)
      if (kind === 'curse') value -= params.cursePenalty
      if (!best || value > best.value) best = { action: move.action, value }
    }

    // Si todo lo que queda es mortal, escapar es mejor que morir.
    if (best && best.value < -500) {
      if (flee) return flee
      if (recall) return recall
    }
    return best?.action ?? randomPolicy(state, rng)
  }
}

export const heuristicPolicy: Policy = createHeuristicPolicy()
