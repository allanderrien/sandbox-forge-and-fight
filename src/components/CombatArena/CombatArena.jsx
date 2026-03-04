import { useState, useEffect } from 'react'
import Card from '../Card/Card.jsx'
import { MATERIALS } from '../../data/materials.js'
import styles from './CombatArena.module.css'

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
      <div className={styles.materialsList}>
        {weapon.materials.map((id, i) => (
          <span key={i} title={MATERIALS[id]?.name}>
            {MATERIALS[id]?.emoji}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function CombatArena({ playerWeapon, aiWeapon, onResolve }) {
  const [step, setStep] = useState(0)
  // 0 = show player weapon, 1 = reveal ai weapon, 2 = show clash, 3 = done

  const result = playerWeapon.power > aiWeapon.power ? 'win'
    : playerWeapon.power < aiWeapon.power ? 'lose' : 'tie'

  useEffect(() => {
    setStep(0)
    const t1 = setTimeout(() => setStep(1), 800)
    const t2 = setTimeout(() => setStep(2), 1800)
    const t3 = setTimeout(() => setStep(3), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const clashClass = step >= 2
    ? (result === 'win' ? styles.win : result === 'lose' ? styles.lose : styles.tie)
    : ''

  return (
    <div className={`${styles.arena} ${step >= 2 ? styles.clashing : ''}`}>
      <div className={styles.combatants}>
        <WeaponCard weapon={playerWeapon} label="Votre arme" revealed={step >= 0} />

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
