import { useDraggable } from '@dnd-kit/core'
import styles from './BlueprintCard.module.css'

export default function BlueprintCard({ blueprint, onClick, selected, disabled }) {
  if (!blueprint) return null

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `bp-${blueprint.id}`,
    data: { type: 'blueprint', blueprintId: blueprint.id },
    disabled: !!disabled,
  })

  const classNames = [
    styles.card,
    selected ? styles.selected : '',
    disabled ? styles.disabled : '',
    blueprint.category === 'heavy' ? styles.heavy : '',
    blueprint.category === 'artefact' ? styles.artefact : '',
    isDragging ? styles.dragging : '',
  ].filter(Boolean).join(' ')

  const specialLabel = {
    fire_bonus: '+2 🔥/⚡',
    diversity: '+1/type unique',
    carry_over_1: '+1⚗ reporté',
    recipe_bonus: '+4 recette secrète',
    rune_bonus: '+2/🔮',
    vengeance: '+5 si défaite',
    diversity_all: '+1/type (global)',
    bloodstone: '+2/PV perdu',
    steel_bonus: '+2/⚙️💎 (global)',
  }[blueprint.special]

  return (
    <button
      ref={setNodeRef}
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      style={{ '--bp-color': blueprint.color, '--bp-dark': blueprint.colorDark }}
      title={blueprint.description}
      {...listeners}
      {...attributes}
    >
      <div className={styles.shine} />

      <div className={styles.header}>
        <span className={styles.emoji}>{blueprint.emoji}</span>
        {blueprint.category === 'heavy' && <span className={styles.categoryBadge}>LOURD</span>}
        {blueprint.category === 'artefact' && <span className={styles.categoryBadge}>ARTEFACT</span>}
      </div>

      <div className={styles.name}>{blueprint.name}</div>

      <div className={styles.stats}>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Base</span>
          <span className={styles.statValue}>⚔ {blueprint.basePower}</span>
        </div>
        {blueprint.elementSlots > 0 && (
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Slots</span>
            <span className={styles.statValue}>
              {'◇'.repeat(blueprint.elementSlots)}
            </span>
          </div>
        )}
      </div>

      {specialLabel && (
        <div className={styles.special}>{specialLabel}</div>
      )}
    </button>
  )
}
