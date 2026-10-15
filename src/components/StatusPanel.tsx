import { Badge, Card, ListGroup, ProgressBar } from 'react-bootstrap'
import { cardName, CURSES } from '../content/es'
import { MAX_HEALTH, weaponLimit } from '../engine'
import type { GameState } from '../engine'

export function StatusPanel({ game }: { readonly game: GameState }) {
  const lowHealth = game.health <= 6
  const weapon = game.weapon
  const limit = weaponLimit(game)

  return (
    <Card as="section" aria-label="Estado del jugador">
      <Card.Body className="d-flex flex-column gap-3">
        <div>
          <div className="d-flex justify-content-between align-items-baseline mb-1">
            <h2 className="h6 mb-0">Vida</h2>
            <span className="fs-5 fw-bold">
              {game.health}/{MAX_HEALTH}
            </span>
          </div>
          <ProgressBar
            now={game.health}
            max={MAX_HEALTH}
            variant={lowHealth ? 'danger' : 'warning'}
            aria-label="Vida restante"
          />
        </div>

        <div>
          <h2 className="h6">Arma</h2>
          {weapon ? (
            <p className="mb-0">
              {cardName(weapon.card)} (ataque {weapon.card.rank}).{' '}
              <span className="text-body-secondary">
                {limit === null
                  ? 'Sin desgaste: sirve contra cualquier cosa.'
                  : `Solo sirve contra valores menores a ${limit}.`}
              </span>
            </p>
          ) : (
            <p className="text-body-secondary mb-0">Sin arma. Todo se pelea a mano.</p>
          )}
        </div>

        <div>
          <h2 className="h6">Maldiciones</h2>
          {game.curses.length === 0 ? (
            <p className="text-body-secondary mb-0">Nada te sigue, por ahora.</p>
          ) : (
            <ListGroup variant="flush">
              {game.curses.map((curse) => (
                <ListGroup.Item key={curse.id} className="px-0 bg-transparent">
                  <Badge bg="info" text="dark" className="me-2">
                    {CURSES[curse.id].name}
                  </Badge>
                  <span className="small">{CURSES[curse.id].effect}</span>
                  <div className="small text-body-secondary">Hasta terminar esta zona.</div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Badge bg="secondary">En el mazo: {game.deck.length}</Badge>
          <Badge bg={game.bookmark ? 'warning' : 'secondary'} text={game.bookmark ? 'dark' : undefined}>
            {game.bookmark ? 'Zona guardada' : 'Sin zona guardada'}
          </Badge>
        </div>
      </Card.Body>
    </Card>
  )
}
