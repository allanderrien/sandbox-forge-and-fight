import { MATERIALS } from '../data/materials.js'
import { SECRET_RECIPES } from '../data/recipes.js'
import { drawCards } from './deckManager.js'
import { forgeWeapon } from './forgeEngine.js'

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
      // Return cards in recipe order
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

  let selectedCards

  if (level >= 3) {
    const secret = trySecretRecipe(hand)
    if (secret) {
      selectedCards = secret
    } else {
      selectedCards = pickBestCards(hand, 3)
    }
  } else if (level === 2) {
    // Pick 2 or 3 best cards
    const count = Math.random() < 0.6 ? 3 : 2
    selectedCards = pickBestCards(hand, count)
  } else {
    // Level 1: pick 1 or 2 random
    const count = Math.random() < 0.4 ? 2 : 1
    const shuffled = [...hand].sort(() => Math.random() - 0.5)
    selectedCards = shuffled.slice(0, count)
  }

  const weapon = forgeWeapon(selectedCards)

  // Add small random variance to make it less predictable
  const variance = level === 1 ? (Math.random() - 0.5) * 2 : (Math.random() - 0.5)
  weapon.power = Math.max(1, Math.round(weapon.power + variance))

  return { hand, selectedCards, weapon }
}
