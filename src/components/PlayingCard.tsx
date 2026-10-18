import { Button, Card } from 'react-bootstrap'
import { cardAriaLabel, cardName, curseOfCard, KIND_LABEL, RULE_ERROR } from '../content/es'
import {
  isDamaging,
  kindOf,
  previewDamage,
  previewHeal,
  rankLabel,
  SUIT_SYMBOL,
  weaponIssue,
} from '../engine'
import type { Card as CardModel, GameState } from '../engine'

interface PlayingCardProps {
  readonly card: CardModel
  readonly game: GameState
  readonly onPlay: (cardId: string, useWeapon: boolean) => void
}

export function PlayingCard({ card, game, onPlay }: PlayingCardProps) {
  const kind = kindOf(card)
  const curse = curseOfCard(card)
  const stat = {
    weapon: `Ataque ${card.rank}`,
    potion: `Cura ${card.rank}`,
    fauna: `Daño ${card.rank}`,
    spirit: `Daño ${card.rank}`,
    curse: curse?.name ?? 'Maldición',
  }[kind]

  return (
    <Card as="article" className="play-card h-100" data-kind={kind} data-suit={card.suit} aria-label={cardAriaLabel(card)}>
      <Card.Body className="d-flex flex-column gap-2">
        <div className="play-card__corner" aria-hidden="true">
          <span>{rankLabel(card.rank)}</span>
          <span>{SUIT_SYMBOL[card.suit]}</span>
        </div>
        <Card.Title as="h3" className="play-card__name">
          {cardName(card)}
        </Card.Title>
        <p className="play-card__kind mb-0">
          {KIND_LABEL[kind]}: {stat}
        </p>
        {curse && <p className="small text-body-secondary mb-0">{curse.effect}</p>}
      </Card.Body>
      <Card.Footer className="d-grid gap-2">{renderActions()}</Card.Footer>
    </Card>
  )

  function renderActions() {
    if (kind === 'weapon') {
      return (
        <Button variant="warning" size="sm" data-tutorial-target={`${card.id}:play`} onClick={() => onPlay(card.id, false)}>
          Empuñar
        </Button>
      )
    }
    if (kind === 'potion') {
      const heal = previewHeal(game, card)
      return (
        <Button variant="warning" size="sm" data-tutorial-target={`${card.id}:play`} onClick={() => onPlay(card.id, false)}>
          {heal > 0 ? `Tomar (+${heal} de vida)` : 'Tomar (sin efecto)'}
        </Button>
      )
    }
    if (kind === 'curse') {
      return (
        <Button variant="outline-danger" size="sm" data-tutorial-target={`${card.id}:play`} onClick={() => onPlay(card.id, false)}>
          Enfrentar
        </Button>
      )
    }
    if (!isDamaging(card)) return null

    const bareDamage = previewDamage(game, card, false)
    const issue = game.weapon ? weaponIssue(game, card) : null
    const weaponDamage = game.weapon && !issue ? previewDamage(game, card, true) : 0
    return (
      <>
        {game.weapon && (
          <Button
            variant={weaponDamage >= game.health ? 'outline-danger' : 'warning'}
            size="sm"
            disabled={issue !== null}
            data-tutorial-target={`${card.id}:weapon`}
            onClick={() => onPlay(card.id, true)}
            title={issue ? RULE_ERROR[issue] : undefined}
          >
            {issue ? 'Arma inútil aquí' : `Atacar con arma (−${weaponDamage})`}
          </Button>
        )}
        <Button
          variant={bareDamage >= game.health ? 'outline-danger' : 'outline-secondary'}
          size="sm"
          data-tutorial-target={`${card.id}:hand`}
          onClick={() => onPlay(card.id, false)}
        >
          {`Pelear a mano (−${bareDamage})`}
        </Button>
      </>
    )
  }
}
