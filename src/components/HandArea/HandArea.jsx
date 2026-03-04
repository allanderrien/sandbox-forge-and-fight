import { useDraggable } from '@dnd-kit/core'
import { MATERIALS } from '../../data/materials.js'
import Card from '../Card/Card.jsx'
import styles from './HandArea.module.css'

function DraggableCardWrapper({ card, index, disabled, children }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `el-${card.uid}`,
    data: { type: 'element', cardIndex: index },
    disabled,
  })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.cardWrapper} ${isDragging ? styles.dragging : ''}`}
      style={{ '--i': index }}
      {...listeners}
      {...attributes}
    >
      {children}
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
        <p className={styles.hint}>⬇ Sélectionnez un slot sur l'enclume d'abord</p>
      )}
      {slotFull && !noSlotSelected && (
        <p className={styles.hint}>Slot plein — choisissez un autre slot</p>
      )}

      <div className={styles.hand}>
        {hand.map((card, index) => {
          const cost = MATERIALS[card.id].creditCost ?? 1
          const tooExpensive = credits < cost
          const cardDisabled = disabled || noSlotSelected || slotFull
          return (
            <DraggableCardWrapper key={card.uid} card={card} index={index} disabled={disabled}>
              <Card
                cardId={card.id}
                onClick={() => onCardClick(index)}
                disabled={cardDisabled}
                tooExpensive={!cardDisabled && tooExpensive}
              />
            </DraggableCardWrapper>
          )
        })}
        {hand.length === 0 && (
          <p className={styles.empty}>Tous les matériaux sont placés</p>
        )}
      </div>
    </section>
  )
}
