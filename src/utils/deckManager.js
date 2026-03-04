import { BASE_DECK, TIER2_MATERIALS } from '../data/materials.js'
import { BLUEPRINTS, LIGHT_BLUEPRINT_IDS, HEAVY_BLUEPRINT_IDS, ARTEFACT_BLUEPRINT_IDS } from '../data/blueprints.js'

export function getAvailableMaterials(wins) {
  if (wins >= 4) return [...BASE_DECK, ...TIER2_MATERIALS]
  return [...BASE_DECK]
}

export function drawCards(wins, count = 5) {
  const pool = getAvailableMaterials(wins)

  // Weight: tier2 materials less frequent early on
  const weights = pool.map(id => {
    if (TIER2_MATERIALS.includes(id)) {
      if (wins < 7) return 1
      return 2
    }
    return 3
  })

  const totalWeight = weights.reduce((a, b) => a + b, 0)
  const cards = []

  for (let i = 0; i < count; i++) {
    let rand = Math.random() * totalWeight
    let idx = 0
    while (rand > weights[idx]) {
      rand -= weights[idx]
      idx++
    }
    cards.push({
      id: pool[idx],
      uid: `${pool[idx]}-${Date.now()}-${i}-${Math.random()}`,
    })
  }

  return cards
}

export function drawBlueprints(round) {
  const pool = [...LIGHT_BLUEPRINT_IDS]
  if (round >= 4) pool.push(...HEAVY_BLUEPRINT_IDS)
  if (round >= 7) pool.push(...ARTEFACT_BLUEPRINT_IDS)

  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 2).map(id => BLUEPRINTS[id])
}
