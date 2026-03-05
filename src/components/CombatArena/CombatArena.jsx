import { useState, useEffect } from 'react'
import { MATERIALS } from '../../data/materials.js'
import styles from './CombatArena.module.css'

const SPECIAL_LABELS = {
  fire_bonus: '🔥 Brasier',
  diversity: '🌈 Diversité',
  rune_bonus: '🔮 Runes',
  vengeance: '💀 Vengeance',
  diversity_all: '🌐 Diversité globale',
  bloodstone: '🩸 Pierre de sang',
  steel_bonus: '💎 Acier+Cristal',
  recipe_bonus: '📜 Bonus recette',
}

function getSynergyLabel(synergyBonus) {
  if (synergyBonus === 3) return '🔺 Triplet identique'
  if (synergyBonus === 2) return '🌈 Trio diversifié'
  if (synergyBonus === 1) return '✨ Paire identique'
  return null
}

// Each chip carries a numeric `delta` used to compute the running power total
function buildBonusChips(slots) {
  const chips = []
  for (const slot of slots) {
    const { breakdown, blueprint } = slot
    if (!breakdown) continue
    const prefix = slots.length > 1 ? `${blueprint?.emoji || ''} ` : ''

    if (breakdown.multiplier) {
      chips.push({ label: `${prefix}Base`, value: `+${breakdown.base}`, delta: breakdown.base, type: 'base' })
      chips.push({ label: `${prefix}Éléments`, value: `+${breakdown.elementSum}`, delta: breakdown.elementSum, type: 'element' })
      chips.push({
        label: `${prefix}Recette secrète`,
        value: `×${breakdown.multiplier}`,
        delta: breakdown.elementSum * (breakdown.multiplier - 1),
        type: 'secret',
      })
      if (breakdown.specialBonus > 0) {
        const label = SPECIAL_LABELS[blueprint?.special] || blueprint?.special || ''
        chips.push({ label: `${prefix}${label}`, value: `+${breakdown.specialBonus}`, delta: breakdown.specialBonus, type: 'special' })
      }
    } else {
      if (breakdown.base > 0)
        chips.push({ label: `${prefix}Base`, value: `+${breakdown.base}`, delta: breakdown.base, type: 'base' })
      if (breakdown.elementSum > 0)
        chips.push({ label: `${prefix}Éléments`, value: `+${breakdown.elementSum}`, delta: breakdown.elementSum, type: 'element' })
      if (breakdown.synergyBonus > 0) {
        const synLabel = getSynergyLabel(breakdown.synergyBonus)
        chips.push({ label: `${prefix}${synLabel}`, value: `+${breakdown.synergyBonus}`, delta: breakdown.synergyBonus, type: 'synergy' })
      }
      if (breakdown.specialBonus > 0 && blueprint?.special) {
        const spLabel = SPECIAL_LABELS[blueprint.special] || blueprint.special
        chips.push({ label: `${prefix}${spLabel}`, value: `+${breakdown.specialBonus}`, delta: breakdown.specialBonus, type: 'special' })
      }
    }
  }
  return chips
}

function BonusChips({ chips, revealedCount }) {
  if (!chips.length || revealedCount === 0) return null
  return (
    <div className={styles.bonusChips}>
      <div className={styles.bonusTitle}>Détail du score</div>
      {chips.slice(0, revealedCount).map((chip, i) => (
        <div key={i} className={`${styles.chip} ${styles[`chip_${chip.type}`]}`}>
          <span className={styles.chipLabel}>{chip.label}</span>
          {chip.value && <span className={styles.chipValue}>{chip.value}</span>}
        </div>
      ))}
    </div>
  )
}

function WeaponCard({ weapon, label, revealed, displayedPower }) {
  if (!weapon) return null
  // displayedPower: running total (null = no chips, show final power directly)
  const power = displayedPower ?? weapon.power

  const classNames = [
    styles.weaponCard,
    revealed ? styles.revealed : '',
    weapon.isSecret ? styles.secretWeapon : '',
  ].filter(Boolean).join(' ')

  const glowStyle = weapon.isSecret && weapon.glowColor
    ? { '--glow-color': weapon.glowColor }
    : {}

  return (
    <div className={classNames} style={glowStyle}>
      <div className={styles.weaponLabel}>{label}</div>
      <div className={styles.weaponEmoji}>{weapon.emoji}</div>
      <div className={styles.weaponName}>{weapon.name}</div>
      <div className={styles.weaponPower}>
        <span className={styles.powerIcon}>⚔</span>
        {/* key trick: remount span on each power change → CSS animation replays */}
        <span key={power} className={styles.powerNum}>{power}</span>
      </div>
      {weapon.isSecret && (
        <div className={styles.secretBadge}>RECETTE SECRÈTE</div>
      )}
      {weapon.materials?.length > 0 && (
        <div className={styles.materialsList}>
          {weapon.materials.map((id, i) => (
            <span key={i} title={MATERIALS[id]?.name}>
              {MATERIALS[id]?.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

const CHIP_FIRST_DELAY = 400  // ms after card reveal before first chip
const CHIP_INTERVAL    = 220  // ms between each chip

export default function CombatArena({ playerWeapon, aiWeapon, onResolve, weaponSlots = [], artefactSlots = [] }) {
  const [step, setStep] = useState(0)
  const [revealedChipCount, setRevealedChipCount] = useState(0)

  // Computed once — slots don't change during combat
  const [bonusChips] = useState(() => buildBonusChips([...weaponSlots, ...artefactSlots]))

  // Running power total based on chips revealed so far
  const displayedPower = bonusChips.length > 0
    ? bonusChips.slice(0, revealedChipCount).reduce((sum, c) => sum + (c.delta || 0), 0)
    : null

  const result = playerWeapon.power > aiWeapon.power ? 'win'
    : playerWeapon.power < aiWeapon.power ? 'lose' : 'tie'

  useEffect(() => {
    setStep(0)
    setRevealedChipCount(0)

    // Reveal each chip sequentially
    const chipTimers = bonusChips.map((_, i) =>
      setTimeout(() => setRevealedChipCount(i + 1), CHIP_FIRST_DELAY + i * CHIP_INTERVAL)
    )

    const t1 = setTimeout(() => setStep(1), 1800)
    const t2 = setTimeout(() => setStep(2), 2800)
    const t3 = setTimeout(() => setStep(3), 4200)

    return () => {
      chipTimers.forEach(clearTimeout)
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
    }
  }, [])

  const clashClass = step >= 2
    ? (result === 'win' ? styles.win : result === 'lose' ? styles.lose : styles.tie)
    : ''

  return (
    <div className={`${styles.arena} ${step >= 2 ? styles.clashing : ''}`}>
      <div className={styles.combatants}>
        <div className={styles.playerSide}>
          <WeaponCard
            weapon={playerWeapon}
            label="Votre arme"
            revealed={step >= 0}
            displayedPower={displayedPower}
          />
          <BonusChips chips={bonusChips} revealedCount={revealedChipCount} />
        </div>

        <div className={`${styles.vsZone} ${clashClass}`}>
          {step < 2 && <span className={styles.vs}>VS</span>}
          {step >= 2 && (
            <span className={styles.result}>
              {result === 'win' ? '🏆' : result === 'lose' ? '💀' : '🤝'}
            </span>
          )}
        </div>

        <WeaponCard weapon={aiWeapon} label="Arme de l'IA" revealed={step >= 1} />
      </div>

      {step >= 3 && (
        <div className={styles.resultRow}>
          <div className={`${styles.resultText} ${styles[result]}`}>
            {result === 'win' && `Victoire ! (${playerWeapon.power} vs ${aiWeapon.power})`}
            {result === 'lose' && `Défaite... (${playerWeapon.power} vs ${aiWeapon.power})`}
            {result === 'tie' && `Match nul (${playerWeapon.power} = ${aiWeapon.power}) — −0.5 ♥`}
          </div>
          <button className={styles.continueBtn} onClick={onResolve}>
            Continuer →
          </button>
        </div>
      )}
    </div>
  )
}
