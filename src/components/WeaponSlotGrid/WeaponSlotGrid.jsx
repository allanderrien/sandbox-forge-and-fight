import SlotPanel from '../SlotPanel/SlotPanel.jsx'
import styles from './WeaponSlotGrid.module.css'

export default function WeaponSlotGrid({
  weaponSlots,
  artefactSlots,
  mode,
  focusedSlotKey,
  onSlotSelect,
  onRemoveElement,
  credits,
  // blueprint mode props
  selectedBlueprintId,
  onSlotClickBlueprint,
}) {
  const handleSlot = (key) => {
    if (mode === 'blueprint') {
      onSlotClickBlueprint?.(key)
    } else {
      onSlotSelect?.(key)
    }
  }

  return (
    <div className={styles.grid}>
      <div className={styles.weaponRow}>
        {weaponSlots.map(slot => (
          <SlotPanel
            key={slot.key}
            slot={slot}
            mode={mode}
            focused={focusedSlotKey === slot.key}
            onSelect={handleSlot}
            onRemoveElement={onRemoveElement}
            credits={credits}
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
              mode={mode}
              focused={focusedSlotKey === slot.key}
              onSelect={handleSlot}
              onRemoveElement={onRemoveElement}
              credits={credits}
            />
          ))}
        </div>
      )}
    </div>
  )
}
