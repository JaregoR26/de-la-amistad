import type { CSSProperties } from 'react'
import { cardsRemaining, dawnProgress } from '../engine'
import type { GameState } from '../engine'

export function Dawn({ game }: { readonly game: GameState }) {
  const remaining = cardsRemaining(game)
  const p = dawnProgress(game)

  return (
    <div className="dawn d-flex align-items-center gap-3 mb-4" data-tutorial-target="dawn">
      <span className="dawn__line" aria-hidden="true" style={{ '--p': p.toFixed(3) } as CSSProperties}>
        <span className="dawn__track" />
        <span className="dawn__fill" />
        <span className="dawn__sun" />
      </span>
      <p className="mb-0">
        {remaining === 1 ? 'Falta ' : 'Faltan '}
        <strong>{remaining}</strong>
        {remaining === 1 ? ' carta' : ' cartas'} para el amanecer.
      </p>
    </div>
  )
}