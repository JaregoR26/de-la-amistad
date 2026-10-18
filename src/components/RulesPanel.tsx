import { Accordion, Button, Offcanvas } from "react-bootstrap";

interface RulesPanelProps {
  readonly show: boolean;
  readonly onHide: () => void;
  readonly onStartTutorial: () => void;
}

export function RulesPanel({ show, onHide, onStartTutorial }: RulesPanelProps) {
  return (
    <Offcanvas
      show={show}
      onHide={onHide}
      placement="end"
      aria-labelledby="rules-title"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title id="rules-title" as="h2">
          Cómo sobrevivir
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <div className="d-grid mb-3">
          <Button variant="warning" onClick={onStartTutorial}>
            Ver el tutorial interactivo
          </Button>
        </div>
        <Accordion defaultActiveKey="0" flush>
          <Accordion.Item eventKey="0">
            <Accordion.Header>La noche</Accordion.Header>
            <Accordion.Body>
              <p>
                Empiezas con 20 de vida. La mesa muestra una zona de 4 cartas.
                Debes resolver 3 de ellas; la cuarta se queda en la mesa y se le
                suman cartas nuevas para la zona siguiente.
              </p>
              <p className="mb-0">
                Ganas si pasas por todo el mazo con vida. Si tu vida llega a 0,
                la presa gana.
              </p>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>Las cartas</Accordion.Header>
            <Accordion.Body>
              <ul className="mb-0">
                <li>
                  <strong>Diamantes (armas):</strong> restan su valor al daño de
                  un enemigo. El arma solo sirve contra enemigos de menor valor
                  que el último que derrotó.
                </li>
                <li>
                  <strong>Corazones (remedios):</strong> curan su valor, hasta
                  20. Solo cura el primero de cada zona.
                </li>
                <li>
                  <strong>Tréboles (fauna):</strong> animales reales. Te hacen
                  daño igual a su valor.
                </li>
                <li>
                  <strong>Picas (apariciones):</strong> del 2 al 10 hacen daño
                  igual que la fauna. Las figuras y el as son maldiciones: no
                  hieren, pero cambian las reglas mientras dure la zona donde
                  aparecen.
                </li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="2">
            <Accordion.Header>Huir</Accordion.Header>
            <Accordion.Body>
              <p>
                Con las 4 cartas intactas puedes huir: la zona se guarda y
                recibes una nueva. No puedes huir dos zonas seguidas ni tener
                dos zonas guardadas.
              </p>
              <p className="mb-0">
                Para regresar, la zona guardada vuelve a la mesa y las cartas de
                la zona que dejas atrás se ponen arriba del mazo: no se pierde
                ninguna. Si el mazo y la mesa se vacían con una zona guardada,
                esa zona vuelve como la última.
              </p>
            </Accordion.Body>
            <Accordion.Item eventKey="4">
              <Accordion.Header>Modo difícil</Accordion.Header>
              <Accordion.Body>
                Las maldiciones no se acaban con la zona donde aparecen: te
                siguen también a la zona siguiente. Se activa antes de tu
                primera jugada.
              </Accordion.Body>
            </Accordion.Item>
          </Accordion.Item>
          <Accordion.Item eventKey="3">
            <Accordion.Header>Puntuación</Accordion.Header>
            <Accordion.Body>
              <p>
                Si ganas, tu puntaje es tu vida restante. Si terminas con 20 de
                vida y la última carta fue un remedio, sumas también su valor.
              </p>
              <p className="mb-0">
                Si mueres, tu puntaje es negativo: el valor de todos los
                enemigos que quedaron.
              </p>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
        <p className="small text-body-secondary mt-4 mb-0">
          Basado en Scoundrel, de Zach Gage y Kurt Bieg.
        </p>
      </Offcanvas.Body>
    </Offcanvas>
  );
}
