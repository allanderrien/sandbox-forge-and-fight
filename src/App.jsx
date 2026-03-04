import { useEffect } from 'react'
import { useGameState } from './hooks/useGameState.js'
import StatusBar from './components/StatusBar/StatusBar.jsx'
import HandArea from './components/HandArea/HandArea.jsx'
import ForgeArea from './components/ForgeArea/ForgeArea.jsx'
import CombatArena from './components/CombatArena/CombatArena.jsx'
import ResultOverlay from './components/ResultOverlay/ResultOverlay.jsx'
import styles from './App.module.css'

function MenuScreen({ onStart }) {
  return (
    <div className={styles.menu}>
      <div className={styles.menuContent}>
        <div className={styles.menuLogo}>⚔️</div>
        <h1 className={styles.menuTitle}>Forge <span>&amp;</span> Fight</h1>
        <p className={styles.menuSubtitle}>
          Tirez des matériaux, forgez votre arme, affrontez l'IA.
          Atteignez 10 victoires avant de perdre vos 4 points de vie.
        </p>
        <div className={styles.menuRules}>
          <div className={styles.ruleItem}>🃏 3 cartes par round</div>
          <div className={styles.ruleItem}>⚗️ 3 crédits pour combiner</div>
          <div className={styles.ruleItem}>🏆 10 victoires pour gagner</div>
          <div className={styles.ruleItem}>💀 4 défaites = game over</div>
          <div className={styles.ruleItem}>✨ Recettes secrètes = puissance ×2</div>
        </div>
        <button className={styles.startBtn} onClick={onStart}>
          Commencer la partie
        </button>
      </div>
    </div>
  )
}

function UnlockBanner({ wins }) {
  if (wins === 4) {
    return (
      <div className={styles.unlockBanner}>
        ✨ Nouveaux matériaux débloqués : Foudre, Poison, Cristal !
      </div>
    )
  }
  if (wins === 7) {
    return (
      <div className={styles.unlockBanner}>
        🌟 Synergies rares disponibles — les recettes secrètes apparaissent plus souvent !
      </div>
    )
  }
  return null
}

export default function App() {
  const {
    state,
    startGame,
    startRound,
    addToForge,
    removeFromForge,
    forge,
    resolveCombat,
  } = useGameState()

  const { phase, round, playerHP, playerWins, credits, playerHand, forgeSlots,
    playerWeapon, aiWeapon, roundResult, gameResult, newMaterialsUnlocked } = state

  const isForgePhase = phase === 'draw' || phase === 'forge'

  if (phase === 'menu') {
    return <MenuScreen onStart={startGame} />
  }

  return (
    <div className={styles.app}>
      <StatusBar
        round={round}
        playerHP={playerHP}
        playerWins={playerWins}
        credits={credits}
        phase={phase}
      />

      <main className={styles.main}>
        {newMaterialsUnlocked && <UnlockBanner wins={playerWins} />}

        {isForgePhase && (
          <div className={styles.forgeLayout}>
            <HandArea
              hand={playerHand}
              onCardClick={addToForge}
              disabled={phase !== 'draw' && phase !== 'forge'}
              credits={credits}
            />

            <div className={styles.divider}>
              <span className={styles.arrow}>↓</span>
            </div>

            <ForgeArea
              slots={forgeSlots}
              onSlotClick={removeFromForge}
              onForge={forge}
            />
          </div>
        )}

        {phase === 'combat' && (
          <CombatArena
            playerWeapon={playerWeapon}
            aiWeapon={aiWeapon}
            onResolve={resolveCombat}
          />
        )}

        {phase === 'result' && (
          <div className={styles.resultPanel}>
            <div className={`${styles.roundResultBadge} ${styles[roundResult]}`}>
              {roundResult === 'win' && '🏆 Victoire !'}
              {roundResult === 'lose' && '💀 Défaite...'}
              {roundResult === 'tie' && '🤝 Match nul'}
            </div>
            <p className={styles.roundResultSub}>
              {roundResult === 'win' && `${playerWeapon?.power} vs ${aiWeapon?.power} — +1 victoire`}
              {roundResult === 'lose' && `${playerWeapon?.power} vs ${aiWeapon?.power} — −1 vie`}
              {roundResult === 'tie' && `${playerWeapon?.power} = ${aiWeapon?.power} — −0.5 vie`}
            </p>
            <button className={styles.nextRoundBtn} onClick={startRound}>
              Round suivant →
            </button>
          </div>
        )}
      </main>

      {phase === 'gameover' && (
        <ResultOverlay
          result="gameover"
          playerWins={playerWins}
          playerHP={playerHP}
          gameResult={gameResult}
          onRestart={startGame}
        />
      )}
    </div>
  )
}
