import { useDraggable } from '@dnd-kit/core'
import { MATERIALS } from '../../data/materials.js'
import Card from '../Card/Card.jsx'
import styles from './HandArea.module.css'

function DraggableCardWrapper({ card, index, draggableDisabled, cardDisabled, onCardClick, credits }) {
  const cost = MATERIALS[card.id].creditCost ?? 1
  const tooExpensive = credits < cost

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `el-${card.uid}`,
    data: { type: 'element', cardIndex: index },
    disabled: draggableDisabled,
  })

  const handleClick = () => {
    if (!cardDisabled) onCardClick(index)
  }

  return (
    <div
      ref={setNodeRef}
      className={`${styles.cardWrapper} ${isDragging ? styles.dragging : ''}`}
      style={{ '--i': index }}
      {...listeners}
      {...attributes}
      onClick={handleClick}
    >
      {/* pointer-events: none ensures pointerdown always reaches the wrapper div,
          even when the Card button is HTML-disabled */}
      <div style={{ pointerEvents: 'none' }}>
        <Card
          cardId={card.id}
          disabled={cardDisabled}
          tooExpensive={!cardDisabled && tooExpensive}
        />
      </div>
    </div>
  )
}

export default function HandArea({ hand, onCardClick, disabled, credits, focusedSlotKey, focusedSlot }) {
  const noSlotSelected = !focusedSlotKey
  const slotFull = focusedSlot && focusedSlot.blueprint
    && focusedSlot.elements.length >= focusedSlot.blueprint.elementSlots

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Main ({hand.length} cartes)</h2>

      {noSlotSelected && !disabled && (
        <p className={styles.hint}>⬇ Glissez une carte sur un slot, ou sélectionnez un slot d'abord</p>
      )}
      {slotFull && !noSlotSelected && (
        <p className={styles.hint}>Slot plein — choisissez un autre slot</p>
      )}

      <div className={styles.hand}>
        {hand.map((card, index) => {
          const cardDisabled = disabled || slotFull
          return (
            <DraggableCardWrapper
              key={card.uid}
              card={card}
              index={index}
              draggableDisabled={disabled}
              cardDisabled={cardDisabled}
              onCardClick={onCardClick}
              credits={credits}
            />
          )
        })}
        {hand.length === 0 && (
          <p className={styles.empty}>Tous les matériaux sont placés</p>
        )}
      </div>
    </section>
  )
}
