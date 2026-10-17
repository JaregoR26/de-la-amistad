import { Button } from 'react-bootstrap'

interface MusicToggleProps {
  readonly enabled: boolean
  readonly onToggle: () => void
}

/** Botón de solo ícono (cabe en móvil junto a "Reglas" y "Nueva partida"). */
export function MusicToggle({ enabled, onToggle }: MusicToggleProps) {
  return (
    <Button
      variant="outline-secondary"
      size="sm"
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label="Música de fondo"
      title={enabled ? 'Silenciar la música' : 'Activar la música'}
      className="music-toggle"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path d="M3 9v6h4l5 4V5L7 9z" fill="currentColor" />
        {enabled ? (
          <path
            d="M16 8.5a5 5 0 0 1 0 7M18.6 6a8.6 8.6 0 0 1 0 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M16 9.5l5 5M21 9.5l-5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )}
      </svg>
    </Button>
  )
}