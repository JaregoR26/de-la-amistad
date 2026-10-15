import { isEnemy, kindOf } from './cards'
import {
  BESTIA_EXTRA_DAMAGE,
  CURSE_DURATION_ZONES,
  LECHUZA_DURABILITY_PENALTY,
  MAX_HEALTH,
  MAX_MONSTER_RANK,
  ZONE_PICKS,
  ZONE_SIZE,
  TOTAL_CARDS,
  HARD_CURSE_DURATION_ZONES,
} from './constants'
import { curseForCard, hasCurse, withCurse } from './curses'
import { shuffledDeck } from './deck'
import { randomSeed } from './rng'
import type {
  ActionResult,
  Card,
  GameAction,
  GameEvent,
  GameState,
  RuleErrorCode,
} from './types'

const fail = (error: RuleErrorCode): ActionResult => ({ ok: false, error })

/* -------------------------------------------------------------------------- */
/*  Creación                                                                  */
/* -------------------------------------------------------------------------- */

export interface GameOptions {
  readonly hardMode?: boolean
}

export function createGame(seed: number = randomSeed(), options: GameOptions = {}): GameState {
  const deck = shuffledDeck(seed)
  return {
    seed,
    hardMode: options.hardMode ?? false,
    status: 'playing',
    health: MAX_HEALTH,
    deck: deck.slice(ZONE_SIZE),
    discard: [],
    zone: deck.slice(0, ZONE_SIZE),
    bookmark: null,
    interactions: 0,
    potionUsed: false,
    fledPreviousZone: false,
    zonesCompleted: 0,
    weapon: null,
    curses: [],
    lastResolved: null,
    log: [],
  }
}

/**
 * Cambia el modo de juego. Solo es válido antes de la primera acción: conserva el
 * mismo reparto. Con la partida ya empezada devuelve el estado sin cambios.
 */
export function withHardMode(state: GameState, hardMode: boolean): GameState {
  return state.log.length === 0 ? createGame(state.seed, { hardMode }) : state
}
/* -------------------------------------------------------------------------- */
/*  Consultas (seguras para usar desde la UI y desde el asistente de IA)      */
/* -------------------------------------------------------------------------- */

/**
 * Valor a partir del cual el arma ya no sirve: solo ataca a monstruos de valor
 * estrictamente menor. null = sin restricción. Incluye el mal agüero de la Lechuza.
 */
export function weaponLimit(state: GameState): number | null {
  if (!state.weapon) return null
  const penalty = hasCurse(state, 'mal-agüero') ? LECHUZA_DURABILITY_PENALTY : 0
  if (state.weapon.lastDefeated === null && penalty === 0) return null
  return (state.weapon.lastDefeated ?? MAX_MONSTER_RANK + 1) - penalty
}

/** Por qué el arma no puede usarse contra esta carta, o null si puede. */
export function weaponIssue(state: GameState, card: Card): RuleErrorCode | null {
  if (!state.weapon) return 'WEAPON_UNAVAILABLE'
  if (hasCurse(state, 'pacto')) return 'WEAPON_BOUND'
  const limit = weaponLimit(state)
  if (limit !== null && card.rank >= limit) return 'WEAPON_TOO_WORN'
  return null
}

export function previewDamage(state: GameState, card: Card, useWeapon: boolean): number {
  const base =
    useWeapon && state.weapon ? Math.max(0, card.rank - state.weapon.card.rank) : card.rank
  const bonus = kindOf(card) === 'fauna' && hasCurse(state, 'bestia') ? BESTIA_EXTRA_DAMAGE : 0
  return base + bonus
}

/** Vida que realmente recuperaría esta poción ahora mismo. */
export function previewHeal(state: GameState, card: Card): number {
  if (state.potionUsed) return 0
  const full = hasCurse(state, 'llanto') ? Math.floor(card.rank / 2) : card.rank
  return Math.min(full, MAX_HEALTH - state.health)
}

/** Cuántas cartas faltan por resolver en la zona antes de avanzar. */
export function picksRemaining(state: GameState): number {
  return Math.max(0, Math.min(ZONE_PICKS - state.interactions, state.zone.length))
}

export function getLegalActions(state: GameState): GameAction[] {
  const candidates: GameAction[] = [
    ...state.zone.flatMap((card): GameAction[] => [
      { type: 'PLAY_CARD', cardId: card.id, useWeapon: false },
      { type: 'PLAY_CARD', cardId: card.id, useWeapon: true },
    ]),
    { type: 'FLEE' },
    { type: 'RECALL' },
  ]
  return candidates.filter((action) => applyAction(state, action).ok)
}

/* -------------------------------------------------------------------------- */
/*  Transiciones                                                              */
/* -------------------------------------------------------------------------- */

export function applyAction(state: GameState, action: GameAction): ActionResult {
  if (state.status !== 'playing') return fail('GAME_OVER')
  switch (action.type) {
    case 'PLAY_CARD':
      return playCard(state, action.cardId, action.useWeapon)
    case 'FLEE':
      return flee(state)
    case 'RECALL':
      return recall(state)
  }
}

function playCard(state: GameState, cardId: string, useWeapon: boolean): ActionResult {
  const card = state.zone.find((c) => c.id === cardId)
  if (!card) return fail('CARD_NOT_IN_ZONE')

  let next: GameState = {
    ...state,
    zone: state.zone.filter((c) => c.id !== cardId),
    discard: [...state.discard, card],
    interactions: state.interactions + 1,
    lastResolved: card,
  }
  const events: GameEvent[] = []

  switch (kindOf(card)) {
    case 'weapon': {
      const replaced = state.weapon?.card ?? null
      next = {
        ...next,
        weapon: { card, lastDefeated: null },
        discard: replaced ? [...next.discard, replaced] : next.discard,
      }
      events.push({ type: 'weapon-equipped', card, replaced })
      break
    }
    case 'potion': {
      const healed = previewHeal(state, card)
      next = { ...next, health: state.health + healed, potionUsed: true }
      events.push({ type: 'potion', card, healed, wasted: state.potionUsed })
      break
    }
    case 'fauna':
    case 'spirit': {
      if (useWeapon) {
        const issue = weaponIssue(state, card)
        if (issue) return fail(issue)
      }
      const damage = previewDamage(state, card, useWeapon)
      next = {
        ...next,
        health: Math.max(0, state.health - damage),
        weapon:
          useWeapon && state.weapon ? { ...state.weapon, lastDefeated: card.rank } : state.weapon,
      }
      events.push({ type: 'fight', card, withWeapon: useWeapon, damage })
      break
    }
    case 'curse': {
      const curse = curseForCard(card)
      if (curse) {
        next = {
          ...next,
          curses: withCurse(
            state.curses,
            curse,
            state.zonesCompleted +
            (state.hardMode ? HARD_CURSE_DURATION_ZONES : CURSE_DURATION_ZONES),
          ),
        }
        events.push({ type: 'curse-applied', card, curse })
      }
      break
    }
  }

  if (next.health <= 0) {
    events.push({ type: 'game-over', status: 'lost' })
    return commit({ ...next, status: 'lost' }, events)
  }
  if (next.interactions >= ZONE_PICKS || next.zone.length === 0) {
    return commit(...advanceZone(next, events))
  }
  return commit(next, events)
}

/** Cierra la zona: expira maldiciones, rellena la mesa y resuelve fin de partida. */
function advanceZone(state: GameState, events: GameEvent[]): [GameState, GameEvent[]] {
  const zonesCompleted = state.zonesCompleted + 1
  const expired = state.curses.filter((c) => c.expiresAt <= zonesCompleted)
  const out: GameEvent[] = [
    ...events,
    { type: 'zone-completed', zonesCompleted },
    ...expired.map((c): GameEvent => ({ type: 'curse-expired', curse: c.id })),
  ]

  const deck = [...state.deck]
  let zone = [...state.zone]
  let bookmark = state.bookmark
  while (zone.length < ZONE_SIZE && deck.length > 0) {
    zone.push(deck.shift() as Card)
  }

  let status = state.status
  if (zone.length === 0 && deck.length === 0) {
    if (bookmark) {
      // Regla: una zona guardada no se puede dejar pendiente para ganar.
      zone = [...bookmark]
      bookmark = null
      out.push({ type: 'forced-return' })
    } else {
      status = 'won'
      out.push({ type: 'game-over', status: 'won' })
    }
  }

  return [
    {
      ...state,
      status,
      zonesCompleted,
      curses: state.curses.filter((c) => c.expiresAt > zonesCompleted),
      deck,
      zone,
      bookmark,
      interactions: 0,
      potionUsed: false,
      fledPreviousZone: false,
    },
    out,
  ]
}

function escapeIssue(state: GameState): RuleErrorCode | null {
  if (state.zone.length !== ZONE_SIZE || state.interactions !== 0) return 'NEEDS_FULL_ZONE'
  if (state.fledPreviousZone) return 'ALREADY_FLED'
  return null
}

/** Huir: guarda la zona actual en el "marcador" y reparte una zona nueva. */
function flee(state: GameState): ActionResult {
  const issue = escapeIssue(state)
  if (issue) return fail(issue)
  if (state.bookmark) return fail('BOOKMARK_OCCUPIED')
  if (state.deck.length < ZONE_SIZE) return fail('DECK_TOO_SMALL')
  return commit(
    {
      ...state,
      bookmark: state.zone,
      zone: state.deck.slice(0, ZONE_SIZE),
      deck: state.deck.slice(ZONE_SIZE),
      fledPreviousZone: true,
    },
    [{ type: 'fled' }],
  )
}

/**
 * Regresar: la zona guardada vuelve a la mesa y el array se vacía. Las cartas de
 * la zona que dejas atrás se ponen arriba del mazo: no se pierde ninguna (no se
 * puede saltar zonas gratis) y regresan enseguida.
 */
function recall(state: GameState): ActionResult {
  if (!state.bookmark) return fail('NO_BOOKMARK')
  const issue = escapeIssue(state)
  if (issue) return fail(issue)
  return commit(
    {
      ...state,
      zone: state.bookmark,
      bookmark: null,
      deck: [...state.zone, ...state.deck],
      fledPreviousZone: true,
    },
    [{ type: 'recalled' }],
  )
}

function commit(state: GameState, events: readonly GameEvent[]): ActionResult {
  return { ok: true, state: { ...state, log: [...state.log, ...events] } }
}

/* -------------------------------------------------------------------------- */
/*  Utilidades de estado                                                      */
/* -------------------------------------------------------------------------- */

/** Cartas que aún faltan por resolver (mazo + mesa + zona guardada). */
export function cardsRemaining(state: GameState): number {
  return state.deck.length + state.zone.length + (state.bookmark?.length ?? 0)
}

/** Avance de la noche: 0 al empezar, 1 cuando ya no queda ninguna carta. */
export function dawnProgress(state: GameState): number {
  return 1 - cardsRemaining(state) / TOTAL_CARDS
}

/** Todas las cartas que aún no se resuelven (mazo + mesa + zona guardada). */
export function remainingCards(state: GameState): Card[] {
  return [...state.deck, ...state.zone, ...(state.bookmark ?? [])]
}

export function remainingEnemies(state: GameState): Card[] {
  return remainingCards(state).filter(isEnemy)
}

