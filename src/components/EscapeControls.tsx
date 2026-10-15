import { Button, Card } from 'react-bootstrap'
import { RULE_ERROR } from '../content/es'
import { applyAction } from '../engine'
import type { GameState } from '../engine'

interface EscapeControlsProps {
  readonly game: GameState
  readonly onFlee: () => void
  readonly onRecall: () => void
}

export function EscapeControls({ game, onFlee, onRecall }: EscapeControlsProps) {
  const flee = applyAction(game, { type: 'FLEE' })
  const recall = applyAction(game, { type: 'RECALL' })
  // Solo mostramos el motivo del botón que tiene sentido en este momento.
  const reason = game.bookmark ? (recall.ok ? null : RULE_ERROR[recall.error]) : flee.ok ? null : RULE_ERROR[flee.error]

  return (
    <Card as="section" aria-label="Escapar">
      <Card.Body className="d-flex flex-column gap-2">
        <h2 className="h6 mb-0">Escapar</h2>
        <div className="d-grid gap-2">
          <Button variant="outline-secondary" disabled={!flee.ok} onClick={onFlee}>
            Huir: guardar esta zona
          </Button>
          <Button variant="outline-secondary" disabled={!recall.ok} onClick={onRecall}>
            Regresar a la zona guardada
          </Button>
        </div>
        {reason && <p className="small text-body-secondary mb-0">{reason}</p>}
      </Card.Body>
    </Card>
  )
}
