import styles from './StatusBar.module.css'

function Heart({ filled, half }) {
  if (half) return <span className={`${styles.heart} ${styles.half}`}>♥</span>
  if (filled) return <span className={`${styles.heart} ${styles.filled}`}>♥</span>
  return <span className={`${styles.heart} ${styles.empty}`}>♡</span>
}

function Hearts({ hp, maxHp = 4 }) {
  const hearts = []
  for (let i = 0; i < maxHp; i++) {
    const value = hp - i
    if (value >= 1) hearts.push(<Heart key={i} filled />)
    else if (value === 0.5) hearts.push(<Heart key={i} half />)
    else hearts.push(<Heart key={i} />)
  }
  return <div className={styles.hearts}>{hearts}</div>
}

export default function StatusBar({ round, playerHP, playerWins, credits, carryOverCredits, phase }) {
  const progressPct = (playerWins / 10) * 100

  return (
    <header className={styles.bar}>
      <div className={styles.section}>
        <Hearts hp={playerHP} />
        <span className={styles.label}>Vie</span>
      </div>

      <div className={styles.centerSection}>
        <div className={styles.roundBadge}>Round {round}</div>
        <div className={styles.progressWrapper}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
          <span className={styles.winsLabel}>{playerWins}/10 victoires</span>
        </div>
      </div>

      <div className={styles.section}>
        {phase === 'forge' || phase === 'draw' ? (
          <div className={styles.creditsGroup}>
            <div className={styles.credits}>
              <span className={styles.creditsIcon}>🪙</span>
              <span className={styles.creditsValue}>{credits}</span>
              <span className={styles.label}>crédits</span>
            </div>
            {carryOverCredits > 0 && (
              <div className={styles.carryOver}>
                <span className={styles.carryOverIcon}>🔮</span>
                <span className={styles.carryOverValue}>+{carryOverCredits}</span>
              </div>
            )}
          </div>
        ) : null}
        {phase === 'result' && carryOverCredits > 0 && (
          <div className={styles.carryOverBanner}>
            🪙 +{carryOverCredits} crédit{carryOverCredits > 1 ? 's' : ''} reporté{carryOverCredits > 1 ? 's' : ''}
          </div>
        )}
      </div>
    </header>
  )
}
