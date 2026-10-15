import { Button, Modal } from 'react-bootstrap'
import { computeScore } from '../engine'
import type { GameState } from '../engine'

interface EndModalProps {
  readonly game: GameState
  readonly onNewGame: () => void
}

export function EndModal({ game, onNewGame }: EndModalProps) {
  const won = game.status === 'won'
  return (
    <Modal show={game.status !== 'playing'} backdrop="static" keyboard={false} centered>
      <Modal.Header>
        <Modal.Title as="h2">{won ? 'Amanece' : 'La presa te alcanzó'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          {won
            ? 'Sobreviviste hasta el amanecer. Nadie te va a creer lo que viste.'
            : 'Nadie sabrá dónde te quedaste. Los enemigos que no alcanzaste a vencer cuentan en tu contra.'}
        </p>
        <p className="fs-4 mb-0">
          Puntaje: <strong>{computeScore(game)}</strong>
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="warning" onClick={onNewGame}>
          Nueva partida
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
