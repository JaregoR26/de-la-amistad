import { rankLabel } from '../engine/cards'
import { curseForCard } from '../engine/curses'
import type { Card, CardKind, CurseId, GameEvent, RuleErrorCode, Suit } from '../engine/types'

/** Nombre de cada carta. El contenido vive aquí, separado de las reglas. */
const CARD_NAMES: Readonly<Record<string, string>> = {
  // Tréboles: fauna real de la región
  'clubs-2': 'Alacrán',
  'clubs-3': 'Araña violinista',
  'clubs-4': 'Mapache rabioso',
  'clubs-5': 'Coralillo',
  'clubs-6': 'Perro feral',
  'clubs-7': 'Coyote',
  'clubs-8': 'Mocasín de agua',
  'clubs-9': 'Jabalí',
  'clubs-10': 'Jauría de perros ferales',
  'clubs-11': 'Puma',
  'clubs-12': 'Oso negro',
  'clubs-13': 'Bagre colosal',
  'clubs-14': 'Cascabel centenaria',
  // Picas: apariciones
  'spades-2': 'Luz mala',
  'spades-3': 'Voz entre los carrizos',
  'spades-4': 'Sombra bajo el agua',
  'spades-5': 'Perro negro',
  'spades-6': 'Duende',
  'spades-7': 'Ahogado de la presa',
  'spades-8': 'Chupacabras',
  'spades-9': 'Bruja de la orilla',
  'spades-10': 'Alma en pena',
  'spades-11': 'El Charro Negro',
  'spades-12': 'La Llorona',
  'spades-13': 'El Nahual',
  'spades-14': 'La Lechuza',
  // Diamantes: armas improvisadas
  'diamonds-2': 'Piedra afilada',
  'diamonds-3': 'Navaja',
  'diamonds-4': 'Remo roto',
  'diamonds-5': 'Machete',
  'diamonds-6': 'Tubo de acero',
  'diamonds-7': 'Pico de minero',
  'diamonds-8': 'Hacha',
  'diamonds-9': 'Carabina vieja',
  'diamonds-10': 'Arpón',
  // Corazones: remedios
  'hearts-2': 'Pan dulce',
  'hearts-3': 'Café de olla',
  'hearts-4': 'Ramo de ruda',
  'hearts-5': 'Burrito de machaca',
  'hearts-6': 'Veladora encendida',
  'hearts-7': 'Medalla bendita',
  'hearts-8': 'Té de gordolobo',
  'hearts-9': 'Termo de caldo',
  'hearts-10': 'Escapulario',
}

export const cardName = (card: Card): string => CARD_NAMES[card.id] ?? card.id

export const SUIT_NAME: Record<Suit, string> = {
  spades: 'Picas',
  clubs: 'Tréboles',
  diamonds: 'Diamantes',
  hearts: 'Corazones',
}

export const cardAriaLabel = (card: Card): string =>
  `${rankLabel(card.rank)} de ${SUIT_NAME[card.suit]}: ${cardName(card)}`

export const KIND_LABEL: Record<CardKind, string> = {
  weapon: 'Arma',
  potion: 'Remedio',
  fauna: 'Fauna',
  spirit: 'Aparición',
  curse: 'Maldición',
}

/** Efectos de las maldiciones (propuesta inicial; ver engine/curses.ts). */
export const CURSES: Record<CurseId, { name: string; effect: string }> = {
  pacto: {
    name: 'Pacto del Charro',
    effect: 'Tu arma se niega a responder: peleas a mano limpia.',
  },
  llanto: {
    name: 'El llanto',
    effect: 'Los remedios curan la mitad.',
  },
  bestia: {
    name: 'Piel de bestia',
    effect: 'La fauna te hace 2 de daño extra.',
  },
  'mal-agüero': {
    name: 'Mal agüero',
    effect: 'Tu arma pierde 2 de durabilidad en esta zona.',
  },
}

export const curseOfCard = (card: Card): { name: string; effect: string } | null => {
  const id = curseForCard(card)
  return id ? CURSES[id] : null
}

export const RULE_ERROR: Record<RuleErrorCode, string> = {
  GAME_OVER: 'La partida terminó.',
  CARD_NOT_IN_ZONE: 'Esa carta no está en la mesa.',
  WEAPON_UNAVAILABLE: 'No tienes arma.',
  WEAPON_TOO_WORN: 'Tu arma ya no sirve contra algo de ese valor.',
  WEAPON_BOUND: 'El Pacto del Charro inutiliza tu arma.',
  NEEDS_FULL_ZONE: 'Solo puedes huir con las 4 cartas intactas.',
  BOOKMARK_OCCUPIED: 'Ya tienes una zona guardada.',
  NO_BOOKMARK: 'No hay ninguna zona guardada.',
  ALREADY_FLED: 'No puedes huir dos zonas seguidas.',
  DECK_TOO_SMALL: 'Ya no queda mazo para una zona nueva.',
}

export function describeEvent(event: GameEvent): string {
  switch (event.type) {
    case 'weapon-equipped':
      return event.replaced
        ? `Sueltas ${cardName(event.replaced)} y empuñas ${cardName(event.card)}.`
        : `Empuñas ${cardName(event.card)}.`
    case 'potion':
      if (event.wasted) return `${cardName(event.card)}: ya tomaste algo en esta zona, no te hace efecto.`
      return event.healed > 0
        ? `${cardName(event.card)}: recuperas ${event.healed} de vida.`
        : `${cardName(event.card)}: no tienes heridas que curar.`
    case 'fight':
      return event.damage === 0
        ? `${cardName(event.card)} cae sin tocarte.`
        : `${cardName(event.card)} te hiere: −${event.damage}.`
    case 'curse-applied':
      return `${cardName(event.card)} te marca con ${CURSES[event.curse].name.toLowerCase()}.`
    case 'curse-expired':
      return `Se disipa ${CURSES[event.curse].name.toLowerCase()}.`
    case 'fled':
      return 'Retrocedes entre los carrizos y guardas la zona para después.'
    case 'recalled':
      return 'Vuelves sobre tus pasos a la zona guardada.'
    case 'forced-return':
      return 'La zona que dejaste atrás te alcanza. No hay otra salida.'
    case 'zone-completed':
      return `Zona ${event.zonesCompleted} superada.`
    case 'game-over':
      return event.status === 'won'
        ? 'Amanece. Sobreviviste a la noche.'
        : 'La presa se queda contigo.'
  }
}

