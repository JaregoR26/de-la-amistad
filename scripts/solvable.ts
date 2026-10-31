/**
 * ¿Cuántas semillas se pueden ganar si conoces el orden de la baraja?
 *   npm run solvable                 (semillas 1 a 60)
 *   npm run solvable -- --seeds 100
 */
import { solveSeed } from '../src/advisor'

const argIndex = process.argv.indexOf('--seeds')
const seeds = argIndex >= 0 ? Number(process.argv[argIndex + 1]) : 60
if (!Number.isInteger(seeds) || seeds <= 0) throw new Error('--seeds debe ser un entero positivo')

const rows: Array<Record<string, string | number>> = []
for (const hardMode of [false, true]) {
  const tally = { win: 0, lose: 0, unknown: 0 }
  for (let seed = 1; seed <= seeds; seed++) tally[solveSeed(seed, hardMode).result]++
  rows.push({
    modo: hardMode ? 'difícil' : 'normal',
    semillas: seeds,
    'ganables': tally.win,
    'imposibles': tally.lose,
    'sin resolver': tally.unknown,
    'ganables %': +((100 * tally.win) / seeds).toFixed(1),
  })
}
console.table(rows)
