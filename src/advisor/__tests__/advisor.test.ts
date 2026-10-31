import { describe, expect, it } from 'vitest'
import { applyAction, createGame, createRng, getLegalActions, makeCard } from '../../engine'
import type { GameAction, GameState } from '../../engine'
import {
  createHeuristicPolicy,
  describeMoves,
  heuristicPolicy,
  playOut,
  randomPolicy,
  runBatch,
  simulateGame,
  solve,
  solveSeed,
} from '..'

/** Estado de prueba con valores controlados (zona y mazo explícitos). */
function stateWith(overrides: Partial<GameState>): GameState {
  return { ...createGame(1), deck: [], zone: [], ...overrides }
}

describe('describeMoves', () => {
  it('son las jugadas legales del motor, sin la variante "con arma" donde no cambia nada', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const state = createGame(seed)
      const legal = getLegalActions(state)
      const moves = describeMoves(state)
      // Todas son legales y no hay dos iguales.
      for (const move of moves) expect(legal).toContainEqual(move.action)
      expect(new Set(moves.map((m) => JSON.stringify(m.action))).size).toBe(moves.length)
      // Una carta que no es monstruo aparece una sola vez.
      const fleeAndRecall = moves.filter((m) => m.card === null).length
      const perCard = moves.length - fleeAndRecall
      const distinctCards = new Set(moves.filter((m) => m.card).map((m) => `${m.card!.id}:${m.mode}`)).size
      expect(perCard).toBe(distinctCards)
    }
  })

  it('calcula daño, curación y si la jugada es mortal', () => {
    const state = stateWith({
      health: 8,
      weapon: { card: makeCard('diamonds', 5), lastDefeated: null },
      zone: [makeCard('clubs', 9), makeCard('hearts', 6), makeCard('spades', 12)],
    })
    const byAction = (type: GameAction['type'], cardId: string, useWeapon: boolean) =>
      describeMoves(state).find(
        (m) =>
          m.action.type === type &&
          m.action.type === 'PLAY_CARD' &&
          m.action.cardId === cardId &&
          m.action.useWeapon === useWeapon,
      )!

    expect(byAction('PLAY_CARD', 'clubs-9', true)).toMatchObject({ mode: 'weapon', damage: 4, lethal: false })
    expect(byAction('PLAY_CARD', 'clubs-9', false)).toMatchObject({ mode: 'hand', damage: 9, lethal: true })
    expect(byAction('PLAY_CARD', 'hearts-6', false)).toMatchObject({ mode: 'play', heal: 6, healthAfter: 14 })
    expect(byAction('PLAY_CARD', 'spades-12', false)).toMatchObject({ mode: 'play', damage: 0 })
  })
})

describe('políticas', () => {
  it('siempre eligen una jugada legal, con cualquier semilla', () => {
    for (const policy of [randomPolicy, heuristicPolicy]) {
      for (let seed = 1; seed <= 20; seed++) {
        let state = createGame(seed)
        const rng = createRng(seed)
        for (let step = 0; step < 300 && state.status === 'playing'; step++) {
          const action = policy(state, rng)
          expect(getLegalActions(state)).toContainEqual(action)
          const result = applyAction(state, action)
          if (!result.ok) throw new Error('jugada ilegal')
          state = result.state
        }
      }
    }
  })

  it('la política de reglas no elige una jugada mortal si hay alternativa', () => {
    const state = stateWith({
      health: 5,
      zone: [makeCard('clubs', 12), makeCard('hearts', 3), makeCard('diamonds', 4), makeCard('clubs', 2)],
    })
    const action = heuristicPolicy(state, createRng(1))
    const move = describeMoves(state).find((m) => JSON.stringify(m.action) === JSON.stringify(action))!
    expect(move.lethal).toBe(false)
  })

  it('con un arma útil, no pelea a mano contra un monstruo grande', () => {
    const state = stateWith({
      health: 14,
      weapon: { card: makeCard('diamonds', 8), lastDefeated: null },
      zone: [makeCard('clubs', 10), makeCard('clubs', 9), makeCard('clubs', 3), makeCard('clubs', 2)],
    })
    const action = heuristicPolicy(state, createRng(1))
    const move = describeMoves(state).find((m) => JSON.stringify(m.action) === JSON.stringify(action))!
    const bigMonster = move.card !== null && move.card.rank >= 8
    expect(bigMonster && move.mode === 'hand').toBe(false)
  })

  it('con la vida baja y un remedio a la mano, lo toma antes de pelear', () => {
    const state = stateWith({
      health: 9,
      zone: [makeCard('clubs', 6), makeCard('hearts', 8), makeCard('clubs', 7), makeCard('clubs', 5)],
    })
    expect(heuristicPolicy(state, createRng(1))).toEqual({
      type: 'PLAY_CARD',
      cardId: 'hearts-8',
      useWeapon: false,
    })
  })
})

describe('simulación', () => {
  it('es repetible: misma semilla, mismo resultado', () => {
    expect(simulateGame(7, heuristicPolicy)).toEqual(simulateGame(7, heuristicPolicy))
    expect(runBatch(40, heuristicPolicy)).toEqual(runBatch(40, heuristicPolicy))
  })

  it('playOut termina la partida', () => {
    const final = playOut(createGame(3), heuristicPolicy, createRng(3))
    expect(final.status).not.toBe('playing')
  })

  it('la política de reglas llega mucho más lejos que el azar', () => {
    const random = runBatch(150, randomPolicy)
    const rules = runBatch(150, heuristicPolicy)
    expect(rules.averageZones).toBeGreaterThan(random.averageZones * 1.5)
    expect(rules.averageScore).toBeGreaterThan(random.averageScore)
  })

  it('los parámetros cambian el comportamiento', () => {
    const never = createHeuristicPolicy({ ...{ weaponWeight: 1.34, potionWaste: 3.82, cursePenalty: 9.69, recallMargin: 2.36 }, escapeRiskRatio: Infinity })
    expect(runBatch(60, never).fleesPerGame).toBeLessThan(runBatch(60, heuristicPolicy).fleesPerGame)
  })
})

describe('solucionador', () => {
  it('encuentra una partida ganadora y se puede reproducir con el motor', () => {
    let reproduced = 0
    // Semillas que se resuelven en una fracción de segundo.
    for (const seed of [9, 10, 11]) {
      const found = solveSeed(seed)
      if (found.result !== 'win') continue
      let state = createGame(seed)
      for (const action of found.actions) {
        const result = applyAction(state, action)
        if (!result.ok) throw new Error(`la solución de la semilla ${seed} no es legal`)
        state = result.state
      }
      expect(state.status).toBe('won')
      reproduced++
    }
    expect(reproduced).toBe(3)
  })

  it('reconoce una partida perdida cuando se agotan todas las opciones', () => {
    const doomed = stateWith({ health: 1, zone: [makeCard('clubs', 14)] })
    expect(solve(doomed).result).toBe('lose')
  })

  it('devuelve "unknown" si el presupuesto se agota', () => {
    expect(solve(createGame(1), 5).result).toBe('unknown')
  })
})
