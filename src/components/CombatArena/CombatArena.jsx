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
      // Show ingredient emojis directly in the chip label
      const ingredientEmojis = breakdown.secretRecipe?.ingredients
        .map(id => MATERIALS[id]?.emoji || '?')
        .join(' + ') || ''
      chips.push({
        label: `${ingredientEmojis} Recette secrète`,
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

function WeaponCard({ weapon, label, revealed, displayedPower, secretRevealed }) {
  if (!weapon) return null
  const power = displayedPower ?? weapon.power

  // Before secret reveal: show blueprint state (normal name/emoji, no glow)
  const preTransform = weapon.isSecret && !secretRevealed

  const displayName = preTransform
    ? (weapon.slots?.map(s => s.blueprint?.name || '?').join(' + ') || weapon.name)
    : weapon.name

  const classNames = [
    styles.weaponCard,
    revealed ? styles.revealed : '',
    secretRevealed && weapon.isSecret ? styles.secretWeapon : '',
    secretRevealed && weapon.isSecret ? styles.transformReveal : '',
  ].filter(Boolean).join(' ')

  const glowStyle = secretRevealed && weapon.isSecret && weapon.glowColor
    ? { '--glow-color': weapon.glowColor }
    : {}

  // Emoji: pre-transform shows blueprint emoji, post-transform shows recipe emoji
  let emojiContent
  if (weapon.slots?.length > 1) {
    emojiContent = weapon.slots.map((s, i) => (
      <span key={i} className={styles.slotEmoji}>
        {preTransform ? (s.blueprint?.emoji || '⚔️') : (s.emoji || s.blueprint?.emoji || '⚔️')}
      </span>
    ))
  } else {
    emojiContent = preTransform
      ? (weapon.slots?.[0]?.blueprint?.emoji || weapon.emoji)
      : weapon.emoji
  }

  return (
    <div className={classNames} style={glowStyle}>
      <div className={styles.weaponLabel}>{label}</div>
      <div
        key={secretRevealed ? 'emoji-secret' : 'emoji-normal'}
        className={`${styles.weaponEmoji} ${secretRevealed && weapon.isSecret ? styles.secretEmojiReveal : ''}`}
      >
        {emojiContent}
      </div>
      <div
        key={secretRevealed ? 'name-secret' : 'name-normal'}
        className={`${styles.weaponName} ${secretRevealed && weapon.isSecret ? styles.secretNameReveal : ''}`}
      >
        {displayName}
      </div>
      <div className={styles.weaponPower}>
        <span className={styles.powerIcon}>⚔</span>
        <span key={power} className={styles.powerNum}>{power}</span>
      </div>
      {secretRevealed && weapon.isSecret && (
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

const CHIP_FIRST_DELAY   = 450  // ms after card reveal before first chip
const CHIP_INTERVAL      = 500  // ms between each chip pop-in
const SCORE_DELAY        = 230  // ms after chip pop-in before score updates
const SECRET_REVEAL_DELAY = 420 // ms after last score before weapon transforms

export default function CombatArena({ playerWeapon, aiWeapon, onResolve, weaponSlots = [], artefactSlots = [] }) {
  const [step, setStep] = useState(0)
  const [revealedChipCount, setRevealedChipCount] = useState(0)
  const [scoredChipCount, setScoredChipCount]     = useState(0)
  const [secretRevealed, setSecretRevealed]       = useState(false)

  // Computed once — slots don't change during combat
  const [bonusChips] = useState(() => buildBonusChips([...weaponSlots, ...artefactSlots]))

  // Score only counts chips that have "landed" (delayed after reveal)
  const displayedPower = bonusChips.length > 0
    ? bonusChips.slice(0, scoredChipCount).reduce((sum, c) => sum + (c.delta || 0), 0)
    : null

  const result = playerWeapon.power > aiWeapon.power ? 'win'
    : playerWeapon.power < aiWeapon.power ? 'lose' : 'tie'

  useEffect(() => {
    setStep(0)
    setRevealedChipCount(0)
    setScoredChipCount(0)
    setSecretRevealed(false)

    const timers = []
    bonusChips.forEach((_, i) => {
      const revealAt = CHIP_FIRST_DELAY + i * CHIP_INTERVAL
      const scoreAt  = revealAt + SCORE_DELAY
      timers.push(setTimeout(() => setRevealedChipCount(i + 1), revealAt))
      timers.push(setTimeout(() => setScoredChipCount(i + 1),   scoreAt))
    })

    const lastScoreTime = bonusChips.length > 0
      ? CHIP_FIRST_DELAY + (bonusChips.length - 1) * CHIP_INTERVAL + SCORE_DELAY
      : 0

    // Secret weapon transformation: triggered after all chips are scored
    if (playerWeapon.isSecret) {
      timers.push(setTimeout(() => setSecretRevealed(true), lastScoreTime + SECRET_REVEAL_DELAY))
    }

    // AI reveal waits for the full show (extra time if secret transformation)
    const readyTime = playerWeapon.isSecret
      ? lastScoreTime + SECRET_REVEAL_DELAY + 900
      : lastScoreTime

    timers.push(setTimeout(() => setStep(1), Math.max(1800, readyTime + 500)))
    timers.push(setTimeout(() => setStep(2), Math.max(2800, readyTime + 1500)))
    timers.push(setTimeout(() => setStep(3), Math.max(4200, readyTime + 2900)))

    return () => timers.forEach(clearTimeout)
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
            secretRevealed={secretRevealed}
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
