import { createGame, makeCard, shuffledDeck } from '../engine'
import type { Card, GameState } from '../engine'

const PRACTICE_SEED = 2024

/** Zona inicial: arma, monstruo, remedio y una aparición que pasa a la zona siguiente. */
const FIRST_ZONE: readonly Card[] = [
  makeCard('diamonds', 5),
  makeCard('clubs', 9),
  makeCard('hearts', 4),
  makeCard('spades', 5),
]

/**
 * Cartas que salen del mazo en orden: zona 2 (maldición, fauna, remedio) y zona 3
 * (una zona mortal para enseñar a huir). El resto del mazo es la baraja real.
 */
const NEXT_CARDS: readonly Card[] = [
  makeCard('spades', 12),
  makeCard('clubs', 7),
  makeCard('hearts', 10),
  makeCard('clubs', 14),
  makeCard('spades', 13),
  makeCard('clubs', 12),
]

/** Partida de práctica: mismas reglas del motor, pero con cartas fijas para guiar el tutorial. */
export function createPracticeGame(): GameState {
  const scripted = new Set([...FIRST_ZONE, ...NEXT_CARDS].map((card) => card.id))
  const rest = shuffledDeck(PRACTICE_SEED).filter((card) => !scripted.has(card.id))
  return {
    ...createGame(PRACTICE_SEED),
    zone: [...FIRST_ZONE],
    deck: [...NEXT_CARDS, ...rest],
  }
}
