import { MATERIALS } from '../data/materials.js'
import { SECRET_RECIPES } from '../data/recipes.js'
import { drawCards, drawBlueprints } from './deckManager.js'
import { forgeSlot } from './forgeEngine.js'

function getAiLevel(round) {
  if (round <= 3) return 1
  if (round <= 6) return 2
  return 3
}

function trySecretRecipe(hand) {
  const ids = hand.map(c => c.id)
  for (const recipe of SECRET_RECIPES) {
    const needed = [...recipe.ingredients]
    const available = [...ids]
    const canMake = needed.every(ing => {
      const idx = available.indexOf(ing)
      if (idx === -1) return false
      available.splice(idx, 1)
      return true
    })
    if (canMake) {
      const usedCards = []
      const remaining = [...hand]
      for (const ing of recipe.ingredients) {
        const idx = remaining.findIndex(c => c.id === ing)
        usedCards.push(remaining[idx])
        remaining.splice(idx, 1)
      }
      return usedCards
    }
  }
  return null
}

function pickBestCards(hand, count) {
  return [...hand]
    .sort((a, b) => MATERIALS[b.id].power - MATERIALS[a.id].power)
    .slice(0, count)
}

export function aiForge(round, wins) {
  const hand = drawCards(wins, 3)
  const level = getAiLevel(round)

  // Pick a random available blueprint
  const [blueprint] = drawBlueprints(round)

  let selectedCards

  if (level >= 3) {
    const secret = blueprint.elementSlots === 3 ? trySecretRecipe(hand) : null
    if (secret) {
      selectedCards = secret
    } else {
      selectedCards = pickBestCards(hand, Math.min(blueprint.elementSlots, hand.length))
    }
  } else if (level === 2) {
    const count = Math.min(
      blueprint.elementSlots > 0 ? (Math.random() < 0.6 ? blueprint.elementSlots : blueprint.elementSlots - 1) : 0,
      hand.length
    )
    selectedCards = pickBestCards(hand, Math.max(0, count))
  } else {
    const max = Math.min(blueprint.elementSlots, hand.length)
    const count = Math.max(0, Math.floor(Math.random() * (max + 1)))
    const shuffled = [...hand].sort(() => Math.random() - 0.5)
    selectedCards = shuffled.slice(0, count)
  }

  const result = forgeSlot(blueprint, selectedCards)

  // Add small random variance
  const variance = level === 1 ? (Math.random() - 0.5) * 2 : (Math.random() - 0.5)
  const weapon = {
    ...result,
    power: Math.max(1, Math.round(result.power + variance)),
  }

  return { hand, selectedCards, weapon }
}
