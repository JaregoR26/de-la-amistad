import { Col, Row } from 'react-bootstrap'
import { picksRemaining } from '../engine'
import type { GameState } from '../engine'
import { PlayingCard } from './PlayingCard'

interface ZoneBoardProps {
  readonly game: GameState
  readonly onPlay: (cardId: string, useWeapon: boolean) => void
}

export function ZoneBoard({ game, onPlay }: ZoneBoardProps) {
  const remaining = picksRemaining(game)
  const heading =
    game.status === 'playing'
      ? `Zona ${game.zonesCompleted + 1}: te faltan ${remaining} ${remaining === 1 ? 'carta' : 'cartas'} por resolver`
      : `Zona ${game.zonesCompleted + 1}`

  return (
    <section aria-labelledby="zone-heading">
      <h2 id="zone-heading" className="h5 text-body-secondary mb-3">
        {heading}
      </h2>
      <Row xs={2} xl={4} className="g-2 g-md-3">
        {game.zone.map((card) => (
          <Col key={card.id}>
            <PlayingCard card={card} game={game} onPlay={onPlay} />
          </Col>
        ))}
      </Row>
    </section>
  )
}
