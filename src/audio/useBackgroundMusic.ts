import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Música de fondo en loop.
 *
 * Los archivos viven en src/assets/audio/ con el nombre De-La-Amistad-BG-Music.<ext>.
 * Vite los procesa (nombre con hash y ruta base correcta, también en /de-la-amistad/).
 * Puedes poner uno o varios formatos; el navegador usa el primero que soporte:
 * ogg (loop sin pausa) > mp3 > m4a > wav (el más pesado).
 */
const FILES = import.meta.glob<string>('../assets/audio/De-La-Amistad-BG-Music.*', {
  eager: true,
  query: '?url',
  import: 'default',
})

const FORMATS = [
  { ext: 'ogg', mime: 'audio/ogg; codecs="vorbis"' },
  { ext: 'mp3', mime: 'audio/mpeg' },
  { ext: 'm4a', mime: 'audio/mp4' },
  { ext: 'wav', mime: 'audio/wav' },
] as const

const STORAGE_KEY = 'de-la-amistad:music'
const VOLUME = 0.4
const FADE_MS = 1800
const GESTURE_EVENTS = ['pointerdown', 'keydown'] as const

function pickSource(probe: HTMLAudioElement): string | null {
  for (const { ext, mime } of FORMATS) {
    const entry = Object.entries(FILES).find(([path]) => path.toLowerCase().endsWith(`.${ext}`))
    if (entry && probe.canPlayType(mime) !== '') return entry[1]
  }
  return null
}

function createAudio(): HTMLAudioElement | null {
  const audio = new Audio()
  const source = pickSource(audio)
  if (!source) return null
  audio.src = source
  audio.loop = true
  audio.preload = 'auto'
  audio.volume = 0
  return audio
}

/** La preferencia se recuerda entre visitas. Por defecto la música está activada. */
function readPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

function savePreference(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off')
  } catch {
    // Sin almacenamiento (modo privado): la preferencia solo dura la sesión.
  }
}

/** Sube el volumen poco a poco. Devuelve la función que cancela el fundido. */
function fadeTo(audio: HTMLAudioElement, target: number, ms: number): () => void {
  const from = audio.volume
  const startedAt = performance.now()
  const id = window.setInterval(() => {
    const progress = Math.min(1, (performance.now() - startedAt) / ms)
    audio.volume = from + (target - from) * progress
    if (progress === 1) window.clearInterval(id)
  }, 50)
  return () => window.clearInterval(id)
}

export function useBackgroundMusic() {
  const [enabled, setEnabled] = useState(readPreference)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Si no hay archivos de audio en el proyecto, el botón no se muestra y no pasa nada.
  const available = Object.keys(FILES).length > 0

  useEffect(() => {
    if (!available || !enabled) return

    const audio = (audioRef.current ??= createAudio())
    if (!audio) return

    let cancelFade = () => {}
    let resumeWhenVisible = false

    const start = () => {
      audio.volume = 0
      audio
        .play()
        .then(() => {
          cancelFade()
          cancelFade = fadeTo(audio, VOLUME, FADE_MS)
        })
        // Los navegadores no dejan sonar nada hasta que la persona toca la página.
        .catch(armGesture)
    }

    const onGesture = () => {
      GESTURE_EVENTS.forEach((name) => window.removeEventListener(name, onGesture))
      start()
    }
    function armGesture() {
      GESTURE_EVENTS.forEach((name) => window.addEventListener(name, onGesture, { passive: true }))
    }

    // Con la pestaña en segundo plano la música se pausa y vuelve al regresar.
    const onVisibility = () => {
      if (document.hidden && !audio.paused) {
        resumeWhenVisible = true
        audio.pause()
      } else if (!document.hidden && resumeWhenVisible) {
        resumeWhenVisible = false
        void audio.play().catch(() => {})
      }
    }

    document.addEventListener('visibilitychange', onVisibility)
    start()

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      GESTURE_EVENTS.forEach((name) => window.removeEventListener(name, onGesture))
      cancelFade()
      audio.pause()
    }
  }, [available, enabled])

  const toggle = useCallback(() => {
    const next = !enabled
    savePreference(next)
    setEnabled(next)
  }, [enabled])

  return { available, enabled, toggle }
}