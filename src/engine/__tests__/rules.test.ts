import { describe, expect, it } from 'vitest'
import {
  applyAction,
  createGame,
  getLegalActions,
  previewDamage,
  weaponIssue,
  weaponLimit,
  cardsRemaining,
  dawnProgress,
} from '../rules'
import { computeScore } from '../scoring'
import type { GameAction, GameState } from '../types'
import { c, stateWith } from './helpers'

function run(state: GameState, action: GameAction): GameState {
  const result = applyAction(state, action)
  if (!result.ok) throw new Error(`Acción ilegal: ${result.error}`)
  return result.state
}

const play = (state: GameState, id: string, useWeapon = false) =>
  run(state, { type: 'PLAY_CARD', cardId: id, useWeapon })

describe('createGame', () => {
  it('reparte una zona de 4 cartas con 20 de vida y 40 en el mazo', () => {
    const game = createGame(7)
    expect(game.zone).toHaveLength(4)
    expect(game.deck).toHaveLength(40)
    expect(game.health).toBe(20)
    expect(game.status).toBe('playing')
  })
})

describe('combate', () => {
  it('sin arma el daño es el valor de la carta', () => {
    const state = stateWith({ zone: [c('clubs', 8), c('hearts', 2)], health: 20 })
    expect(play(state, 'clubs-8').health).toBe(12)
  })

  it('con arma el daño se reduce por el valor del arma', () => {
    const state = stateWith({
      zone: [c('clubs', 8)],
      weapon: { card: c('diamonds', 5), lastDefeated: null },
    })
    expect(play(state, 'clubs-8', true).health).toBe(17)
  })

  it('el arma no puede dañar a un monstruo igual o mayor al último derrotado', () => {
    const state = stateWith({
      zone: [c('clubs', 8)],
      weapon: { card: c('diamonds', 5), lastDefeated: 8 },
    })
    const result = applyAction(state, { type: 'PLAY_CARD', cardId: 'clubs-8', useWeapon: true })
    expect(result).toEqual({ ok: false, error: 'WEAPON_TOO_WORN' })
  })

  it('derrotar con el arma baja su límite', () => {
    const state = stateWith({
      zone: [c('spades', 7)],
      weapon: { card: c('diamonds', 5), lastDefeated: null },
    })
    expect(play(state, 'spades-7', true).weapon?.lastDefeated).toBe(7)
  })

  it('equipar un arma nueva reinicia el límite', () => {
    const state = stateWith({
      zone: [c('diamonds', 9)],
      weapon: { card: c('diamonds', 3), lastDefeated: 4 },
    })
    expect(play(state, 'diamonds-9').weapon).toEqual({ card: c('diamonds', 9), lastDefeated: null })
  })

  it('la vida nunca baja de 0 y la partida se pierde', () => {
    const state = stateWith({ zone: [c('clubs', 14)], health: 5 })
    const next = play(state, 'clubs-14')
    expect(next.health).toBe(0)
    expect(next.status).toBe('lost')
  })
})

describe('pociones', () => {
  it('curan hasta el máximo de 20', () => {
    const state = stateWith({ zone: [c('hearts', 10)], health: 15 })
    expect(play(state, 'hearts-10').health).toBe(20)
  })

  it('solo la primera poción de la zona cura', () => {
    let state = stateWith({ zone: [c('hearts', 4), c('hearts', 5)], health: 10 })
    state = play(state, 'hearts-4')
    state = play(state, 'hearts-5')
    expect(state.health).toBe(14)
  })
})

describe('maldiciones (figuras de picas)', () => {
  it('no hacen daño y se aplican', () => {
    const state = stateWith({ zone: [c('spades', 12), c('clubs', 2)], health: 20 })
    const next = play(state, 'spades-12')
    expect(next.health).toBe(20)
    expect(next.curses.map((x) => x.id)).toEqual(['llanto'])
  })

  it('La Llorona reduce a la mitad la curación', () => {
    const state = stateWith({
      zone: [c('hearts', 9)],
      health: 10,
      curses: [{ id: 'llanto', expiresAt: 1 }],
    })
    expect(play(state, 'hearts-9').health).toBe(14)
  })

  it('el Nahual suma daño a la fauna', () => {
    const state = stateWith({
      zone: [c('clubs', 6)],
      curses: [{ id: 'bestia', expiresAt: 1 }],
    })
    expect(previewDamage(state, c('clubs', 6), false)).toBe(8)
  })

  it('la Lechuza baja 2 de durabilidad al arma durante la zona', () => {
    const worn = stateWith({
      zone: [c('clubs', 5), c('clubs', 6)],
      weapon: { card: c('diamonds', 9), lastDefeated: 8 },
      curses: [{ id: 'mal-agüero', expiresAt: 1 }],
    })
    expect(weaponLimit(worn)).toBe(6)
    expect(
      applyAction(worn, { type: 'PLAY_CARD', cardId: 'clubs-6', useWeapon: true }),
    ).toEqual({ ok: false, error: 'WEAPON_TOO_WORN' })
    expect(applyAction(worn, { type: 'PLAY_CARD', cardId: 'clubs-5', useWeapon: true }).ok).toBe(true)
  })

  it('con un arma sin desgaste, la Lechuza la deja sin servir contra K y A', () => {
    const fresh = stateWith({
      zone: [c('clubs', 12), c('clubs', 13)],
      weapon: { card: c('diamonds', 9), lastDefeated: null },
      curses: [{ id: 'mal-agüero', expiresAt: 1 }],
    })
    expect(weaponLimit(fresh)).toBe(13)
    expect(weaponIssue(fresh, c('clubs', 13))).toBe('WEAPON_TOO_WORN')
    expect(weaponIssue(fresh, c('clubs', 12))).toBeNull()
  })

  it('el Charro Negro inutiliza el arma', () => {
    const state = stateWith({
      zone: [c('clubs', 6)],
      weapon: { card: c('diamonds', 5), lastDefeated: null },
      curses: [{ id: 'pacto', expiresAt: 1 }],
    })
    const result = applyAction(state, { type: 'PLAY_CARD', cardId: 'clubs-6', useWeapon: true })
    expect(result).toEqual({ ok: false, error: 'WEAPON_BOUND' })
  })

  it('duran solo la zona donde aparece la carta', () => {
    const deck = [c('hearts', 2), c('hearts', 3), c('hearts', 4), c('hearts', 5)]
    let state = stateWith({
      deck,
      zone: [c('spades', 12), c('clubs', 2), c('clubs', 3), c('clubs', 4)],
    })
    state = play(state, 'spades-12')
    expect(state.curses).toHaveLength(1)
    state = play(play(state, 'clubs-2'), 'clubs-3')
    expect(state.zonesCompleted).toBe(1)
    expect(state.curses).toHaveLength(0)
    expect(state.log.some((e) => e.type === 'curse-expired')).toBe(true)
  })
})

describe('flujo de zonas', () => {
  it('tras 3 cartas la restante pasa a la zona siguiente y se rellena a 4', () => {
    const state = stateWith({
      deck: [c('hearts', 2), c('hearts', 3), c('hearts', 4)],
      zone: [c('diamonds', 2), c('diamonds', 3), c('diamonds', 4), c('diamonds', 5)],
    })
    const next = play(play(play(state, 'diamonds-2'), 'diamonds-3'), 'diamonds-4')
    expect(next.zone.map((x) => x.id)).toEqual([
      'diamonds-5', 'hearts-2', 'hearts-3', 'hearts-4',
    ])
    expect(next.interactions).toBe(0)
    expect(next.potionUsed).toBe(false)
  })

  it('se gana al vaciar mazo y mesa con vida', () => {
    const state = stateWith({ zone: [c('diamonds', 2)], health: 12 })
    const next = play(state, 'diamonds-2')
    expect(next.status).toBe('won')
    expect(computeScore(next)).toBe(12)
  })
})

describe('huir y regresar', () => {
  const fullDeck = Array.from({ length: 8 }, (_, i) => c('hearts', (i + 2) as 2))
  const zone = [c('clubs', 2), c('clubs', 3), c('clubs', 4), c('clubs', 5)]

  it('Huir guarda la zona y reparte una nueva', () => {
    const state = stateWith({ deck: fullDeck, zone })
    const next = run(state, { type: 'FLEE' })
    expect(next.bookmark).toEqual(zone)
    expect(next.zone).toHaveLength(4)
    expect(next.deck).toHaveLength(4)
  })

  it('no se puede huir dos veces seguidas', () => {
    const fled = run(stateWith({ deck: fullDeck, zone }), { type: 'FLEE' })
    expect(applyAction(fled, { type: 'FLEE' })).toEqual({ ok: false, error: 'ALREADY_FLED' })
    expect(applyAction(fled, { type: 'RECALL' })).toEqual({ ok: false, error: 'ALREADY_FLED' })
  })

  it('no se puede huir con la zona empezada', () => {
    const started = play(stateWith({ deck: fullDeck, zone }), 'clubs-2')
    expect(applyAction(started, { type: 'FLEE' })).toEqual({ ok: false, error: 'NEEDS_FULL_ZONE' })
  })

  it('solo cabe una zona guardada', () => {
    const base = stateWith({ deck: fullDeck, zone, bookmark: [c('spades', 2)] })
    expect(applyAction(base, { type: 'FLEE' })).toEqual({ ok: false, error: 'BOOKMARK_OCCUPIED' })
  })

  it('Regresar vacía el array y deja la zona que dejas arriba del mazo', () => {
    const fled = run(stateWith({ deck: fullDeck, zone }), { type: 'FLEE' })
    const left = fled.zone
    const back = run({ ...fled, fledPreviousZone: false }, { type: 'RECALL' })
    expect(back.zone).toEqual(zone)
    expect(back.bookmark).toBeNull()
    expect(back.deck.slice(0, 4)).toEqual(left)
    expect(back.deck).toHaveLength(fled.deck.length + 4)
  })

  it('la zona guardada regresa obligatoriamente como última zona', () => {
    const saved = [c('clubs', 2), c('clubs', 3), c('clubs', 4), c('clubs', 5)]
    const state = stateWith({ zone: [c('diamonds', 2)], bookmark: saved })
    const next = play(state, 'diamonds-2')
    expect(next.status).toBe('playing')
    expect(next.zone).toEqual(saved)
    expect(next.bookmark).toBeNull()
  })
})

describe('puntuación', () => {
  it('derrota: resta el valor de los enemigos restantes', () => {
    const state = stateWith({
      status: 'lost',
      health: 0,
      deck: [c('clubs', 10), c('hearts', 9)],
      zone: [c('spades', 14)],
    })
    expect(computeScore(state)).toBe(-(10 + 14))
  })

  it('victoria con 20 de vida y última carta poción suma su valor', () => {
    const state = stateWith({ status: 'won', health: 20, lastResolved: c('hearts', 7) })
    expect(computeScore(state)).toBe(27)
  })

  it('devuelve null mientras se juega', () => {
    expect(computeScore(createGame(3))).toBeNull()
  })
})

describe('amanecer', () => {
  it('empieza en 0 con las 44 cartas pendientes', () => {
    const game = createGame(5)
    expect(cardsRemaining(game)).toBe(44)
    expect(dawnProgress(game)).toBe(0)
  })

  it('cuenta mazo, mesa y zona guardada', () => {
    const state = stateWith({
      deck: [c('hearts', 2)],
      zone: [c('clubs', 2), c('clubs', 3)],
      bookmark: [c('spades', 2)],
    })
    expect(cardsRemaining(state)).toBe(4)
    expect(dawnProgress(state)).toBeCloseTo(40 / 44)
  })
})

describe('getLegalActions', () => {
  it('ofrece huir al inicio y nunca acciones ilegales', () => {
    const state = createGame(11)
    const actions = getLegalActions(state)
    expect(actions).toContainEqual({ type: 'FLEE' })
    expect(actions.every((a) => applyAction(state, a).ok)).toBe(true)
  })

  it('termina vacío cuando la partida acabó', () => {
    expect(getLegalActions(stateWith({ status: 'won' }))).toEqual([])
  })
})
