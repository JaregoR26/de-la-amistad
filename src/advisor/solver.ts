import { applyAction, createGame } from '../engine'
import type { GameAction, GameState } from '../engine'
import { describeMoves } from './moves'

export type SolveResult =
  /** Existe una forma de ganar; `actions` es una partida ganadora completa. */
  | { readonly result: 'win'; readonly actions: readonly GameAction[]; readonly nodes: number }
  /** Se exploraron todas las posibilidades y ninguna gana. */
  | { readonly result: 'lose'; readonly nodes: number }
  /** Se agotó el presupuesto de búsqueda antes de decidir. */
  | { readonly result: 'unknown'; readonly nodes: number }

/** Identifica un estado para no explorarlo dos veces (el orden del mazo importa). */
function stateKey(s: GameState): string {
  return [
    s.deck.map((c) => c.id).join(','),
    s.zone.map((c) => c.id).sort().join(','),
    s.bookmark ? s.bookmark.map((c) => c.id).sort().join(',') : '-',
    s.health,
    s.interactions,
    s.potionUsed ? 1 : 0,
    s.fledPreviousZone ? 1 : 0,
    s.weapon ? `${s.weapon.card.id}:${s.weapon.lastDefeated}` : '-',
    s.curses.map((c) => `${c.id}${c.expiresAt - s.zonesCompleted}`).join(';'),
  ].join('|')
}

/**
 * Busca una partida ganadora conociendo el orden completo del mazo (información perfecta).
 * No sirve para jugar de verdad, pero responde "¿se puede ganar esta semilla?", útil para
 * medir el balance y para elegir semillas justas (por ejemplo, un reto del día).
 */
export function solve(start: GameState, nodeBudget = 400_000): SolveResult {
  const dead = new Set<string>()
  const path: GameAction[] = []
  let nodes = 0
  let exhausted = false

  const search = (state: GameState): boolean => {
    if (state.status === 'won') return true
    if (state.status === 'lost') return false
    if (nodes++ >= nodeBudget) {
      exhausted = true
      return false
    }
    const key = stateKey(state)
    if (dead.has(key)) return false

    const moves = describeMoves(state)
      .filter((move) => !move.lethal)
      .sort((a, b) => b.healthAfter - a.healthAfter)
    for (const move of moves) {
      const result = applyAction(state, move.action)
      if (!result.ok) continue
      path.push(move.action)
      if (search(result.state)) return true
      path.pop()
      if (exhausted) return false
    }
    dead.add(key)
    return false
  }

  if (search(start)) return { result: 'win', actions: [...path], nodes }
  return { result: exhausted ? 'unknown' : 'lose', nodes }
}

export function solveSeed(seed: number, hardMode = false, nodeBudget?: number): SolveResult {
  return solve(createGame(seed, { hardMode }), nodeBudget)
}
