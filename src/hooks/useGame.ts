import { useCallback, useReducer } from 'react'
import { applyAction, createGame, randomSeed } from '../engine'
import type { GameAction, GameState } from '../engine'

type Message = GameAction | { readonly type: 'NEW_GAME'; readonly seed: number }

/** Las acciones ilegales se ignoran: la UI ya deshabilita lo que no se puede hacer. */
function reducer(state: GameState, message: Message): GameState {
  if (message.type === 'NEW_GAME') return createGame(message.seed)
  const result = applyAction(state, message)
  return result.ok ? result.state : state
}

export function useGame() {
  const [game, dispatch] = useReducer(reducer, undefined, () => createGame())

  const playCard = useCallback(
    (cardId: string, useWeapon: boolean) => dispatch({ type: 'PLAY_CARD', cardId, useWeapon }),
    [],
  )
  const flee = useCallback(() => dispatch({ type: 'FLEE' }), [])
  const recall = useCallback(() => dispatch({ type: 'RECALL' }), [])
  const newGame = useCallback(() => dispatch({ type: 'NEW_GAME', seed: randomSeed() }), [])

  return { game, playCard, flee, recall, newGame }
}
