import type { Card, CardKind, Rank, Suit } from './types'

export const SUIT_SYMBOL: Record<Suit, string> = {
  spades: '♠',
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
}

export function makeCard(suit: Suit, rank: Rank): Card {
  return { id: `${suit}-${rank}`, suit, rank }
}

export function kindOf(card: Card): CardKind {
  switch (card.suit) {
    case 'diamonds':
      return 'weapon'
    case 'hearts':
      return 'potion'
    case 'clubs':
      return 'fauna'
    case 'spades':
      return card.rank >= 11 ? 'curse' : 'spirit'
  }
}

/** Fauna y apariciones hacen daño y pueden enfrentarse con arma. */
export function isDamaging(card: Card): boolean {
  const kind = kindOf(card)
  return kind === 'fauna' || kind === 'spirit'
}

/** Todo lo que cuenta como "enemigo" para la puntuación. */
export function isEnemy(card: Card): boolean {
  return card.suit === 'spades' || card.suit === 'clubs'
}

export function rankLabel(rank: Rank): string {
  switch (rank) {
    case 11:
      return 'J'
    case 12:
      return 'Q'
    case 13:
      return 'K'
    case 14:
      return 'A'
    default:
      return String(rank)
  }
}
