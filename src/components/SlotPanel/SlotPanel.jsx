import { useDroppable } from '@dnd-kit/core'
import Card from '../Card/Card.jsx'
import styles from './SlotPanel.module.css'

export default function SlotPanel({ slot, mode, focused, onSelect, onRemoveElement, credits }) {
  // mode: 'blueprint' | 'forge'
  const { key, blueprint, elements, power, breakdown } = slot
  const isHeavy = blueprint?.slotsRequired === 2
  const isArtefact = blueprint?.category === 'artefact'

  const { setNodeRef, isOver } = useDroppable({
    id: `drop-${key}`,
    data: { slotKey: key },
  })

  const panelClass = [
    styles.panel,
    focused ? styles.focused : '',
    isHeavy ? styles.heavy : '',
    isArtefact ? styles.artefact : '',
    !blueprint ? styles.empty : '',
    isOver ? styles.dropOver : '',
  ].filter(Boolean).join(' ')

  const colorStyle = blueprint
    ? { '--slot-color': blueprint.color, '--slot-dark': blueprint.colorDark }
    : {}

  const handlePanelClick = () => {
    if (onSelect) onSelect(key)
  }

  return (
    <div
      ref={setNodeRef}
      className={panelClass}
      style={colorStyle}
      onClick={handlePanelClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect?.(key) }}
    >
      {blueprint ? (
        <>
          <div className={styles.bpHeader}>
            <span className={styles.bpEmoji}>{blueprint.emoji}</span>
            <div className={styles.bpInfo}>
              <div className={styles.bpName}>{blueprint.name}</div>
              <div className={styles.bpBase}>Base ⚔ {blueprint.basePower}</div>
            </div>
            {mode === 'forge' && power > 0 && (
              <div className={styles.powerBadge}>⚔ {power}</div>
            )}
          </div>

          {blueprint.elementSlots > 0 && (
            <div className={styles.elementSlots}>
              {Array.from({ length: blueprint.elementSlots }).map((_, i) => {
                const card = elements[i]
                return (
                  <div
                    key={i}
                    className={`${styles.elementSlot} ${card ? styles.filledSlot : styles.emptySlot} ${focused && !card ? styles.readySlot : ''}`}
                  >
                    {card ? (
                      <Card
                        cardId={card.id}
                        onClick={mode === 'forge' ? (e) => { e.stopPropagation(); onRemoveElement?.(key, i) } : undefined}
                        inForge
                        size="small"
                      />
                    ) : (
                      <div className={styles.emptySlotInner}>
                        <span className={styles.slotNum}>{i + 1}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {isArtefact && (
            <div className={styles.artefactNote}>{blueprint.description}</div>
          )}

          {mode === 'forge' && breakdown?.specialBonus > 0 && (
            <div className={styles.bonusHint}>+{breakdown.specialBonus} bonus</div>
          )}
          {mode === 'forge' && breakdown?.synergyBonus > 0 && (
            <div className={styles.bonusHint}>+{breakdown.synergyBonus} synergie</div>
          )}
          {mode === 'forge' && breakdown?.secretRecipe && (
            <div className={styles.secretHint}>✨ Recette secrète !</div>
          )}
        </>
      ) : (
        <div className={styles.emptyContent}>
          <span className={styles.emptyIcon}>{isArtefact ? '🔮' : '⚒️'}</span>
          <span className={styles.emptyLabel}>
            {mode === 'blueprint' ? 'Choisir un blueprint' : 'Slot libre'}
          </span>
        </div>
      )}

      {focused && mode === 'forge' && (
        <div className={styles.focusedIndicator}>Actif</div>
      )}
    </div>
  )
}
