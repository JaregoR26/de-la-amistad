import { Form } from 'react-bootstrap'

interface HardModeSwitchProps {
  readonly hardMode: boolean
  /** true cuando la partida ya empezó: el modo solo se cambia en una partida nueva. */
  readonly locked: boolean
  readonly onChange: (value: boolean) => void
}

export function HardModeSwitch({ hardMode, locked, onChange }: HardModeSwitchProps) {
  const rule = hardMode
    ? 'Las maldiciones te siguen a la zona siguiente.'
    : 'Las maldiciones duran solo la zona donde aparecen.'

  return (
    <Form.Group className="mb-4">
      <Form.Check
        type="switch"
        id="hard-mode"
        label="Modo difícil"
        checked={hardMode}
        disabled={locked}
        onChange={(event) => onChange(event.target.checked)}
        aria-describedby="hard-mode-help"
      />
      <Form.Text id="hard-mode-help" muted>
        {rule}
        {locked && ' Puedes cambiarlo al empezar una partida nueva.'}
      </Form.Text>
    </Form.Group>
  )
}