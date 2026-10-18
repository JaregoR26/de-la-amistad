import { describe, expect, it } from 'vitest'
import {
  applyAction,
  getLegalActions,
  previewDamage,
  weaponIssue,
  remainingCards,
} from '../../engine'
import type { GameState } from '../../engine'
import { createPracticeGame } from '../practiceGame'
import { sameAction, STEPS } from '../script'

/** Juega el guion paso a paso con el motor real y devuelve el estado antes de cada paso. */
function replay(): Array<{ before: GameState; after: GameState }> {
  let game = createPracticeGame()
  return STEPS.map((step) => {
    const before = game
    if (step.action) {
      const result = applyAction(game, step.action)
      if (!result.ok) throw new Error(`Paso "${step.id}": la acción no es legal (${result.error})`)
      game = result.state
    }
    return { before, after: game }
  })
}

describe('tutorial', () => {
  it('cada acción del guion es legal cuando le toca', () => {
    for (const step of STEPS) {
      if (!step.action) continue
      const index = STEPS.indexOf(step)
      const { before } = replay()[index]!
      expect(
        getLegalActions(before).some((legal) => sameAction(legal, step.action!)),
        step.id,
      ).toBe(true)
    }
  })

  it('el guion se completa sin morir ni terminar la partida', () => {
    const steps = replay()
    const final = steps[steps.length - 1]!.after
    expect(final.status).toBe('playing')
    expect(final.health).toBeGreaterThan(0)
  })

  it('empieza con las 44 cartas pendientes, para que el amanecer arranque en 0', () => {
    expect(remainingCards(createPracticeGame())).toHaveLength(44)
  })

  it('cada paso con acción tiene su carta en la mesa y su botón existe', () => {
    for (const [i, step] of STEPS.entries()) {
      const action = step.action
      if (action?.type !== 'PLAY_CARD') continue
      const { before } = replay()[i]!
      expect(before.zone.some((card) => card.id === action.cardId), step.id).toBe(true)
      expect(step.target.startsWith(`${action.cardId}:`), step.id).toBe(true)
    }
  })

  it('la lección del desgaste: el arma sirve contra la aparición y ya no contra el monstruo siguiente', () => {
    const byId = Object.fromEntries(STEPS.map((s, i) => [s.id, replay()[i]!.before]))
    const beforeSpirit = byId['aparicion']!
    const spirit = beforeSpirit.zone.find((card) => card.id === 'spades-5')!
    expect(weaponIssue(beforeSpirit, spirit)).toBeNull()
    expect(previewDamage(beforeSpirit, spirit, true)).toBe(0)

    const beforeWorn = byId['a-mano']!
    const beast = beforeWorn.zone.find((card) => card.id === 'clubs-7')!
    expect(weaponIssue(beforeWorn, beast)).toBe('WEAPON_TOO_WORN')
  })

  it('el remedio realmente cura en el paso del remedio', () => {
    const steps = replay()
    const i = STEPS.findIndex((s) => s.id === 'remedio')
    expect(steps[i]!.after.health).toBeGreaterThan(steps[i]!.before.health)
  })

  it('la zona de huida es mortal a mano y se puede huir', () => {
    const i = STEPS.findIndex((s) => s.id === 'huir')
    const { before } = replay()[i]!
    const deadly = before.zone.find((card) => card.id === 'clubs-14')!
    expect(previewDamage(before, deadly, false)).toBeGreaterThanOrEqual(before.health)
    expect(getLegalActions(before)).toContainEqual({ type: 'FLEE' })
    expect(replay()[i]!.after.bookmark).not.toBeNull()
  })

  it('los ids de los pasos son únicos', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(STEPS.length)
  })
})
