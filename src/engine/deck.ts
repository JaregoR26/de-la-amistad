import { makeCard } from './cards'
import { createRng } from './rng'
import type { Card, Rank, Suit } from './types'

const ALL_RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
const NUMERIC_RANKS: readonly Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10]

/**
 * Baraja de 44 cartas: sin comodines, sin figuras rojas y sin ases rojos.
 * Negras: A-K de picas y tréboles (26). Rojas: 2-10 de diamantes y corazones (18).
 */
export function buildDeck(): Card[] {
  const black: Suit[] = ['spades', 'clubs']
  const red: Suit[] = ['diamonds', 'hearts']
  return [
    ...black.flatMap((suit) => ALL_RANKS.map((rank) => makeCard(suit, rank))),
    ...red.flatMap((suit) => NUMERIC_RANKS.map((rank) => makeCard(suit, rank))),
  ]
}

/** Fisher-Yates con RNG inyectado; no muta la entrada. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const a = result[i] as T
    const b = result[j] as T
    result[i] = b
    result[j] = a
  }
  return result
}

export function shuffledDeck(seed: number): Card[] {
  return shuffle(buildDeck(), createRng(seed))
}
