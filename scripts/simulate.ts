/**
 * Simulador de balance: juega miles de partidas con el motor real y reporta cuántas se ganan.
 *   npm run simulate                 (2000 partidas por política y modo)
 *   npm run simulate -- --games 5000
 */
import { heuristicPolicy, randomPolicy, runBatch } from '../src/advisor'
import type { Policy, Summary } from '../src/advisor'

const argIndex = process.argv.indexOf('--games')
const games = argIndex >= 0 ? Number(process.argv[argIndex + 1]) : 2000
if (!Number.isInteger(games) || games <= 0) throw new Error('--games debe ser un entero positivo')

const policies: ReadonlyArray<readonly [string, Policy]> = [
  ['azar', randomPolicy],
  ['reglas', heuristicPolicy],
]

const rows: Array<Record<string, string | number>> = []
for (const [name, policy] of policies) {
  for (const hardMode of [false, true]) {
    const s: Summary = runBatch(games, policy, hardMode)
    rows.push({
      política: name,
      modo: hardMode ? 'difícil' : 'normal',
      partidas: s.games,
      'victorias %': +(s.winRate * 100).toFixed(1),
      'puntaje medio': +s.averageScore.toFixed(1),
      'zonas medias': +s.averageZones.toFixed(1),
      'maldiciones por partida': +s.cursesPerGame.toFixed(2),
      'huidas por partida': +s.fleesPerGame.toFixed(2),
    })
  }
}
console.table(rows)
