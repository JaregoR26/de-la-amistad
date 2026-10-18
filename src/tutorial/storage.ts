const KEY = 'de-la-amistad:tutorial'

/** El tutorial se ofrece una sola vez por navegador. */
export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(KEY) === 'done'
  } catch {
    return false
  }
}

export function markTutorialSeen(): void {
  try {
    localStorage.setItem(KEY, 'done')
  } catch {
    // Sin almacenamiento (modo privado): se volverá a ofrecer en la próxima visita.
  }
}
