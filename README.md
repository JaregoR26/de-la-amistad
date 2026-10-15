# De la Amistad

Juego de cartas de supervivencia (roguelike solitario) ambientado de noche en la Presa de la Amistad.
Basado en **Scoundrel**, de Zach Gage y Kurt Bieg.

## Stack

React 19 + TypeScript (strict) + Vite, Bootstrap 5.3 (react-bootstrap) con tema oscuro propio, Vitest.

## Comandos

```bash
npm install
npm run dev        # servidor de desarrollo
npm test           # pruebas del motor
npm run typecheck  # TypeScript
npm run lint       # oxlint
npm run build      # build de producción en dist/
```

## Arquitectura

```
src/
  engine/     Reglas en TypeScript puro (sin React ni DOM). Se prueba aislado.
    rules.ts    applyAction(state, action) -> { ok, state } | { ok: false, error }
                getLegalActions(state), previewDamage/previewHeal para la UI
    deck.ts     baraja de 44 cartas y barajado determinista por semilla
    curses.ts   qué maldición impone cada figura de picas
    scoring.ts  puntuación
  content/    Textos en español (nombres de cartas, mensajes, efectos).
  hooks/      useGame: useReducer sobre el motor.
  components/ UI con react-bootstrap.
  styles/     theme.css: variables de Bootstrap + paleta del juego.
```

Principios: el estado es inmutable, el motor es puro y determinista (misma semilla, misma partida),
y la UI solo muestra lo que el motor declara legal. Eso deja listo el punto de enlace para el asistente
de IA: `getLegalActions(state)` entrega los movimientos válidos para el modelo.

## Reglas propias (diferencias con Scoundrel)

- Tréboles = fauna real; picas 2-10 = apariciones que hacen daño; J, Q, K y A de picas = maldiciones
  (no hacen daño; duran solo la zona donde aparece la carta).
- Huir guarda la zona en un marcador (solo cabe una) y reparte una nueva. Regresar trae la zona guardada
  (el array se vacía) y las cartas de la zona que dejas se ponen arriba del mazo. No se puede huir dos zonas seguidas. Si mazo y mesa se vacían con una zona guardada,
  esa zona vuelve como la última.
- Los efectos concretos de las maldiciones están en `engine/curses.ts` y `content/es.ts`: son una propuesta
  inicial para ajustar al prototipo de Godot.
