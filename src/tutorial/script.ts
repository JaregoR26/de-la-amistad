import type { GameAction } from '../engine'

/**
 * Guion del tutorial. Cada paso resalta un elemento (`target` = valor del atributo
 * data-tutorial-target) y, si trae `action`, solo avanza cuando la persona hace
 * exactamente esa jugada. Los pasos sin acción avanzan con "Siguiente".
 *
 * Los objetivos con forma "<idCarta>:<modo>" son botones de una carta:
 *   :play   Empuñar / Tomar / Enfrentar        :weapon  Atacar con arma
 *   :hand   Pelear a mano
 */
export interface TutorialStep {
  readonly id: string
  readonly target: string
  readonly text: string
  readonly action?: GameAction
}

export const STEPS: readonly TutorialStep[] = [
  {
    id: 'vida',
    target: 'health',
    text: 'Son las 3 de la mañana y tienes 20 de vida. Cuídala hasta el amanecer.',
  },
  {
    id: 'zona',
    target: 'zone',
    text: 'Cada zona trae 4 cartas. Resuelves 3 y la última pasa a la siguiente zona.',
  },
  {
    id: 'arma',
    target: 'diamonds-5:play',
    text: 'Un arma. Empúñala.',
    action: { type: 'PLAY_CARD', cardId: 'diamonds-5', useWeapon: false },
  },
  {
    id: 'ataque',
    target: 'clubs-9:weapon',
    text: 'Con arma, el monstruo te hiere menos. Atácalo.',
    action: { type: 'PLAY_CARD', cardId: 'clubs-9', useWeapon: true },
  },
  {
    id: 'desgaste',
    target: 'weapon',
    text: 'Ojo: ahora tu arma solo sirve contra monstruos más débiles que este.',
  },
  {
    id: 'remedio',
    target: 'hearts-4:play',
    text: 'Los remedios curan. Solo funciona el primero de cada zona.',
    action: { type: 'PLAY_CARD', cardId: 'hearts-4', useWeapon: false },
  },
  {
    id: 'maldicion',
    target: 'spades-12:play',
    text: 'Las maldiciones no hieren, pero cambian las reglas mientras dura la zona. Enfréntala.',
    action: { type: 'PLAY_CARD', cardId: 'spades-12', useWeapon: false },
  },
  {
    id: 'aparicion',
    target: 'spades-5:weapon',
    text: 'Las apariciones se enfrentan igual. Ataca con el arma.',
    action: { type: 'PLAY_CARD', cardId: 'spades-5', useWeapon: true },
  },
  {
    id: 'a-mano',
    target: 'clubs-7:hand',
    text: 'Tu arma ya no sirve contra este. Pelea a mano.',
    action: { type: 'PLAY_CARD', cardId: 'clubs-7', useWeapon: false },
  },
  {
    id: 'zona-mortal',
    target: 'zone',
    text: 'Mira esta zona: pelear contra el monstruo de 14 te mataría, y tu arma ya no sirve.',
  },
  {
    id: 'huir',
    target: 'escape:flee',
    text: 'Mejor huye: la zona se guarda para después.',
    action: { type: 'FLEE' },
  },
  {
    id: 'regresar',
    target: 'escape',
    text: 'Con «Regresar» la recuperas, pero no puedes huir dos zonas seguidas.',
  },
  {
    id: 'amanecer',
    target: 'dawn',
    text: 'Cada carta resuelta acerca el amanecer. ¡Aguanta hasta que salga el sol!',
  },
]

export function sameAction(a: GameAction, b: GameAction): boolean {
  if (a.type !== b.type) return false
  if (a.type === 'PLAY_CARD' && b.type === 'PLAY_CARD') {
    return a.cardId === b.cardId && a.useWeapon === b.useWeapon
  }
  return true
}
