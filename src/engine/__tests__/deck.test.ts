import { describe, expect, it } from 'vitest'
import { kindOf } from '../cards'
import { buildDeck, shuffledDeck } from '../deck'

describe('buildDeck', () => {
  const deck = buildDeck()

  it('tiene 44 cartas únicas', () => {
    expect(deck).toHaveLength(44)
    expect(new Set(deck.map((card) => card.id)).size).toBe(44)
  })

  it('no incluye figuras ni ases rojos', () => {
    const redHigh = deck.filter(
      (card) => (card.suit === 'hearts' || card.suit === 'diamonds') && card.rank > 10,
    )
    expect(redHigh).toEqual([])
  })

  it('solo las 4 figuras de picas son maldiciones', () => {
    const curses = deck.filter((card) => kindOf(card) === 'curse')
    expect(curses.map((card) => card.id).sort()).toEqual([
      'spades-11',
      'spades-12',
      'spades-13',
      'spades-14',
    ])
  })
})

describe('shuffledDeck', () => {
  it('es determinista por semilla', () => {
    expect(shuffledDeck(42)).toEqual(shuffledDeck(42))
  })

  it('cambia con otra semilla y conserva las cartas', () => {
    const a = shuffledDeck(1)
    const b = shuffledDeck(2)
    expect(a).not.toEqual(b)
    expect([...a].sort((x, y) => x.id.localeCompare(y.id))).toEqual(
      [...b].sort((x, y) => x.id.localeCompare(y.id)),
    )
  })
})
