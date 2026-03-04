import WeaponSlotGrid from '../WeaponSlotGrid/WeaponSlotGrid.jsx'
import styles from './ForgeArea.module.css'

export default function ForgeArea({
  weaponSlots,
  artefactSlots,
  focusedSlotKey,
  onSelectSlot,
  onRemoveElement,
  onForge,
  credits,
  pendingCarryOver,
}) {
  const hasBlueprint = weaponSlots.some(s => s.blueprint) || artefactSlots.some(s => s.blueprint)
  const hasSecretRecipe = weaponSlots.some(s => s.isSecret) || artefactSlots.some(s => s.isSecret)

  const sectionClass = [
    styles.section,
    hasSecretRecipe ? styles.secret : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={sectionClass}>
      <h2 className={styles.title}>
        <span>🔥</span>Enclume<span>🔥</span>
      </h2>

      {hasSecretRecipe && (
        <div className={styles.secretHint}>✨ Recette secrète détectée ! ✨</div>
      )}

      {!focusedSlotKey && hasBlueprint && (
        <p className={styles.hint}>Cliquez sur un slot pour le sélectionner</p>
      )}
      {focusedSlotKey && (
        <p className={styles.hintActive}>Slot actif — cliquez une carte de votre main</p>
      )}

      <WeaponSlotGrid
        weaponSlots={weaponSlots}
        artefactSlots={artefactSlots}
        mode="forge"
        focusedSlotKey={focusedSlotKey}
        onSlotSelect={onSelectSlot}
        onRemoveElement={onRemoveElement}
        credits={credits}
      />

      {pendingCarryOver > 0 && (
        <div className={styles.carryOverInfo}>
          🔮 +{pendingCarryOver} crédit{pendingCarryOver > 1 ? 's' : ''} reporté{pendingCarryOver > 1 ? 's' : ''} au prochain round
        </div>
      )}

      <button
        className={`${styles.forgeBtn} ${hasSecretRecipe ? styles.forgeBtnSecret : ''}`}
        onClick={onForge}
        disabled={!hasBlueprint}
      >
        <span>{hasSecretRecipe ? '⚡' : '⚒️'}</span>
        {hasSecretRecipe ? 'Forger la recette secrète !' : 'Forger'}
      </button>
    </section>
  )
}
