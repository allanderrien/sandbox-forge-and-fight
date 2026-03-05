import { MATERIALS } from '../../data/materials.js'
import styles from './Card.module.css'

export default function Card({ cardId, onClick, disabled, size = 'normal', selected, inForge, tooExpensive }) {
  const material = MATERIALS[cardId]
  if (!material) return null

  const cost = material.creditCost ?? 1

  const classNames = [
    styles.card,
    styles[size],
    disabled ? styles.disabled : '',
    tooExpensive ? styles.tooExpensive : '',
    selected ? styles.selected : '',
    inForge ? styles.inForge : '',
    material.carryOver ? styles.runeCard : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      className={classNames}
      onClick={onClick}
      disabled={disabled || tooExpensive}
      style={{
        '--card-color': material.color,
        '--card-dark': material.colorDark,
      }}
      title={material.description}
    >
      <div className={styles.shine} />

      <div className={styles.costBadge} data-cost={cost}>
        {cost === 0 ? 'FREE' : `${cost}🪙`}
      </div>

      <div className={styles.emoji}>{material.emoji}</div>
      <div className={styles.name}>{material.name}</div>
      <div className={styles.power}>
        <span className={styles.powerIcon}>⚔</span>
        <span className={styles.powerValue}>{material.power}</span>
      </div>

      {material.carryOver && (
        <div className={styles.carryOverBadge}>+{material.carryOver}🪙→</div>
      )}
      {material.tier === 2 && !material.carryOver && (
        <div className={styles.tierBadge}>✦</div>
      )}
    </button>
  )
}
