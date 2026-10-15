/**
 * Tipos del dominio del juego. Este módulo no depende de React ni del DOM:
 * todo el motor es TypeScript puro para poder probarlo y reutilizarlo
 * (por ejemplo, en el asistente de IA).
 */

export type Suit = 'spades' | 'clubs' | 'diamonds' | 'hearts'

/** 2-10 numéricos, 11 = J, 12 = Q, 13 = K, 14 = A. */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14

export interface Card {
  readonly id: string
  readonly suit: Suit
  readonly rank: Rank
}

/**
 * - weapon:  diamantes
 * - potion:  corazones
 * - fauna:   tréboles (animales reales)
 * - spirit:  picas 2-10 (apariciones que sí hacen daño)
 * - curse:   figuras y as de picas (imponen maldiciones, no hacen daño)
 */
export type CardKind = 'weapon' | 'potion' | 'fauna' | 'spirit' | 'curse'

export type CurseId = 'pacto' | 'llanto' | 'bestia' | 'mal-agüero'

export interface ActiveCurse {
  readonly id: CurseId
  /** La maldición expira al completar la zona donde apareció (`zonesCompleted` alcanza este valor). */
  readonly expiresAt: number
}

export interface Weapon {
  readonly card: Card
  /** Valor del último monstruo derrotado; el siguiente debe ser menor. */
  readonly lastDefeated: number | null
}

export type GameStatus = 'playing' | 'won' | 'lost'

export interface GameState {
  readonly seed: number
  readonly hardMode: boolean
  readonly status: GameStatus
  readonly health: number
  /** El índice 0 es la carta de arriba. */
  readonly deck: readonly Card[]
  readonly discard: readonly Card[]
  /** La Zona actual: hasta 4 cartas sobre la mesa. */
  readonly zone: readonly Card[]
  /** Zona guardada con "Huir"; solo cabe una. */
  readonly bookmark: readonly Card[] | null
  /** Cartas resueltas en la zona actual. */
  readonly interactions: number
  readonly potionUsed: boolean
  /** true si se llegó a esta zona huyendo o regresando; evita huir dos veces seguidas. */
  readonly fledPreviousZone: boolean
  readonly zonesCompleted: number
  readonly weapon: Weapon | null
  readonly curses: readonly ActiveCurse[]
  readonly lastResolved: Card | null
  readonly log: readonly GameEvent[]
}

export type GameEvent =
  | { readonly type: 'weapon-equipped'; readonly card: Card; readonly replaced: Card | null }
  | { readonly type: 'potion'; readonly card: Card; readonly healed: number; readonly wasted: boolean }
  | {
      readonly type: 'fight'
      readonly card: Card
      readonly withWeapon: boolean
      readonly damage: number
    }
  | { readonly type: 'curse-applied'; readonly card: Card; readonly curse: CurseId }
  | { readonly type: 'curse-expired'; readonly curse: CurseId }
  | { readonly type: 'fled' }
  | { readonly type: 'recalled' }
  | { readonly type: 'forced-return' }
  | { readonly type: 'zone-completed'; readonly zonesCompleted: number }
  | { readonly type: 'game-over'; readonly status: 'won' | 'lost' }

export type GameAction =
  | { readonly type: 'PLAY_CARD'; readonly cardId: string; readonly useWeapon: boolean }
  | { readonly type: 'FLEE' }
  | { readonly type: 'RECALL' }

export type RuleErrorCode =
  | 'GAME_OVER'
  | 'CARD_NOT_IN_ZONE'
  | 'WEAPON_UNAVAILABLE'
  | 'WEAPON_TOO_WORN'
  | 'WEAPON_BOUND'
  | 'NEEDS_FULL_ZONE'
  | 'BOOKMARK_OCCUPIED'
  | 'NO_BOOKMARK'
  | 'ALREADY_FLED'
  | 'DECK_TOO_SMALL'

export type ActionResult =
  | { readonly ok: true; readonly state: GameState }
  | { readonly ok: false; readonly error: RuleErrorCode }
