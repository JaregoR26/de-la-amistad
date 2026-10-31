# De la Amistad

Juego de cartas de supervivencia, de una sola persona, ambientado de noche en la Presa de la
Amistad, en Ciudad Acuña. Sobrevives a serpientes venenosas, al chupacabras, a la Llorona, al
nahual y más, hasta que amanezca.

Un juego de [Tlalocan Studios](https://tlalocanstudios.com). Demo jugable en
`tlalocanstudios.com/de-la-amistad`. Basado en **Scoundrel**, de Zach Gage y Kurt Bieg.

## Cómo se juega

Empiezas con **20 de vida** y una baraja de **44 cartas**. La mesa muestra una **zona** de 4
cartas: resuelves 3 y la cuarta pasa a la zona siguiente. Ganas si pasas por toda la baraja con
vida; si llegas a 0, pierdes.

| Palo | Tipo | Qué hace |
| --- | --- | --- |
| Diamantes | Arma | Resta su valor al daño de un monstruo |
| Corazones | Remedio | Cura su valor, hasta 20. Solo cura el primero de cada zona |
| Tréboles | Fauna | Te hace daño igual a su valor |
| Picas 2 a 10 | Aparición | Te hace daño igual a su valor |
| J, Q, K y A de picas | Maldición | No hiere, pero cambia las reglas mientras dura la zona |

- **Desgaste del arma:** un arma solo sirve contra monstruos de valor menor al último que
  derrotó. Equipar otra arma reinicia el límite.
- **Maldiciones:** el Charro Negro inutiliza tu arma; la Llorona reduce a la mitad la curación; el
  Nahual suma 2 de daño a la fauna; la Lechuza le quita 2 de durabilidad al arma.
- **Huir:** con las 4 cartas intactas puedes guardar la zona y recibir una nueva. No puedes huir
  dos zonas seguidas ni tener dos zonas guardadas. **Regresar** trae la zona guardada y las cartas
  de la zona que dejas se ponen arriba del mazo. Si el mazo y la mesa se vacían con una zona
  guardada, esa zona vuelve como la última.
- **Modo difícil:** las maldiciones siguen también a la zona siguiente. Se activa antes de la
  primera jugada.
- **Puntuación:** si ganas, tu vida restante (con 20 de vida y un remedio como última carta, 20
  más su valor). Si pierdes, el valor de los enemigos que quedaron, en negativo.

## Stack

React 19 + TypeScript (estricto) + Vite, Bootstrap 5.3 (react-bootstrap) con tema oscuro propio y
Vitest. Sin servidor: todo corre en el navegador.

## Comandos

```bash
npm install
npm run dev          # desarrollo en http://localhost:5173
npm test             # pruebas (motor y tutorial)
npm run test:watch   # pruebas en modo observación
npm run typecheck    # TypeScript
npm run lint         # oxlint
npm run build        # build de producción en dist/
```

## Arquitectura

```
src/
  engine/       Reglas en TypeScript puro (sin React ni DOM). Se prueba aislado.
    rules.ts      applyAction(estado, acción) -> { ok, estado } | { ok: false, error }
                  getLegalActions, previewDamage, previewHeal, cardsRemaining, dawnProgress
    deck.ts       baraja de 44 cartas y barajado determinista por semilla
    curses.ts     qué maldición impone cada figura de picas
    scoring.ts    puntuación
    constants.ts  vida, tamaño de zona, duración y efectos de las maldiciones
  content/      Textos en español (nombres de cartas, maldiciones, mensajes del registro)
  hooks/        useGame: useReducer sobre el motor
  audio/        useBackgroundMusic: música de fondo en loop
  tutorial/     Tutorial interactivo con partida de práctica
  components/   UI con react-bootstrap (tablero, cartas, panel de estado, reglas, amanecer...)
  styles/       theme.css: variables de Bootstrap, paleta y estilos del juego
```

Principios: el estado es inmutable; el motor es puro y determinista (misma semilla, misma
partida); la interfaz solo ofrece lo que el motor declara legal. Por eso `getLegalActions(estado)`
queda listo como punto de enlace para un asistente de IA.

## Piezas del juego

- **Amanecer:** el contador "Faltan N cartas para el amanecer" y el dibujo del sol salen de
  `dawnProgress(estado)`, que va de 0 a 1 según las cartas que quedan.
- **Luz de linterna:** el fondo se oscurece al bajar la vida (`--lit` en `App.tsx`). Son dos capas
  estáticas que cambian de opacidad, para no repintar el fondo.
- **Tutorial:** se ofrece en la primera visita y siempre desde Reglas → "Ver el tutorial
  interactivo". Usa una partida de práctica con cartas fijas (`practiceGame.ts`) y un guion de
  pasos (`script.ts`). Cada paso resalta un elemento por su `data-tutorial-target` y solo deja pasar
  la jugada que pide. Una prueba juega el guion completo con el motor real: si cambias una regla y
  el tutorial se rompe, las pruebas fallan.
- **Música:** `useBackgroundMusic` toca la pista en loop, arranca con el primer clic o toque (los
  navegadores no permiten audio antes), con fundido de entrada. Hay un botón para silenciarla, se
  recuerda la elección y se pausa si la pestaña está en segundo plano.

## Música: cómo agregar o cambiar la pista

Los archivos van en `src/assets/audio/` con el nombre `De-La-Amistad-BG-Music.<extensión>`. Pon
**ogg y mp3** (el navegador usa el primero que soporte; ogg repite sin pausa). No subas el `.wav`
original: pesa mucho y Cloudflare Pages rechaza archivos de más de 25 MiB. Para convertir:

```bash
ffmpeg -i De-La-Amistad-BG-Music.wav -codec:a libvorbis -q:a 4 De-La-Amistad-BG-Music.ogg
ffmpeg -i De-La-Amistad-BG-Music.wav -codec:a libmp3lame -b:a 160k De-La-Amistad-BG-Music.mp3
```

Si no hay ningún archivo de audio, el botón de música no aparece y no pasa nada. El volumen
(`VOLUME`) y la duración del fundido (`FADE_MS`) están al inicio de `useBackgroundMusic.ts`. En
iPhone el volumen no se puede cambiar por código, así que conviene que la pista ya venga a un nivel
cómodo de fondo.

## Dónde cambiar cada cosa

| Qué | Dónde |
| --- | --- |
| Nombres de cartas, maldiciones y mensajes | `src/content/es.ts` |
| Reglas y valores (vida, zona, maldiciones) | `src/engine/` (sobre todo `constants.ts` y `curses.ts`) |
| Texto del panel de reglas | `src/components/RulesPanel.tsx` |
| Pasos y textos del tutorial | `src/tutorial/script.ts` |
| Cartas de la partida de práctica | `src/tutorial/practiceGame.ts` |
| Colores y estilos | `src/styles/theme.css` |
| Música | `src/assets/audio/` y `src/audio/useBackgroundMusic.ts` |

Al cambiar una regla, corre `npm test`: las pruebas del motor y las del tutorial avisan si algo
dejó de cuadrar.

## Publicación

El juego se publica **dentro de la web del estudio**, en `/de-la-amistad/`. El build de la landing
(`INCLUDE_GAME=true`) clona este repositorio y lo compila con `vite build --base=/de-la-amistad/`.
Por eso:

- Los archivos del juego deben usar rutas con la base de Vite: importa los recursos desde `src/`
  (como se hace con el audio) o usa `import.meta.env.BASE_URL`; no escribas rutas absolutas como
  `/imagen.png`.
- Para probar el build como se publica: `npx vite build --base=/de-la-amistad/`.
- El enlace "Tlalocan Studios" de la barra superior apunta a `/`, que en producción es la landing.
- **Subir cambios a este repositorio no actualiza el sitio por sí solo.** Hay que relanzar el
  despliegue de la landing, a mano o con el aviso automático (*deploy hook*). Los pasos están en el
  README de la landing, sección "El juego dentro de la web".

Este repositorio debe seguir siendo **público**: el build de la landing lo clona sin credenciales.

## Datos en el navegador

| Clave | Para qué |
| --- | --- |
| `de-la-amistad:music` | Si la música está activada o silenciada |
| `de-la-amistad:tutorial` | Si ya se ofreció el tutorial |

Para ver otra vez la invitación del tutorial, borra la segunda clave:
`localStorage.removeItem('de-la-amistad:tutorial')`.

## Créditos

- Basado en **Scoundrel**, de Zach Gage y Kurt Bieg.
- Música de fondo: creada por un amigo del estudio; su crédito aparece en el pie de página del
  juego.
- Tipografías IM Fell English y Atkinson Hyperlegible (vía Fontsource) y Bootstrap.

## Siguiente

- Arte de las cartas, fondos y efectos (las cartas buscarán su imagen por id, con el diseño actual
  como respaldo).
- Animaciones y sonidos enganchados a los eventos del motor.
- Guardar la partida en el navegador y mejores puntuaciones.
- Bot de simulación para equilibrar el modo normal y el difícil.
- Asistente de IA que sugiera el siguiente movimiento.
