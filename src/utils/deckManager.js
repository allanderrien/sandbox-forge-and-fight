import { BASE_DECK, TIER2_MATERIALS } from '../data/materials.js'

export function getAvailableMaterials(wins) {
  if (wins >= 4) return [...BASE_DECK, ...TIER2_MATERIALS]
  return [...BASE_DECK]
}

export function drawCards(wins, count = 3) {
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
