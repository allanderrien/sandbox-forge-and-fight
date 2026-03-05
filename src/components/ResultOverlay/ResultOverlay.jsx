import styles from './ResultOverlay.module.css'

export default function ResultOverlay({ result, playerWins, playerHP, onNext, onRestart, onMenu, difficulty }) {
  if (result === 'gameover') {
    const isVictory = playerWins >= 10
    return (
      <div className={`${styles.overlay} ${isVictory ? styles.victory : styles.defeat}`}>
        <div className={styles.content}>
          <div className={styles.bigEmoji}>{isVictory ? '🏆' : '💀'}</div>
          <h1 className={styles.bigTitle}>
            {isVictory ? 'Victoire !' : 'Défaite !'}
          </h1>
          <p className={styles.subtitle}>
            {isVictory
              ? `Vous avez atteint ${playerWins} victoires. La forge vous appartient !`
              : `Vous avez perdu toute votre vie après ${playerWins} victoires.`
            }
          </p>
          <div className={styles.btnRow}>
            <button className={styles.menuBtn} onClick={onMenu}>
              ← Menu
            </button>
            <button className={styles.restartBtn} onClick={() => onRestart(difficulty)}>
              Rejouer
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
