import { MATERIALS } from '../data/materials.js'
import { SECRET_RECIPES } from '../data/recipes.js'
import { BLUEPRINTS, LIGHT_BLUEPRINT_IDS } from '../data/blueprints.js'
import { drawCards, drawBlueprints } from './deckManager.js'
import { forgeSlot } from './forgeEngine.js'

// ── Shared helpers ────────────────────────────────────────────────────────

// Garantit toujours 2 blueprints d'arme (non-artefact) pour l'IA
// Si des artefacts sont tirés, on les remplace par des light blueprints aléatoires
function drawWeaponBps(round) {
  const all = drawBlueprints(round)
  const weapons = all.filter(bp => bp.category !== 'artefact')
  while (weapons.length < 2) {
    const fallback = BLUEPRINTS[LIGHT_BLUEPRINT_IDS[Math.floor(Math.random() * LIGHT_BLUEPRINT_IDS.length)]]
    weapons.push(fallback)
  }
  return weapons
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

// Picks cards accounting for blueprint special bonus
function pickCardsForSpecial(hand, blueprint, count) {
  if (count <= 0 || hand.length === 0) return []
  const { special } = blueprint

  if (special === 'fire_bonus') {
    return [...hand]
      .sort((a, b) => {
        const aB = (a.id === 'fire' || a.id === 'lightning') ? 10 : 0
        const bB = (b.id === 'fire' || b.id === 'lightning') ? 10 : 0
        return (bB + MATERIALS[b.id].power) - (aB + MATERIALS[a.id].power)
      })
      .slice(0, count)
  }

  if (special === 'rune_bonus') {
    return [...hand]
      .sort((a, b) => {
        const aB = a.id === 'rune' ? 8 : 0
        const bB = b.id === 'rune' ? 8 : 0
        return (bB + MATERIALS[b.id].power) - (aB + MATERIALS[a.id].power)
      })
      .slice(0, count)
  }

  if (special === 'diversity') {
    const sorted = [...hand].sort((a, b) => MATERIALS[b.id].power - MATERIALS[a.id].power)
    const picked = []
    const usedIds = new Set()
    for (const card of sorted) {
      if (!usedIds.has(card.id) && picked.length < count) {
        picked.push(card)
        usedIds.add(card.id)
      }
    }
    // Fill remaining with best power
    for (const card of sorted) {
      if (!picked.includes(card) && picked.length < count) picked.push(card)
    }
    return picked
  }

  return pickBestCards(hand, count)
}

function mergeWeapons(r1, r2) {
  return { ...r1, power: r1.power + r2.power, name: `${r1.name || '?'} + ${r2.name || '?'}` }
}

// ── Easy — comportement original préservé exactement ─────────────────────

function aiForgeEasy(round, wins) {
  function getLevel(r) {
    if (r <= 3) return 1
    if (r <= 6) return 2
    return 3
  }
  const hand = drawCards(wins, 3)
  const level = getLevel(round)
  const [blueprint] = drawWeaponBps(round)

  let selectedCards
  if (level >= 3) {
    const secret = blueprint.elementSlots === 3 ? trySecretRecipe(hand) : null
    selectedCards = secret || pickBestCards(hand, Math.min(blueprint.elementSlots, hand.length))
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
  const variance = level === 1 ? (Math.random() - 0.5) * 2 : (Math.random() - 0.5)
  const weapon = { ...result, power: Math.max(1, Math.round(result.power + variance)), slots: [{ ...result, blueprint }], materials: selectedCards.map(c => c.id) }
  return { hand, selectedCards, weapon }
}

// ── Normal — sélection optimale, multi-slots dès round 4 ─────────────────

function aiForgeNormal(round, wins) {
  const hand = drawCards(wins, 4)
  const bpPool = drawWeaponBps(round)

  // Pick better blueprint by basePower
  const [primary, secondary] = bpPool.length < 2 || bpPool[0].basePower >= bpPool[1].basePower
    ? [bpPool[0], bpPool[1]]
    : [bpPool[1], bpPool[0]]

  const secret = primary.elementSlots === 3 ? trySecretRecipe(hand) : null
  const selectedCards = secret || pickCardsForSpecial(hand, primary, Math.min(primary.elementSlots, hand.length))
  const result = forgeSlot(primary, selectedCards)

  // Second slot from round 4 (only light weapon blueprints, 1 slot each)
  if (round >= 4 && secondary && primary.slotsRequired === 1 && secondary.slotsRequired === 1 && secondary.category !== 'artefact') {
    const usedUids = new Set(selectedCards.map(c => c.uid))
    const remaining = hand.filter(c => !usedUids.has(c.uid))
    const selected2 = pickBestCards(remaining, Math.min(secondary.elementSlots, remaining.length))
    const result2 = forgeSlot(secondary, selected2)
    const weapon = {
      ...mergeWeapons(result, result2),
      power: Math.max(1, result.power + result2.power),
      slots: [{ ...result, blueprint: primary }, { ...result2, blueprint: secondary }],
      materials: [...selectedCards, ...selected2].map(c => c.id),
    }
    return { hand, selectedCards, weapon }
  }

  return { hand, selectedCards, weapon: { ...result, power: Math.max(1, result.power), slots: [{ ...result, blueprint: primary }], materials: selectedCards.map(c => c.id) } }
}

// ── Hard — optimisation complète + scaling par round ─────────────────────

function aiForgeHard(round, wins, playerHP, lastRoundResult) {
  const hand = drawCards(wins, 5)
  const bpPool = drawWeaponBps(round)
  const context = { playerHP, lastRoundResult, allElements: hand }

  function estimateValue(bp) {
    let score = bp.basePower
    if (bp.special === 'fire_bonus' && hand.some(c => c.id === 'fire' || c.id === 'lightning')) score += 2
    if (bp.special === 'rune_bonus') score += hand.filter(c => c.id === 'rune').length * 2
    if (bp.special === 'diversity') score += Math.min(bp.elementSlots, new Set(hand.map(c => c.id)).size)
    if (bp.special === 'vengeance') score += lastRoundResult === 'lose' ? 5 : 2
    if (bp.special === 'bloodstone') score += Math.min(6, (4 - (playerHP ?? 4)) * 2)
    if (bp.special === 'recipe_bonus') score += 4
    return score
  }

  const [primary, secondary] = bpPool.length < 2 || estimateValue(bpPool[0]) >= estimateValue(bpPool[1])
    ? [bpPool[0], bpPool[1]]
    : [bpPool[1], bpPool[0]]

  const secret = primary.elementSlots === 3 ? trySecretRecipe(hand) : null
  const selectedCards = secret || pickCardsForSpecial(hand, primary, Math.min(primary.elementSlots, hand.length))
  const result = forgeSlot(primary, selectedCards, context)

  // Scaling: +1 par tranche de 3 rounds (round 4→+1, round 7→+2, round 10→+3)
  const scalingBonus = Math.floor((round - 1) / 3)

  let weapon
  if (round >= 4 && secondary && primary.slotsRequired === 1 && secondary.slotsRequired === 1 && secondary.category !== 'artefact') {
    const usedUids = new Set(selectedCards.map(c => c.uid))
    const remaining = hand.filter(c => !usedUids.has(c.uid))
    const selected2 = pickCardsForSpecial(remaining, secondary, Math.min(secondary.elementSlots, remaining.length))
    const result2 = forgeSlot(secondary, selected2, context)
    weapon = {
      ...mergeWeapons(result, result2),
      power: result.power + result2.power + scalingBonus,
      slots: [{ ...result, blueprint: primary }, { ...result2, blueprint: secondary }],
      materials: [...selectedCards, ...selected2].map(c => c.id),
    }
  } else {
    weapon = { ...result, power: result.power + scalingBonus, slots: [{ ...result, blueprint: primary }], materials: selectedCards.map(c => c.id) }
  }

  // Légère variance positive (0 à +1)
  weapon.power = Math.max(1, Math.round(weapon.power + Math.random()))
  return { hand, selectedCards, weapon }
}

// ── Point d'entrée ────────────────────────────────────────────────────────

export function aiForge(round, wins, difficulty = 'easy', playerHP = 4, lastRoundResult = null) {
  if (difficulty === 'normal') return aiForgeNormal(round, wins)
  if (difficulty === 'hard')   return aiForgeHard(round, wins, playerHP, lastRoundResult)
  return aiForgeEasy(round, wins)
}
