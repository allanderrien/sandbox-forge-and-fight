import { MATERIALS } from '../../data/materials.js'
import Card from '../Card/Card.jsx'
import { findSecretRecipe } from '../../utils/forgeEngine.js'
import styles from './ForgeArea.module.css'

export default function ForgeArea({ slots, onSlotClick, onForge, credits, pendingCarryOver }) {
  const canForge = slots.length > 0
  const secretRecipe = findSecretRecipe(slots)
  const spentCredits = slots.reduce((s, c) => s + (MATERIALS[c.id].creditCost ?? 1), 0)

  const classNames = [
    styles.forge,
    secretRecipe ? styles.secret : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>
        <span className={styles.fireIcon}>🔥</span>
        Enclume
        <span className={styles.fireIcon}>🔥</span>
      </h2>

      {secretRecipe && (
        <div className={styles.secretHint}>✨ Recette secrète détectée ! ✨</div>
      )}

      <div className={classNames}>
        <div className={styles.slots}>
          {Array.from({ length: 3 }).map((_, i) => {
            const card = slots[i]
            return (
              <div key={i} className={`${styles.slot} ${card ? styles.filled : styles.empty}`}>
                {card ? (
                  <Card cardId={card.id} onClick={() => onSlotClick(i)} inForge size="normal" />
                ) : (
                  <div className={styles.slotPlaceholder}>
                    <span className={styles.slotNum}>{i + 1}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className={styles.costRow}>
          <span className={styles.costLabel}>
            Coût : <strong>{spentCredits}</strong>⚗ dépensés
            {credits > 0 && <span className={styles.creditsLeft}> · {credits} restant{credits > 1 ? 's' : ''}</span>}
          </span>
          {pendingCarryOver > 0 && (
            <span className={styles.carryOverInfo}>
              🔮 +{pendingCarryOver} reporté{pendingCarryOver > 1 ? 's' : ''} au prochain round
            </span>
          )}
        </div>

        <button
          className={`${styles.forgeBtn} ${secretRecipe ? styles.forgeBtnSecret : ''}`}
          onClick={onForge}
          disabled={!canForge}
        >
          <span className={styles.forgeBtnIcon}>{secretRecipe ? '⚡' : '⚒️'}</span>
          {secretRecipe ? 'Forger la recette secrète !' : 'Forger l\'arme'}
        </button>
      </div>

      <p className={styles.hint}>Cliquez sur une carte forgée pour la retirer</p>
    </section>
  )
}
