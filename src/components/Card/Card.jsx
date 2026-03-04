import { MATERIALS } from '../../data/materials.js'
import styles from './Card.module.css'

export default function Card({ cardId, onClick, disabled, size = 'normal', selected, inForge }) {
  const material = MATERIALS[cardId]
  if (!material) return null

  const classNames = [
    styles.card,
    styles[size],
    disabled ? styles.disabled : '',
    selected ? styles.selected : '',
    inForge ? styles.inForge : '',
  ].filter(Boolean).join(' ')

  return (
    <button
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      style={{
        '--card-color': material.color,
        '--card-dark': material.colorDark,
      }}
      title={material.description}
    >
      <div className={styles.shine} />
      <div className={styles.emoji}>{material.emoji}</div>
      <div className={styles.name}>{material.name}</div>
      <div className={styles.power}>
        <span className={styles.powerIcon}>⚔</span>
        <span className={styles.powerValue}>{material.power}</span>
      </div>
      {material.tier === 2 && <div className={styles.tierBadge}>✦</div>}
    </button>
  )
}
