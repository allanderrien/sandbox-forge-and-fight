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

function buildBonusChips(slots) {
  const chips = []
  for (const slot of slots) {
    const { breakdown, blueprint } = slot
    if (!breakdown) continue
    const slotPrefix = slots.length > 1 ? `${blueprint?.emoji || ''}` : ''

    if (breakdown.multiplier) {
      chips.push({ label: `${slotPrefix} Recette secrète ×${breakdown.multiplier}`, value: null, type: 'secret' })
      if (breakdown.elementSum > 0)
        chips.push({ label: `${slotPrefix} Éléments`, value: `+${breakdown.elementSum}`, type: 'element' })
    } else {
      if (breakdown.base > 0)
        chips.push({ label: `${slotPrefix} Base`, value: `+${breakdown.base}`, type: 'base' })
      if (breakdown.elementSum > 0)
        chips.push({ label: `${slotPrefix} Éléments`, value: `+${breakdown.elementSum}`, type: 'element' })
      if (breakdown.synergyBonus > 0) {
        const label = getSynergyLabel(breakdown.synergyBonus)
        chips.push({ label: `${slotPrefix} ${label}`, value: `+${breakdown.synergyBonus}`, type: 'synergy' })
      }
      if (breakdown.specialBonus > 0 && blueprint?.special) {
        const label = SPECIAL_LABELS[blueprint.special] || blueprint.special
        chips.push({ label: `${slotPrefix} ${label}`, value: `+${breakdown.specialBonus}`, type: 'special' })
      }
    }
  }
  return chips
}

function BonusChips({ chips }) {
  if (!chips.length) return null
  return (
    <div className={styles.bonusChips}>
      <div className={styles.bonusTitle}>Détail du score</div>
      {chips.map((chip, i) => (
        <div
          key={i}
          className={`${styles.chip} ${styles[`chip_${chip.type}`]}`}
          style={{ animationDelay: `${0.35 + i * 0.13}s` }}
        >
          <span className={styles.chipLabel}>{chip.label}</span>
          {chip.value && <span className={styles.chipValue}>{chip.value}</span>}
        </div>
      ))}
    </div>
  )
}

function WeaponCard({ weapon, label, revealed }) {
  if (!weapon) return null

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
        <span className={styles.powerNum}>{weapon.power}</span>
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

export default function CombatArena({ playerWeapon, aiWeapon, onResolve, weaponSlots = [], artefactSlots = [] }) {
  const [step, setStep] = useState(0)
  // 0 = show player weapon + chips, 1 = reveal ai weapon, 2 = show clash, 3 = done

  const result = playerWeapon.power > aiWeapon.power ? 'win'
    : playerWeapon.power < aiWeapon.power ? 'lose' : 'tie'

  const bonusChips = buildBonusChips([...weaponSlots, ...artefactSlots])

  useEffect(() => {
    setStep(0)
    const t1 = setTimeout(() => setStep(1), 1400)
    const t2 = setTimeout(() => setStep(2), 2400)
    const t3 = setTimeout(() => setStep(3), 3800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const clashClass = step >= 2
    ? (result === 'win' ? styles.win : result === 'lose' ? styles.lose : styles.tie)
    : ''

  return (
    <div className={`${styles.arena} ${step >= 2 ? styles.clashing : ''}`}>
      <div className={styles.combatants}>
        <div className={styles.playerSide}>
          <WeaponCard weapon={playerWeapon} label="Votre arme" revealed={step >= 0} />
          {step >= 0 && <BonusChips chips={bonusChips} />}
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
