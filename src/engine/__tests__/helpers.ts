import { makeCard } from '../cards'
import { createGame } from '../rules'
import type { Card, GameState, Rank, Suit } from '../types'

/** Atajo: c('spades', 12) → Q de picas. */
export const c = (suit: Suit, rank: Rank): Card => makeCard(suit, rank)

/** Estado de prueba con valores por defecto controlados. */
export function stateWith(overrides: Partial<GameState> = {}): GameState {
  return { ...createGame(1), deck: [], zone: [], ...overrides }
}
