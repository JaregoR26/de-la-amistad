import { useId } from 'react'
import { cardsRemaining, dawnProgress } from '../engine'
import type { GameState } from '../engine'

/** Mezcla dos colores hex (#rrggbb); t = 0 devuelve a, t = 1 devuelve b. */
function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const channel = (shift: number) =>
    Math.round(((pa >> shift) & 255) * (1 - t) + ((pb >> shift) & 255) * t)
  return `rgb(${channel(16)}, ${channel(8)}, ${channel(0)})`
}

const STARS: ReadonlyArray<readonly [number, number]> = [
  [18, 8], [42, 18], [66, 6], [104, 14], [128, 7], [148, 20],
]

export function Dawn({ game }: { readonly game: GameState }) {
  const skyId = useId().replace(/:/g, '')
  const remaining = cardsRemaining(game)
  const p = dawnProgress(game)

  const skyTop = mix('#070d0c', '#46607a', p)
  const skyBottom = mix('#10201c', '#f0b878', p)
  const sun = mix('#b9794a', '#f6d38a', p)
  const water = mix('#0a1412', '#2f5254', p)
  const ridge = mix('#050908', '#1a2b2b', p)
  const starOpacity = Math.max(0, 1 - p * 1.6)
  const sunOffset = (1 - p) * 27 // empieza escondido bajo la cresta y sube

  return (
    <div className="dawn d-flex align-items-center gap-3 mb-4">
      <svg
        className="dawn__svg"
        viewBox="0 0 160 64"
        role="img"
        aria-label={`Amanecer: faltan ${remaining} cartas`}
      >
        <defs>
          <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={skyTop} />
            <stop offset="1" stopColor={skyBottom} />
          </linearGradient>
        </defs>
        <rect width="160" height="64" fill={`url(#${skyId})`} />
        {STARS.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="#e6dfc9" opacity={starOpacity} />
        ))}
        <g className="dawn__sun" style={{ transform: `translateY(${sunOffset}px)` }}>
          <circle cx="80" cy="27" r="18" fill={sun} opacity={0.22 * p} />
          <circle cx="80" cy="27" r="10" fill={sun} />
        </g>
        <path d="M0 44 L0 41 L35 39 L70 41 L90 40 L125 38 L160 40 L160 44 Z" fill={ridge} />
        <rect y="44" width="160" height="20" fill={water} />
        <g fill={sun} opacity={0.6 * p}>
          <rect x="70" y="47" width="20" height="1.6" />
          <rect x="73" y="51" width="14" height="1.6" />
          <rect x="76" y="55" width="8" height="1.6" />
        </g>
      </svg>
      <p className="mb-0">
        {remaining === 1 ? 'Falta ' : 'Faltan '}
        <strong>{remaining}</strong>
        {remaining === 1 ? ' carta' : ' cartas'} para el amanecer.
      </p>
    </div>
  )
}