import { useState } from "react";
import type { CSSProperties } from "react";
import { Button, Col, Container, Navbar, Row } from "react-bootstrap";
import { Chronicle } from "./components/Chronicle";
import { EndModal } from "./components/EndModal";
import { EscapeControls } from "./components/EscapeControls";
import { RulesPanel } from "./components/RulesPanel";
import { StatusPanel } from "./components/StatusPanel";
import { ZoneBoard } from "./components/ZoneBoard";
import { MAX_HEALTH } from "./engine";
import { useGame } from "./hooks/useGame";
import { Dawn } from "./components/Dawn";
import { HardModeSwitch } from "./components/HardModeSwitch";
import { MusicToggle } from "./components/MusicToggle";
import { useBackgroundMusic } from "./audio/useBackgroundMusic";

/** Radio de la luz de la linterna: se cierra conforme baja la vida. */
const lanternLight = (health: number): number =>
  35 + (health / MAX_HEALTH) * 65;

export default function App() {
  const { game, playCard, flee, recall, newGame, setHardMode } = useGame();
  const [showRules, setShowRules] = useState(false);
  const music = useBackgroundMusic();

  const lightStyle = {
    "--light": `${lanternLight(game.health)}%`,
  } as CSSProperties;

  return (
    <div
      className="night-table"
      style={lightStyle}
      data-low-health={game.health <= 6}
    >
      <Navbar className="border-bottom position-relative">
        <Container>
          <div className="brand-block">
            <a
              className="studio-link"
              href="/"
              aria-label="Volver a Tlalocan Studios"
            >
              <span aria-hidden="true">‹</span> Tlalocan Studios
            </a>
            <Navbar.Brand className="brand">De la Amistad</Navbar.Brand>
          </div>
          <div className="d-flex gap-2">
            {music.available && (
              <MusicToggle enabled={music.enabled} onToggle={music.toggle} />
            )}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setShowRules(true)}
            >
              Reglas
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={newGame}>
              Nueva partida
            </Button>
          </div>
        </Container>
      </Navbar>

      <Container as="main" className="py-4 position-relative">
        <h1 className="hero-line mb-3">
          Pasan de las 3 de la mañana y sigues en la presa.
        </h1>
        <HardModeSwitch
          hardMode={game.hardMode}
          locked={game.log.length > 0}
          onChange={setHardMode}
        />
        <Row className="g-4">
          <Col lg={8}>
            <Dawn game={game} />
            <ZoneBoard game={game} onPlay={playCard} />
          </Col>
          <Col lg={4} className="d-flex flex-column gap-3">
            <StatusPanel game={game} />
            <EscapeControls game={game} onFlee={flee} onRecall={recall} />
            <Chronicle log={game.log} />
          </Col>
        </Row>
      </Container>

      <footer className="container pb-4 small text-body-secondary position-relative">
        Un juego de <a href="/">Tlalocan Studios</a>. Basado en Scoundrel, de
        Zach Gage y Kurt Bieg. Musica de Alexis Bran.
      </footer>

      <RulesPanel show={showRules} onHide={() => setShowRules(false)} />
      <EndModal game={game} onNewGame={newGame} />
    </div>
  );
}
