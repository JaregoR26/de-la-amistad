import { Button, Modal } from 'react-bootstrap'

interface TutorialInviteProps {
  readonly show: boolean
  readonly onStart: () => void
  readonly onDismiss: () => void
}

/** Invitación que se muestra una sola vez, la primera visita. */
export function TutorialInvite({ show, onStart, onDismiss }: TutorialInviteProps) {
  return (
    <Modal show={show} onHide={onDismiss} centered aria-labelledby="tutorial-invite-title">
      <Modal.Header closeButton>
        <Modal.Title id="tutorial-invite-title" as="h2">
          ¿Primera vez en la presa?
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>Aprende a jugar en un minuto, probando las cartas tú mismo.</Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onDismiss}>
          Ya sé jugar
        </Button>
        <Button variant="warning" onClick={onStart}>
          Empezar tutorial
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
