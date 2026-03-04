import { useState } from 'react'
import BlueprintCard from '../BlueprintCard/BlueprintCard.jsx'
import SlotPanel from '../SlotPanel/SlotPanel.jsx'
import styles from './BlueprintPhase.module.css'

export default function BlueprintPhase({
  drawnBlueprints,
  blueprintPlacements,
  weaponSlots,
  artefactSlots,
  round,
  onPlace,
  onConfirm,
}) {
  const [selectedBlueprintId, setSelectedBlueprintId] = useState(null)

  const handleBlueprintClick = (id) => {
    setSelectedBlueprintId(prev => prev === id ? null : id)
  }

  const handleSlotClick = (slotKey) => {
    if (!selectedBlueprintId) return
    onPlace(selectedBlueprintId, slotKey)
    setSelectedBlueprintId(null)
  }

  const allSlots = [...weaponSlots, ...artefactSlots]
  const hasAnyBlueprint = allSlots.some(s => s.blueprint)
  const placementsLeft = 2 - blueprintPlacements

  // Hide blueprints already placed in a slot
  const placedIds = new Set(allSlots.filter(s => s.blueprint).map(s => s.blueprint.id))
  const availableBlueprints = drawnBlueprints.filter(bp => !placedIds.has(bp.id))

  return (
    <div className={styles.phase}>
      <div className={styles.header}>
        <h2 className={styles.title}>⚒️ Phase Blueprint — Round {round}</h2>
        <p className={styles.subtitle}>
          {placementsLeft > 0
            ? `Choisissez un blueprint, puis un emplacement. (${placementsLeft} placement${placementsLeft > 1 ? 's' : ''} restant)`
            : 'Placements épuisés. Confirmez pour continuer.'}
        </p>
      </div>

      <div className={styles.options}>
        <div className={styles.optionsLabel}>Nouvelles options</div>
        <div className={styles.blueprintRow}>
          {availableBlueprints.map(bp => (
            <BlueprintCard
              key={bp.id}
              blueprint={bp}
              selected={selectedBlueprintId === bp.id}
              disabled={blueprintPlacements >= 2}
              onClick={() => handleBlueprintClick(bp.id)}
            />
          ))}
        </div>
      </div>

      <div className={styles.slots}>
        <div className={styles.slotsLabel}>
          {selectedBlueprintId
            ? '→ Cliquez sur un emplacement pour placer'
            : 'Vos emplacements'}
        </div>

        <div className={styles.weaponGrid}>
          {weaponSlots.map(slot => (
            <SlotPanel
              key={slot.key}
              slot={slot}
              mode="blueprint"
              focused={false}
              onSelect={handleSlotClick}
            />
          ))}
        </div>

        {artefactSlots.length > 0 && (
          <div className={styles.artefactRow}>
            <span className={styles.artefactLabel}>Artefact</span>
            {artefactSlots.map(slot => (
              <SlotPanel
                key={slot.key}
                slot={slot}
                mode="blueprint"
                focused={false}
                onSelect={handleSlotClick}
              />
            ))}
          </div>
        )}
      </div>

      <button
        className={styles.confirmBtn}
        onClick={onConfirm}
      >
        {hasAnyBlueprint ? 'Confirmer →' : 'Passer (aucun blueprint) →'}
      </button>
    </div>
  )
}
