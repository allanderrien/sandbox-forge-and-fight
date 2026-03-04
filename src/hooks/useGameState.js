import { useReducer, useCallback } from 'react'
import { drawCards } from '../utils/deckManager.js'
import { forgeWeapon } from '../utils/forgeEngine.js'
import { aiForge } from '../utils/aiLogic.js'

const CREDITS_PER_ROUND = 3
const MAX_HP = 4
const WIN_TARGET = 10

const initialState = {
  phase: 'menu', // 'menu' | 'draw' | 'forge' | 'combat' | 'result' | 'gameover'
  round: 1,
  playerHP: MAX_HP,
  playerWins: 0,
  credits: CREDITS_PER_ROUND,
  playerHand: [],
  forgeSlots: [],
  playerWeapon: null,
  aiWeapon: null,
  aiHand: [],
  aiSelectedCards: [],
  roundResult: null, // 'win' | 'lose' | 'tie'
  gameResult: null, // 'victory' | 'defeat'
  secretRecipeFound: null,
  newMaterialsUnlocked: false,
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...initialState,
        phase: 'draw',
        playerHand: drawCards(0, 3),
      }

    case 'START_ROUND': {
      const hand = drawCards(state.playerWins, 3)
      const newMaterialsUnlocked = state.playerWins === 4 || state.playerWins === 7

      return {
        ...state,
        phase: 'draw',
        credits: CREDITS_PER_ROUND,
        playerHand: hand,
        forgeSlots: [],
        playerWeapon: null,
        aiWeapon: null,
        aiHand: [],
        aiSelectedCards: [],
        roundResult: null,
        secretRecipeFound: null,
        newMaterialsUnlocked,
      }
    }

    case 'ADD_TO_FORGE': {
      if (state.credits <= 0) return state
      if (state.forgeSlots.length >= 3) return state

      const card = state.playerHand[action.cardIndex]
      if (!card) return state

      const newHand = state.playerHand.filter((_, i) => i !== action.cardIndex)
      return {
        ...state,
        playerHand: newHand,
        forgeSlots: [...state.forgeSlots, card],
        credits: state.credits - 1,
      }
    }

    case 'REMOVE_FROM_FORGE': {
      const card = state.forgeSlots[action.slotIndex]
      if (!card) return state

      const newSlots = state.forgeSlots.filter((_, i) => i !== action.slotIndex)
      return {
        ...state,
        forgeSlots: newSlots,
        playerHand: [...state.playerHand, card],
        credits: Math.min(state.credits + 1, CREDITS_PER_ROUND),
      }
    }

    case 'FORGE': {
      if (state.forgeSlots.length === 0) return state

      const playerWeapon = forgeWeapon(state.forgeSlots)
      const aiResult = aiForge(state.round, state.playerWins)

      return {
        ...state,
        phase: 'combat',
        playerWeapon,
        aiWeapon: aiResult.weapon,
        aiHand: aiResult.hand,
        aiSelectedCards: aiResult.selectedCards,
        secretRecipeFound: playerWeapon.isSecret ? playerWeapon.recipe : null,
      }
    }

    case 'RESOLVE_COMBAT': {
      const { playerWeapon, aiWeapon } = state
      let result
      let newHP = state.playerHP
      let newWins = state.playerWins

      if (playerWeapon.power > aiWeapon.power) {
        result = 'win'
        newWins += 1
      } else if (playerWeapon.power < aiWeapon.power) {
        result = 'lose'
        newHP -= 1
      } else {
        result = 'tie'
        newHP -= 0.5
      }

      let gameResult = null
      if (newWins >= WIN_TARGET) gameResult = 'victory'
      else if (newHP <= 0) gameResult = 'defeat'

      return {
        ...state,
        phase: gameResult ? 'gameover' : 'result',
        playerHP: newHP,
        playerWins: newWins,
        roundResult: result,
        gameResult,
        round: state.round + 1,
      }
    }

    default:
      return state
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const startGame = useCallback(() => dispatch({ type: 'START_GAME' }), [])

  const startRound = useCallback(
    () => dispatch({ type: 'START_ROUND' }),
    []
  )

  const addToForge = useCallback(
    (cardIndex) => dispatch({ type: 'ADD_TO_FORGE', cardIndex }),
    []
  )

  const removeFromForge = useCallback(
    (slotIndex) => dispatch({ type: 'REMOVE_FROM_FORGE', slotIndex }),
    []
  )

  const forge = useCallback(() => dispatch({ type: 'FORGE' }), [])

  const resolveCombat = useCallback(() => dispatch({ type: 'RESOLVE_COMBAT' }), [])

  return {
    state,
    startGame,
    startRound,
    addToForge,
    removeFromForge,
    forge,
    resolveCombat,
  }
}
