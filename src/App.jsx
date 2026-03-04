import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useGameState } from './hooks/useGameState.js'
import StatusBar from './components/StatusBar/StatusBar.jsx'
import HandArea from './components/HandArea/HandArea.jsx'
import ForgeArea from './components/ForgeArea/ForgeArea.jsx'
import CombatArena from './components/CombatArena/CombatArena.jsx'
import ResultOverlay from './components/ResultOverlay/ResultOverlay.jsx'
import BlueprintPhase from './components/BlueprintPhase/BlueprintPhase.jsx'
import BlueprintCard from './components/BlueprintCard/BlueprintCard.jsx'
import Card from './components/Card/Card.jsx'
import styles from './App.module.css'

function MenuScreen({ onStart }) {
  return (
    <div className={styles.menu}>
      <div className={styles.menuContent}>
        <div className={styles.menuLogo}>⚔️</div>
        <h1 className={styles.menuTitle}>Forge <span>&amp;</span> Fight</h1>
        <p className={styles.menuSubtitle}>
          Choisissez vos blueprints, forgez vos armes, affrontez l'IA.
          Atteignez 10 victoires avant de perdre vos 4 points de vie.
        </p>
        <div className={styles.menuRules}>
          <div className={styles.ruleItem}>📜 2 blueprints proposés par round</div>
          <div className={styles.ruleItem}>🃏 5 cartes tirées, 3 crédits</div>
          <div className={styles.ruleItem}>⚔️ Armes lourdes débloquées à 4 victoires</div>
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
        ✨ Nouveaux matériaux + armes lourdes débloqués !
      </div>
    )
  }
  if (wins === 7) {
    return (
      <div className={styles.unlockBanner}>
        🌟 Artefacts débloqués — synergies rares disponibles !
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
    placeBlueprint,
    confirmBlueprints,
    selectSlot,
    applyElement,
    removeElement,
    forge,
    resolveCombat,
  } = useGameState()

  const {
    phase, round, playerHP, playerWins, credits, carryOverCredits,
    pendingCarryOver, playerHand,
    drawnBlueprints, blueprintPlacements,
    weaponSlots, artefactSlots, focusedSlotKey,
    playerTotalPower, playerWeapon, aiWeapon,
    roundResult, gameResult, newMaterialsUnlocked,
  } = state

  const isForgePhase = phase === 'draw' || phase === 'forge'

  // Focused slot object (for HandArea)
  const allSlots = [...weaponSlots, ...(artefactSlots || [])]
  const focusedSlot = allSlots.find(s => s.key === focusedSlotKey) || null

  // Drag & Drop state
  const [activeItem, setActiveItem] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  )

  function handleDragStart(event) {
    setActiveItem(event.active.data.current || null)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveItem(null)
    if (!over) return

    const dragData = active.data.current
    const dropData = over.data.current
    if (!dragData || !dropData) return

    const slotKey = dropData.slotKey
    if (dragData.type === 'blueprint') {
      placeBlueprint(dragData.blueprintId, slotKey)
    } else if (dragData.type === 'element') {
      applyElement(dragData.cardIndex, slotKey)
    }
  }

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
        carryOverCredits={carryOverCredits}
        phase={phase}
      />

      <main className={styles.main}>
        {newMaterialsUnlocked && <UnlockBanner wins={playerWins} />}

        {phase === 'blueprint' && (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <BlueprintPhase
              drawnBlueprints={drawnBlueprints}
              blueprintPlacements={blueprintPlacements}
              weaponSlots={weaponSlots}
              artefactSlots={artefactSlots || []}
              round={round}
              onPlace={placeBlueprint}
              onConfirm={confirmBlueprints}
            />
            <DragOverlay>
              {activeItem?.type === 'blueprint' && (
                <BlueprintCard
                  blueprint={drawnBlueprints.find(bp => bp.id === activeItem.blueprintId)}
                />
              )}
            </DragOverlay>
          </DndContext>
        )}

        {isForgePhase && (
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className={styles.forgeLayout}>
              <HandArea
                hand={playerHand}
                onCardClick={applyElement}
                disabled={phase !== 'draw' && phase !== 'forge'}
                credits={credits}
                focusedSlotKey={focusedSlotKey}
                focusedSlot={focusedSlot}
              />

              <div className={styles.divider}>
                <span className={styles.arrow}>↓</span>
              </div>

              <ForgeArea
                weaponSlots={weaponSlots}
                artefactSlots={artefactSlots || []}
                focusedSlotKey={focusedSlotKey}
                onSelectSlot={selectSlot}
                onRemoveElement={removeElement}
                onForge={forge}
                credits={credits}
                pendingCarryOver={pendingCarryOver}
              />
            </div>
            <DragOverlay>
              {activeItem?.type === 'element' && playerHand[activeItem.cardIndex] && (
                <Card cardId={playerHand[activeItem.cardIndex].id} />
              )}
            </DragOverlay>
          </DndContext>
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
              {roundResult === 'win' && `${playerTotalPower ?? playerWeapon?.power} vs ${aiWeapon?.power} — +1 victoire`}
              {roundResult === 'lose' && `${playerTotalPower ?? playerWeapon?.power} vs ${aiWeapon?.power} — −1 vie`}
              {roundResult === 'tie' && `${playerTotalPower ?? playerWeapon?.power} = ${aiWeapon?.power} — −0.5 vie`}
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
