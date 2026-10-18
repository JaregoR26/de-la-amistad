import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Button } from 'react-bootstrap'
import type { TutorialStep } from './script'

const PAD = 8
const COMPACT_WIDTH = 768

/** Un elemento "alto" (como la zona de cartas en el celular) deja el globo arriba para no taparlo. */
function isTall(rect: DOMRect): boolean {
  return window.innerWidth < COMPACT_WIDTH && rect.height > window.innerHeight * 0.45
}

/** Sigue la posición del elemento resaltado, también al hacer scroll o cambiar el tamaño. */
function useTargetRect(target: string, layoutKey: unknown): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null)

  useLayoutEffect(() => {
    const find = () => document.querySelector(`[data-tutorial-target="${target}"]`)
    let frame = 0

    const measure = () => {
      frame = 0
      setRect(find()?.getBoundingClientRect() ?? null)
    }
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure)
    }

    // Lleva el elemento a la parte alta de la pantalla para que el globo quepa debajo.
    const element = find()
    if (element) {
      const box = element.getBoundingClientRect()
      const offset = isTall(box) ? 150 : window.innerHeight * 0.28
      window.scrollTo({ top: Math.max(0, box.top + window.scrollY - offset), behavior: 'instant' })
    }
    measure()

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame !== 0) cancelAnimationFrame(frame)
    }
  }, [target, layoutKey])

  return rect
}

interface TutorialOverlayProps {
  readonly step: TutorialStep
  readonly index: number
  readonly total: number
  /** Cambia con cada jugada; sirve para volver a medir cuando el tablero se redibuja. */
  readonly layoutKey: unknown
  readonly onNext: () => void
  readonly onSkip: () => void
}

export function TutorialOverlay({ step, index, total, layoutKey, onNext, onSkip }: TutorialOverlayProps) {
  const rect = useTargetRect(step.target, layoutKey)
  const nextRef = useRef<HTMLButtonElement>(null)
  const needsAction = step.action !== undefined
  const isLast = index === total - 1

  useEffect(() => {
    nextRef.current?.focus({ preventScroll: true })
  }, [index])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onSkip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSkip])

  // El velo oscuro deja un hueco sobre el elemento: lo de fuera queda bloqueado, lo de dentro sigue clicable.
  const hole = rect
    ? {
        l: Math.max(0, rect.left - PAD),
        t: Math.max(0, rect.top - PAD),
        r: Math.min(window.innerWidth, rect.right + PAD),
        b: Math.min(window.innerHeight, rect.bottom + PAD),
      }
    : null

  const veilStyle: CSSProperties = hole
    ? {
        clipPath: `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${hole.l}px ${hole.t}px, ${hole.l}px ${hole.b}px, ${hole.r}px ${hole.b}px, ${hole.r}px ${hole.t}px, ${hole.l}px ${hole.t}px)`,
      }
    : {}

  const top = rect !== null && isTall(rect)
  const below = rect ? rect.bottom + 190 < window.innerHeight : true
  const coachStyle = {
    '--coach-x': `${rect ? Math.min(Math.max(12, rect.left + rect.width / 2 - 180), window.innerWidth - 372) : 12}px`,
    '--coach-y': `${rect ? (below ? rect.bottom + 16 : rect.top - 16) : 96}px`,
  } as CSSProperties

  return (
    <>
      <div className="tutorial-veil" style={veilStyle} aria-hidden="true" />
      {hole && (
        <div
          className="tutorial-ring"
          aria-hidden="true"
          style={{ left: hole.l, top: hole.t, width: hole.r - hole.l, height: hole.b - hole.t }}
        />
      )}
      <div
        className={`tutorial-coach ${top ? 'is-top' : below ? 'is-below' : 'is-above'}`}
        style={coachStyle}
        role="dialog"
        aria-label="Tutorial"
      >
        <p className="tutorial-coach__text" aria-live="polite">
          {step.text}
        </p>
        <div className="tutorial-coach__bar">
          <span className="small text-body-secondary">
            Paso {index + 1} de {total}
          </span>
          <div className="d-flex gap-2 align-items-center">
            <Button variant="link" size="sm" className="p-0 text-body-secondary" onClick={onSkip}>
              Saltar tutorial
            </Button>
            {!needsAction && (
              <Button ref={nextRef} variant="warning" size="sm" onClick={onNext}>
                {isLast ? 'Empezar a jugar' : 'Siguiente'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
