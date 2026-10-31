/**
 * Ilustraciones de las cartas.
 *
 * Guarda cada dibujo en src/assets/cards/ con el id de la carta como nombre
 * (por ejemplo clubs-3.webp, spades-7.png). Formatos: webp, png, jpg, avif, svg.
 * Las cartas sin archivo muestran su glifo provisional; no hay que tocar código.
 */
const modules = import.meta.glob<string>('../assets/cards/*.{webp,png,jpg,jpeg,avif,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})

const byId = new Map<string, string>()
for (const [path, url] of Object.entries(modules)) {
  const id = path.split('/').pop()?.replace(/\.[^.]+$/, '')
  if (id) byId.set(id, url)
}

export const cardArt = (id: string): string | undefined => byId.get(id)
