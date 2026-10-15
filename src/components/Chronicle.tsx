import { Card, ListGroup } from 'react-bootstrap'
import { describeEvent } from '../content/es'
import type { GameEvent } from '../engine'

const VISIBLE_EVENTS = 6

export function Chronicle({ log }: { readonly log: readonly GameEvent[] }) {
  const recent = log.slice(-VISIBLE_EVENTS).reverse()
  return (
    <Card as="section" aria-label="Lo que ha pasado">
      <Card.Body>
        <h2 className="h6">Lo que ha pasado</h2>
        {recent.length === 0 ? (
          <p className="text-body-secondary mb-0">Todavía no ha pasado nada. Elige una carta.</p>
        ) : (
          <ListGroup variant="flush" aria-live="polite">
            {recent.map((event, i) => (
              <ListGroup.Item
                // El log solo crece; el índice desde el final es estable para cada entrada.
                key={log.length - i}
                className={`px-0 bg-transparent chronicle__item${i === 0 ? ' fw-bold' : ''}`}
              >
                {describeEvent(event)}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  )
}
