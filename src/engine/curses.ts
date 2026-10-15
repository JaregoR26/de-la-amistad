import type { ActiveCurse, Card, CurseId, GameState } from './types'

/**
 * Qué maldición impone cada figura de picas.
 * NOTA: los efectos son una propuesta inicial; ajústalos a los del prototipo de Godot.
 */
export const CURSE_BY_CARD_ID: Readonly<Record<string, CurseId>> = {
  'spades-11': 'pacto', // Charro Negro
  'spades-12': 'llanto', // La Llorona
  'spades-13': 'bestia', // Nahual
  'spades-14': 'mal-agüero', // La Lechuza: -2 de durabilidad al arma durante la zona
}

export function curseForCard(card: Card): CurseId | null {
  return CURSE_BY_CARD_ID[card.id] ?? null
}

export function hasCurse(state: Pick<GameState, 'curses'>, id: CurseId): boolean {
  return state.curses.some((c) => c.id === id)
}

/** Aplica o renueva una maldición (no se acumulan dos iguales). */
export function withCurse(
  curses: readonly ActiveCurse[],
  id: CurseId,
  expiresAt: number,
): ActiveCurse[] {
  return [...curses.filter((c) => c.id !== id), { id, expiresAt }]
}
