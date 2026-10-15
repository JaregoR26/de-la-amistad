import { useCallback, useReducer } from 'react'
import { applyAction, createGame, randomSeed, withHardMode } from '../engine'
import type { GameAction, GameState } from '../engine'

type Message =
  | GameAction
  | { readonly type: 'NEW_GAME'; readonly seed: number }
  | { readonly type: 'SET_HARD_MODE'; readonly value: boolean }

/** Las acciones ilegales se ignoran: la UI ya deshabilita lo que no se puede hacer. */
function reducer(state: GameState, message: Message): GameState {
  switch (message.type) {
    case 'NEW_GAME':
      // La nueva partida conserva el modo elegido.
      return createGame(message.seed, { hardMode: state.hardMode })
    case 'SET_HARD_MODE':
      return withHardMode(state, message.value)
    default: {
      const result = applyAction(state, message)
      return result.ok ? result.state : state
    }
  }
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
  const setHardMode = useCallback((value: boolean) => dispatch({ type: 'SET_HARD_MODE', value }), [])

  return { game, playCard, flee, recall, newGame, setHardMode }
}