import { useState } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { Chronicle } from '../components/Chronicle'
import { Dawn } from '../components/Dawn'
import { EscapeControls } from '../components/EscapeControls'
import { StatusPanel } from '../components/StatusPanel'
import { ZoneBoard } from '../components/ZoneBoard'
import { applyAction } from '../engine'
import type { GameAction } from '../engine'
import { createPracticeGame } from './practiceGame'
import { sameAction, STEPS } from './script'
import { TutorialOverlay } from './TutorialOverlay'

interface TutorialScreenProps {
  /** completed = true si llegó al final; false si lo saltó. */
  readonly onExit: (completed: boolean) => void
}

/**
 * Tablero de práctica con su propia partida: no toca la partida real. Solo deja pasar la
 * jugada que pide el paso actual; el resto lo bloquea el velo del overlay.
 */
export function TutorialScreen({ onExit }: TutorialScreenProps) {
  const [game, setGame] = useState(createPracticeGame)
  const [index, setIndex] = useState(0)
  const step = STEPS[index]

  const next = () => {
    if (index + 1 >= STEPS.length) onExit(true)
    else setIndex(index + 1)
  }

  const perform = (action: GameAction) => {
    if (!step?.action || !sameAction(step.action, action)) return
    const result = applyAction(game, action)
    if (!result.ok) return
    setGame(result.state)
    next()
  }

  if (!step) return null

  return (
    <>
      <Container as="main" className="py-4 position-relative">
        <h1 className="hero-line mb-4">Práctica: aguanta hasta el amanecer.</h1>
        <Row className="g-4">
          <Col lg={8}>
            <Dawn game={game} />
            <ZoneBoard
              game={game}
              onPlay={(cardId, useWeapon) => perform({ type: 'PLAY_CARD', cardId, useWeapon })}
            />
          </Col>
          <Col lg={4} className="d-flex flex-column gap-3">
            <StatusPanel game={game} />
            <EscapeControls
              game={game}
              onFlee={() => perform({ type: 'FLEE' })}
              onRecall={() => perform({ type: 'RECALL' })}
            />
            <Chronicle log={game.log} />
          </Col>
        </Row>
      </Container>
      <TutorialOverlay
        step={step}
        index={index}
        total={STEPS.length}
        layoutKey={game.log.length}
        onNext={next}
        onSkip={() => onExit(false)}
      />
    </>
  )
}
