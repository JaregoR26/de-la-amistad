import { applyAction, computeScore, createGame, createRng } from '../engine'
import type { GameState } from '../engine'
import type { Policy } from './policy'

const MAX_STEPS = 400

/** Juega la partida hasta el final con la política dada. */
export function playOut(start: GameState, policy: Policy, rng: () => number): GameState {
  let state = start
  for (let step = 0; step < MAX_STEPS && state.status === 'playing'; step++) {
    const result = applyAction(state, policy(state, rng))
    if (!result.ok) break
    state = result.state
  }
  return state
}

export interface GameResult {
  readonly seed: number
  readonly won: boolean
  readonly score: number
  readonly zones: number
  readonly curses: number
  readonly flees: number
  readonly recalls: number
}

export function simulateGame(seed: number, policy: Policy, hardMode = false): GameResult {
  // Dos generadores distintos: uno baraja la baraja, otro desempata decisiones.
  const final = playOut(createGame(seed, { hardMode }), policy, createRng(seed ^ 0x9e3779b9))
  const count = (type: string) => final.log.filter((event) => event.type === type).length
  return {
    seed,
    won: final.status === 'won',
    score: computeScore(final) ?? 0,
    zones: final.zonesCompleted,
    curses: count('curse-applied'),
    flees: count('fled'),
    recalls: count('recalled'),
  }
}

export interface Summary {
  readonly games: number
  readonly winRate: number
  readonly averageScore: number
  readonly averageZones: number
  readonly cursesPerGame: number
  readonly fleesPerGame: number
}

export function summarize(results: readonly GameResult[]): Summary {
  const games = results.length
  const mean = (pick: (r: GameResult) => number) =>
    games === 0 ? 0 : results.reduce((sum, r) => sum + pick(r), 0) / games
  return {
    games,
    winRate: mean((r) => (r.won ? 1 : 0)),
    averageScore: mean((r) => r.score),
    averageZones: mean((r) => r.zones),
    cursesPerGame: mean((r) => r.curses),
    fleesPerGame: mean((r) => r.flees + r.recalls),
  }
}

/** Simula `games` partidas con semillas consecutivas (repetible). */
export function runBatch(games: number, policy: Policy, hardMode = false, firstSeed = 1): Summary {
  const results = Array.from({ length: games }, (_, i) => simulateGame(firstSeed + i, policy, hardMode))
  return summarize(results)
}
