import { useReducer, useCallback } from 'react'
import { MATERIALS } from '../data/materials.js'
import { drawCards, drawBlueprints } from '../utils/deckManager.js'
import { forgeSlot } from '../utils/forgeEngine.js'
import { aiForge } from '../utils/aiLogic.js'

const CREDITS_PER_ROUND = 3
const MAX_HP = 4
const WIN_TARGET = 10

function makeWeaponSlot(index, blueprint = null) {
  return { key: `weapon-${index}`, blueprint, elements: [], power: 0, breakdown: null }
}

function makeArtefactSlot(index, blueprint = null) {
  return { key: `artefact-${index}`, blueprint, elements: [], power: 0, breakdown: null }
}

function targetWeaponCount(round) {
  return round >= 4 ? 2 : 1
}

function computePendingCarryOver(weaponSlots, artefactSlots) {
  const allElements = [
    ...weaponSlots.flatMap(s => s.elements),
    ...artefactSlots.flatMap(s => s.elements),
  ]
  return allElements.reduce((sum, card) => sum + (MATERIALS[card.id].carryOver || 0), 0)
}

const initialState = {
  phase: 'menu', // 'menu'|'blueprint'|'draw'|'forge'|'combat'|'result'|'gameover'
  round: 1,
  playerHP: MAX_HP,
  playerWins: 0,
  credits: CREDITS_PER_ROUND,
  carryOverCredits: 0,
  pendingCarryOver: 0,
  playerHand: [],
  // Blueprint system
  drawnBlueprints: [],
  blueprintPlacements: 0,
  weaponSlots: [makeWeaponSlot(0)],
  artefactSlots: [],
  focusedSlotKey: null,
  playerTotalPower: null,
  playerWeapon: null,
  aiWeapon: null,
  aiHand: [],
  aiSelectedCards: [],
  roundResult: null,
  lastRoundResult: null,
  gameResult: null,
  secretRecipeFound: null,
  newMaterialsUnlocked: false,
}

function gameReducer(state, action) {
  switch (action.type) {

    case 'START_GAME': {
      const blueprints = drawBlueprints(1)
      return {
        ...initialState,
        phase: 'blueprint',
        drawnBlueprints: blueprints,
        weaponSlots: [makeWeaponSlot(0)],
        artefactSlots: [],
      }
    }

    case 'START_ROUND': {
      const earned = state.carryOverCredits
      const newMaterialsUnlocked = state.playerWins === 4 || state.playerWins === 7
      const count = targetWeaponCount(state.round)

      // Persist blueprints, clear elements; expand slots if threshold reached
      const existingWeapon = state.weaponSlots
      const newWeaponSlots = []
      for (let i = 0; i < count; i++) {
        const existing = existingWeapon[i]
        // Only keep blueprint if it fits (heavy weapons occupy single slot)
        const keepBp = existing?.blueprint
          && (existing.blueprint.slotsRequired === 1 || count === 1)
          ? existing.blueprint
          : null
        newWeaponSlots.push(makeWeaponSlot(i, keepBp))
      }

      // Artefact slot: available from round 7
      const artefactSlots = state.round >= 7
        ? [makeArtefactSlot(0, state.artefactSlots[0]?.blueprint || null)]
        : state.artefactSlots.length > 0
          ? [makeArtefactSlot(0, state.artefactSlots[0]?.blueprint || null)]
          : []

      const blueprints = drawBlueprints(state.round)

      return {
        ...state,
        phase: 'blueprint',
        credits: CREDITS_PER_ROUND + earned,
        carryOverCredits: 0,
        pendingCarryOver: 0,
        playerHand: [],
        weaponSlots: newWeaponSlots,
        artefactSlots,
        drawnBlueprints: blueprints,
        blueprintPlacements: 0,
        focusedSlotKey: null,
        playerTotalPower: null,
        playerWeapon: null,
        aiWeapon: null,
        aiHand: [],
        aiSelectedCards: [],
        roundResult: null,
        secretRecipeFound: null,
        newMaterialsUnlocked,
      }
    }

    case 'PLACE_BLUEPRINT': {
      if (state.blueprintPlacements >= 2) return state
      const blueprint = state.drawnBlueprints.find(bp => bp.id === action.blueprintId)
      if (!blueprint) return state

      // Artefact blueprint — must target an artefact slot
      if (blueprint.category === 'artefact') {
        const targetKey = action.slotKey
        const targetSlot = state.artefactSlots.find(s => s.key === targetKey)
        if (!targetSlot) return state  // can't place artefact in weapon slot
        return {
          ...state,
          artefactSlots: state.artefactSlots.map(s =>
            s.key === targetKey ? { ...s, blueprint, elements: [] } : s
          ),
          blueprintPlacements: state.blueprintPlacements + 1,
        }
      }

      // Weapon blueprint — must target a weapon slot
      if (action.slotKey && action.slotKey.startsWith('artefact')) return state

      // Heavy blueprint: single slot spanning both
      if (blueprint.slotsRequired === 2) {
        return {
          ...state,
          weaponSlots: [makeWeaponSlot(0, blueprint)],
          blueprintPlacements: state.blueprintPlacements + 1,
        }
      }

      // Light blueprint
      const count = targetWeaponCount(state.round)
      let slots = [...state.weaponSlots]
      // If currently a single heavy-weapon slot, restore to standard count
      if (slots.length < count) {
        slots = Array.from({ length: count }, (_, i) =>
          slots[i] ? makeWeaponSlot(i, null) : makeWeaponSlot(i)
        )
      }

      return {
        ...state,
        weaponSlots: slots.map(s =>
          s.key === action.slotKey ? { ...s, blueprint, elements: [] } : s
        ),
        blueprintPlacements: state.blueprintPlacements + 1,
      }
    }

    case 'CONFIRM_BLUEPRINTS': {
      const hand = drawCards(state.playerWins)
      return {
        ...state,
        phase: 'draw',
        playerHand: hand,
      }
    }

    case 'SELECT_SLOT': {
      const next = state.focusedSlotKey === action.slotKey ? null : action.slotKey
      return { ...state, focusedSlotKey: next }
    }

    case 'APPLY_ELEMENT': {
      const targetKey = action.slotKey || state.focusedSlotKey
      if (!targetKey) return state
      const card = state.playerHand[action.cardIndex]
      if (!card) return state

      // Find focused slot
      const allSlots = [...state.weaponSlots, ...state.artefactSlots]
      const slot = allSlots.find(s => s.key === targetKey)
      if (!slot || !slot.blueprint) return state
      if (slot.elements.length >= slot.blueprint.elementSlots) return state

      const cost = MATERIALS[card.id].creditCost ?? 1
      if (state.credits < cost) return state

      const update = s => s.key === targetKey
        ? { ...s, elements: [...s.elements, card] }
        : s

      const newWeaponSlots = state.weaponSlots.map(update)
      const newArtefactSlots = state.artefactSlots.map(update)
      const pending = computePendingCarryOver(newWeaponSlots, newArtefactSlots)

      return {
        ...state,
        phase: 'forge',
        playerHand: state.playerHand.filter((_, i) => i !== action.cardIndex),
        weaponSlots: newWeaponSlots,
        artefactSlots: newArtefactSlots,
        credits: state.credits - cost,
        pendingCarryOver: pending,
      }
    }

    case 'REMOVE_ELEMENT': {
      const slot = [...state.weaponSlots, ...state.artefactSlots]
        .find(s => s.key === action.slotKey)
      if (!slot) return state
      const card = slot.elements[action.elementIndex]
      if (!card) return state

      const cost = MATERIALS[card.id].creditCost ?? 1
      const update = s => s.key === action.slotKey
        ? { ...s, elements: s.elements.filter((_, i) => i !== action.elementIndex) }
        : s

      const newWeaponSlots = state.weaponSlots.map(update)
      const newArtefactSlots = state.artefactSlots.map(update)
      const pending = computePendingCarryOver(newWeaponSlots, newArtefactSlots)
      const phase = [...newWeaponSlots, ...newArtefactSlots].every(s => s.elements.length === 0)
        ? 'draw'
        : state.phase

      return {
        ...state,
        phase,
        weaponSlots: newWeaponSlots,
        artefactSlots: newArtefactSlots,
        playerHand: [...state.playerHand, card],
        credits: state.credits + cost,
        pendingCarryOver: pending,
      }
    }

    case 'FORGE': {
      const hasBlueprint = state.weaponSlots.some(s => s.blueprint) || state.artefactSlots.some(s => s.blueprint)
      if (!hasBlueprint) return state

      const allElements = [
        ...state.weaponSlots.flatMap(s => s.elements),
        ...state.artefactSlots.flatMap(s => s.elements),
      ]
      const context = {
        lastRoundResult: state.lastRoundResult,
        playerHP: state.playerHP,
        allElements,
      }

      const computedWeaponSlots = state.weaponSlots.map(s => ({
        ...s,
        ...forgeSlot(s.blueprint, s.elements, context),
      }))
      const computedArtefactSlots = state.artefactSlots.map(s => ({
        ...s,
        ...forgeSlot(s.blueprint, s.elements, context),
      }))

      // Gourdin carry-over: 1 per gourdin blueprint in weapon slots
      const gourdinCarry = computedWeaponSlots.filter(s => s.blueprint?.special === 'carry_over_1').length

      const playerTotalPower = [
        ...computedWeaponSlots,
        ...computedArtefactSlots,
      ].reduce((sum, s) => sum + (s.power || 0), 0)

      const secretSlot = computedWeaponSlots.find(s => s.isSecret) || computedArtefactSlots.find(s => s.isSecret)
      const primarySlot = computedWeaponSlots[0] || {}

      const playerWeapon = {
        power: playerTotalPower,
        name: computedWeaponSlots.map(s => s.name || s.blueprint?.name || '?').join(' + '),
        emoji: primarySlot.emoji || primarySlot.blueprint?.emoji || '⚔️',
        materials: allElements.map(c => c.id),
        isSecret: !!secretSlot,
        recipe: secretSlot?.recipe || null,
        glowColor: secretSlot?.glowColor || null,
        slots: computedWeaponSlots,
        artefactSlots: computedArtefactSlots,
      }

      const aiResult = aiForge(state.round, state.playerWins)

      return {
        ...state,
        phase: 'combat',
        weaponSlots: computedWeaponSlots,
        artefactSlots: computedArtefactSlots,
        playerTotalPower,
        playerWeapon,
        aiWeapon: aiResult.weapon,
        aiHand: aiResult.hand,
        aiSelectedCards: aiResult.selectedCards,
        secretRecipeFound: secretSlot?.recipe || null,
        pendingCarryOver: state.pendingCarryOver + gourdinCarry,
      }
    }

    case 'RESOLVE_COMBAT': {
      const { playerTotalPower, aiWeapon, pendingCarryOver } = state
      const playerPower = playerTotalPower ?? state.playerWeapon?.power ?? 0

      let result, newHP = state.playerHP, newWins = state.playerWins
      if (playerPower > aiWeapon.power) {
        result = 'win'; newWins += 1
      } else if (playerPower < aiWeapon.power) {
        result = 'lose'; newHP -= 1
      } else {
        result = 'tie'; newHP -= 0.5
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
        lastRoundResult: result,
        gameResult,
        round: state.round + 1,
        carryOverCredits: pendingCarryOver,
      }
    }

    default:
      return state
  }
}

export function useGameState() {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  const startGame = useCallback(() => dispatch({ type: 'START_GAME' }), [])
  const startRound = useCallback(() => dispatch({ type: 'START_ROUND' }), [])
  const placeBlueprint = useCallback((blueprintId, slotKey) => dispatch({ type: 'PLACE_BLUEPRINT', blueprintId, slotKey }), [])
  const confirmBlueprints = useCallback(() => dispatch({ type: 'CONFIRM_BLUEPRINTS' }), [])
  const selectSlot = useCallback((slotKey) => dispatch({ type: 'SELECT_SLOT', slotKey }), [])
  const applyElement = useCallback((cardIndex, slotKey) => dispatch({ type: 'APPLY_ELEMENT', cardIndex, slotKey }), [])
  const removeElement = useCallback((slotKey, elementIndex) => dispatch({ type: 'REMOVE_ELEMENT', slotKey, elementIndex }), [])
  const forge = useCallback(() => dispatch({ type: 'FORGE' }), [])
  const resolveCombat = useCallback(() => dispatch({ type: 'RESOLVE_COMBAT' }), [])

  return {
    state,
    startGame, startRound,
    placeBlueprint, confirmBlueprints,
    selectSlot, applyElement, removeElement,
    forge, resolveCombat,
  }
}
